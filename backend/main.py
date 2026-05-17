from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import json
import asyncio
import random
from websocket_manager import manager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agents.crew_setup import run_analysis_crew
from celery.result import AsyncResult
from worker import run_portfolio_crew_task
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
import redis

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="OmniQuant AI Core Engine")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Define CORS constraints to allow React/Next JS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # 1. Initialize Global Cache (Redis)
    try:
        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6380/0")
        r = redis.from_url(redis_url, encoding="utf8", decode_responses=True)
        FastAPICache.init(RedisBackend(r), prefix="fastapi-cache")
        print(f"FastAPI Cache initialized with Redis: {redis_url}")
    except Exception as e:
        print(f"FAILED to initialize Redis Cache: {e}. Falling back to No-Cache mode.")
    
    # 2. Start Background Simulation Loop
    try:
        asyncio.create_task(price_simulation_loop())
    except Exception as e:
        print(f"FAILED to start simulation loop: {e}")

from database import users_db, refresh_tokens, market_data, saved_portfolios, trade_vault, trade_history
from utils.risk_mgmt import calculate_kelly_fraction, suggest_trade_params
import yfinance as yf
from datetime import datetime
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from fastapi import Depends

class PortfolioRequest(BaseModel):
    portfolio_balance: float
    risk_tolerance: str  # e.g. dusuk, dengeli, agresif

class SavePortfolioRequest(BaseModel):
    reserve_cash: float
    allocations: list
    market_sentiment: str = "Nötr"

class ChatMessage(BaseModel):
    message: str

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TradeRequest(BaseModel):
    ticker: str
    side: str  # 'AL' or 'SAT'
    amount_tl: float

class VaultResponse(BaseModel):
    balance: float
    equity: float
    holdings: list
    history: list

class AgentChatRequest(BaseModel):
    agent_id: str
    message: str

@app.get("/")
def read_root():
    return {"status": "OmniQuant AI Master Node Online."}

# --- WEBSOCKET EVENT & BACKGROUND TASK ---
@app.websocket("/ws/market/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Pings or client signals can be logged here
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# Merged into global startup
async def price_simulation_loop():
    """
    Optimized version of the simulation loop: Fetches all prices in one bulk query
    to drastically reduce CPU and DB load.
    """
    from database import ticker_insights
    while True:
        try:
            if not manager.active_connections:
                await asyncio.sleep(5) # Deep sleep when no one is watching
                continue
                
            # Single bulk query for all prices
            insights = await asyncio.to_thread(lambda: list(ticker_insights.find()))
            
            # --- HYBRID JITTER: Only during BIST Market Hours (10:00 - 18:00 Weekdays) ---
            import random
            from datetime import datetime
            
            now = datetime.now()
            is_market_open = now.weekday() < 5 and 10 <= now.hour < 18
            
            live_prices = {}
            for item in insights:
                base_price = item.get("price", 0)
                if base_price > 0:
                    if is_market_open:
                        # Simulated jitter of +/- 0.05%
                        jitter = base_price * (random.uniform(-0.0005, 0.0005))
                        live_prices[item["ticker"]] = round(base_price + jitter, 4)
                    else:
                        # Market closed: Show static EOD/Last price
                        live_prices[item["ticker"]] = round(base_price, 2)
                else:
                    live_prices[item["ticker"]] = 0
            
            if live_prices:
                await manager.broadcast({
                    "type": "PRICE_UPDATE",
                    "data": live_prices
                })
        except Exception as e:
            print(f"Price Broadcast Error: {e}")
            
        await asyncio.sleep(2) # Refresh rate of 2 seconds
# ----------------------------------------

@app.post("/portfolio/save")
def save_portfolio(request: SavePortfolioRequest):
    user_id = "default_user" # No auth required
    try:
        saved_portfolios.delete_many({"user_id": user_id}) # Always keep latest
        
        portfolio_data = request.dict()
        portfolio_data['created_at'] = datetime.now().isoformat()
        portfolio_data['user_id'] = user_id
        
        for alloc in portfolio_data['allocations']:
            if alloc['lots'] > 0:
                alloc['bought_price'] = alloc['amount_tl'] / alloc['lots']
            else:
                alloc['bought_price'] = 0
                
        saved_portfolios.insert_one(portfolio_data)
        return {"status": "success", "message": "Portföy başarıyla kaydedildi."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/portfolio/saved")
def get_saved_portfolio():
    user_id = "default_user" # No auth required
    saved = saved_portfolios.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    if not saved:
        return {"status": "error", "message": "Kayıtlı portföy bulunamadı."}
        
    saved['_id'] = str(saved['_id'])
    
    total_current_value = saved['reserve_cash']
    total_cost = saved['reserve_cash']
    
    for alloc in saved['allocations']:
        ticker = alloc['ticker']
        latest = market_data.find_one({"ticker": ticker}, sort=[("date", -1)])
        current_price = latest['close'] if latest else alloc['bought_price']
        
        alloc['current_price'] = round(current_price, 2)
        
        cost_value = alloc['amount_tl']
        current_value = alloc['lots'] * current_price
        
        pnl_tl = current_value - cost_value
        pnl_percent = (pnl_tl / cost_value * 100) if cost_value > 0 else 0
        
        alloc['pnl_tl'] = round(pnl_tl, 2)
        alloc['pnl_percent'] = round(pnl_percent, 2)
        
        total_current_value += current_value
        total_cost += cost_value
        
    saved['total_cost'] = round(total_cost, 2)
    saved['total_current_value'] = round(total_current_value, 2)
    saved['total_pnl_tl'] = round(total_current_value - total_cost, 2)
    saved['total_pnl_percent'] = round((saved['total_pnl_tl'] / total_cost * 100), 2) if total_cost > 0 else 0
    
    return saved

def get_vault_status():
    """
    Fetches the current virtual balance, holdings (with live P&L), 
    and recent trade history for the Mock Trading Vault.
    """
    vault = trade_vault.find_one({"type": "main_vault"})
    if not vault:
        # Initialize if doesn't exist (100k TL default)
        trade_vault.insert_one({
            "type": "main_vault",
            "balance": 100000.0,
            "holdings": []
        })
        vault = trade_vault.find_one({"type": "main_vault"})

    balance = vault.get("balance", 100000.0)
    holdings = vault.get("holdings", [])
    total_holding_value = 0.0
    
    # Calculate live P&L for each holding using bulk-fetched insights
    enriched_holdings = []
    from database import ticker_insights
    
    # 1. Bulk fetch insights for all held tickers in one go
    ticker_list = [h["ticker"] for h in holdings]
    insights_cursor = ticker_insights.find({"ticker": {"$in": ticker_list}})
    insights_map = {item["ticker"]: item for item in insights_cursor}
    
    for h in holdings:
        ticker = h["ticker"]
        insight = insights_map.get(ticker)
        
        current_price = insight.get("price", h["entry_price"]) if insight else h["entry_price"]
        # Fallback to market_data only if insight is truly missing
        if not insight:
            latest = list(market_data.find({"ticker": ticker}).sort("date", -1).limit(1))
            current_price = latest[0].get("close", 0) if latest else h["entry_price"]
        
        h["current_price"] = round(current_price, 2)
        h["current_value"] = round(h["lots"] * current_price, 2)
        h["pnl_tl"] = round(h["current_value"] - (h["lots"] * h["entry_price"]), 2)
        h["pnl_percent"] = round((h["pnl_tl"] / (h["lots"] * h["entry_price"]) * 100), 2) if h["lots"] > 0 else 0
        
        total_holding_value += h["current_value"]
        enriched_holdings.append(h)
        
    history = list(trade_history.find().sort("timestamp", -1).limit(20))
    # Convert ObjectIDs to strings for JSON
    for item in history:
        item["_id"] = str(item["_id"])

    return {
        "balance": round(balance, 2),
        "holdings_value": round(total_holding_value, 2),
        "total_equity": round(balance + total_holding_value, 2),
        "holdings": enriched_holdings,
        "history": history
    }

@app.get("/portfolio/vault")
@cache(expire=30)
async def fetch_vault():
    return await asyncio.to_thread(get_vault_status)

@app.post("/portfolio/trade")
async def execute_trade(trade: TradeRequest):
    """
    Executes a virtual AL (Buy) or SAT (Sell) trade.
    Updates the vault balance and holdings.
    """
    vault = trade_vault.find_one({"type": "main_vault"})
    if not vault:
        # Auto-init
        get_vault_status()
        vault = trade_vault.find_one({"type": "main_vault"})

    balance = vault["balance"]
    holdings = vault["holdings"]
    
    # Get current price
    ticker = trade.ticker
    latest = list(market_data.find({"ticker": ticker}).sort("date", -1).limit(1))
    if not latest:
        raise HTTPException(status_code=400, detail=f"{ticker} için güncel fiyat bulunamadı.")
    price = latest[0]["close"]
    
    if trade.side == "AL":
        if trade.amount_tl > balance:
            raise HTTPException(status_code=400, detail="Yetersiz bakiye.")
        
        lots = trade.amount_tl / price
        new_balance = balance - trade.amount_tl
        
        # Update holdings (average cost entry)
        found = False
        for h in holdings:
            if h["ticker"] == ticker:
                total_cost = (h["lots"] * h["entry_price"]) + trade.amount_tl
                h["lots"] += lots
                h["entry_price"] = total_cost / h["lots"]
                found = True
                break
        if not found:
            holdings.append({
                "ticker": ticker,
                "lots": lots,
                "entry_price": price
            })
            
    elif trade.side == "SAT":
        # Find holding
        target_h = next((h for h in holdings if h["ticker"] == ticker), None)
        if not target_h or target_h["lots"] <= 0:
            raise HTTPException(status_code=400, detail="Elinizde bu hisseden bulunmuyor.")
            
        # For simplicity, sell the whole position or requested amount? 
        # User requested 'amount_tl', but for SAT it's usually lot-based.
        # We'll use amount_tl as 'sell X TL worth of shares'
        sell_lots = trade.amount_tl / price
        if sell_lots > target_h["lots"] * 1.001: # Small buffer
             sell_lots = target_h["lots"]
        
        sell_value = sell_lots * price
        new_balance = balance + sell_value
        target_h["lots"] -= sell_lots
        
        # Remove if zero
        if target_h["lots"] < 0.01:
            holdings = [h for h in holdings if h["ticker"] != ticker]
            
    # Update DB
    trade_vault.update_one(
        {"type": "main_vault"},
        {"$set": {"balance": new_balance, "holdings": holdings}}
    )
    
    # Record history
    trade_history.insert_one({
        "ticker": ticker,
        "side": trade.side,
        "lots": round(trade.amount_tl / price, 4) if trade.side == "AL" else round(sell_lots, 4),
        "price": price,
        "total_tl": round(trade.amount_tl if trade.side == "AL" else sell_value, 2),
        "timestamp": datetime.now()
    })
    
    return {"status": "success", "message": f"{ticker} için {trade.side} işlemi başarıyla gerçekleşti."}
    
@app.delete("/portfolio/vault/holding")
async def delete_holding_api(ticker: str):
    """
    Deletes a holding entirely and refunds the original cost to balance.
    'Hiç almamış gibi' behavior.
    """
    vault = trade_vault.find_one({"type": "main_vault"})
    if not vault:
         raise HTTPException(status_code=404, detail="Kasa bulunamadı.")
    
    holdings = vault.get("holdings", [])
    target = next((h for h in holdings if h["ticker"] == ticker), None)
    if not target:
        raise HTTPException(status_code=404, detail="Hisse bulunamadı.")
    
    # Refund the original cost
    refund_amount = target["lots"] * target["entry_price"]
    new_balance = vault["balance"] + refund_amount
    new_holdings = [h for h in holdings if h["ticker"] != ticker]
    
    trade_vault.update_one(
        {"type": "main_vault"},
        {"$set": {"balance": new_balance, "holdings": new_holdings}}
    )
    return {"status": "success", "message": f"{ticker} silindi ve tutar iade edildi."}

@app.post("/portfolio/vault/reset")
async def reset_vault_api():
    """
    Resets the simulation to the starting state (100k TL, no holdings, no history).
    """
    trade_vault.update_one(
        {"type": "main_vault"},
        {"$set": {"balance": 100000.0, "holdings": []}}
    )
    from database import trade_history
    trade_history.delete_many({})
    return {"status": "success", "message": "Kasa ve geçmiş başarıyla sıfırlandı."}

@app.post("/portfolio/rebalance")
def rebalance_portfolio():
    saved = get_saved_portfolio()
    if 'status' in saved and saved['status'] == 'error':
        raise HTTPException(status_code=404, detail="Kayıtlı portföy bulunamadı.")

    # --- Hybrid: Enrich each allocation with live technical + BERT sentiment ---
    try:
        from models.sentiment import analyze_sentiment as _analyze
        from data_pipeline.kap_news import fetch_kap_and_insider_news as _kap
        from models.time_series import predict_next_day as _pred

        for alloc in saved.get("allocations", []):
            t = alloc.get("ticker", "")
            try:
                rec = list(market_data.find({"ticker": t}).sort("date", -1).limit(1))
                if rec:
                    doc = rec[0]
                    alloc["rsi"] = round(doc.get("rsi", 0), 2) if doc.get("rsi") else "N/A"
                    alloc["macd"] = round(doc.get("macd", 0), 4) if doc.get("macd") else "N/A"
                    alloc["bb_pct"] = round(doc.get("bb_pct", 0), 3) if doc.get("bb_pct") else "N/A"
                    alloc["obv"] = int(doc.get("obv", 0)) if doc.get("obv") else "N/A"
                    alloc["fib_618"] = round(doc.get("fib_618", 0), 2) if doc.get("fib_618") else "N/A"
                    alloc["ichimoku_tenkan"] = round(doc.get("ichimoku_tenkan", 0), 2) if doc.get("ichimoku_tenkan") else "N/A"

                # LSTM direction
                pred = _pred(t)
                if pred and alloc.get("current_price"):
                    alloc["lstm_direction"] = "Yükseliş" if pred > alloc["current_price"] else "Düşüş"
                    alloc["lstm_predicted"] = round(pred, 2)

                # BERT Sentiment
                kap = _kap(t)
                news = kap.get("latest_company_news", [])
                scores = [_analyze(n.get("title", "")) for n in news[:5] if n.get("title")]
                if scores:
                    avg = round(sum(scores) / len(scores), 3)
                    alloc["sentiment"] = "Pozitif" if avg >= 0.3 else ("Negatif" if avg <= -0.3 else "Nötr")
                    alloc["sentiment_score"] = avg

                # --- NEW: Correlation & Beta (Correlation Matrix) ---
                try:
                    from data_pipeline.correlation import fetch_index_correlation
                    corr = fetch_index_correlation(t)
                    if corr:
                        alloc["beta"] = corr["beta"]
                        alloc["market_correlation"] = corr["corr_xu100"]
                        alloc["relative_strength_90d"] = corr["relative_strength"]
                except:
                    pass
            except Exception as e:
                print(f"[Rebalance] Enrichment error for {t}: {e}")
    except Exception as e:
        print(f"[Rebalance] Enrichment pipeline error: {e}")

    from agents.crew_setup import run_rebalance_crew
    try:
        crew_result = run_rebalance_crew(saved)
        str_res = str(crew_result)
        start_idx = str_res.find('{')
        end_idx = str_res.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            try:
                json_str = str_res[start_idx:end_idx+1]
                return json.loads(json_str)
            except Exception as parse_err:
                print(f"Rebalance JSON Parse Error: {parse_err}")
                pass
                
        # LLM Failed to output conformant JSON, fallback to generic "TUT" (Hold) strategy
        fallback_actions = []
        for alloc in saved.get("allocations", []):
            fallback_actions.append({
                "ticker": alloc.get("ticker", "UNKNOWN"),
                "action": "TUT",
                "reason": "AI sistemi teknik detayları doğrulayamadı. Mevcut konumu korumak güvenli görünüyor."
            })
            
        mock_response = {
            "rebalance_actions": fallback_actions,
            "overall_comment": "Yapay zeka analizini bitiremedi veya sonuçlar ayrıştırılamadı. Riski minimize etmek için mevcut pozisyonlarda 'TUT' tavsiye ediliyor."
        }
        return mock_response
        
    except Exception as e:
        print(f"Rebalance error: {e}")
        raise HTTPException(status_code=500, detail="Rebalance modeli yanıt veremedi.")

@app.get("/api/test-whatsapp")
def test_whatsapp_endpoint():
    try:
        from worker import generate_morning_brief_task
        # Trigger it immediately for testing bypassing the cron
        generate_morning_brief_task.delay()
        return {"status": "WhatsApp test görevi Celery kuyruğuna gönderildi."}
    except Exception as e:
        print(f"Error testing whatsapp: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
@limiter.limit("2/minute")
def trigger_analysis(http_req: Request, request: PortfolioRequest):
    try:
        # Kick off background Celery task
        print(f"Launching Background Task for Balance: {request.portfolio_balance}, Risk: {request.risk_tolerance}")
        task = run_portfolio_crew_task.delay(
            request.portfolio_balance,
            request.risk_tolerance
        )
        return {"task_id": task.id, "status": "processing"}
    except Exception as e:
        print(f"Celery Task Launch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analyze/status/{task_id}")
def get_analysis_status(task_id: str):
    try:
        task = AsyncResult(task_id)
        if task.ready():
            result = task.result # This contains the dict returned from worker
            if isinstance(result, dict) and result.get("status") == "success":
                return {"status": "completed", "data": result.get("data")}
            else:
                return {"status": "error", "message": str(result)}
        else:
            return {"status": "processing"}
    except Exception as e:
        print(f"Celery Status Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from database import market_data
from models.time_series import predict_next_day
from agents.crew_setup import llm
from langchain_core.prompts import PromptTemplate

@app.get("/stocks")
def get_available_stocks():
    try:
        tickers = market_data.distinct("ticker")
        return {
            "stocks": tickers,
            "tickers": tickers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/{ticker}")
def predict_single_stock(ticker: str):
    try:
        # Get latest technical data
        record = list(market_data.find({"ticker": ticker}).sort("date", -1).limit(1))
        if not record:
            raise HTTPException(status_code=404, detail="Hisse verisi bulunamadı.")
            
        latest = record[0]
        current_price = latest.get("close", 0)
        rsi = latest.get("rsi", "N/A")
        macd = latest.get("macd", "N/A")
        
        # Run LSTM Prediction
        predicted_price = predict_next_day(ticker)
        if not predicted_price:
            raise HTTPException(status_code=500, detail="Tahmin oluşturulamadı.")
            
        # Ask LLM (Ollama Llama3.2) for the reasoning
        direction = "Yükseliş" if predicted_price > current_price else "Düşüş"
        
        # --- NEW PHASE 9: Sentiment & KAP Integration ---
        from data_pipeline.kap_news import fetch_kap_and_insider_news
        from models.sentiment import analyze_sentiment
        
        kap_data = fetch_kap_and_insider_news(ticker)
        news_items = kap_data.get("latest_company_news", [])
        
        sentiment_total = 0
        valid_news_count = 0
        analyzed_news = []
        
        for news in news_items:
            # Combine title and source/desc if needed
            text_to_analyze = news.get("title", "")
            score = analyze_sentiment(text_to_analyze)
            sentiment_total += score
            valid_news_count += 1
            
            # Map score to UI friendly label
            lbl = "Nötr"
            if score > 0: lbl = "Pozitif"
            if score < 0: lbl = "Negatif"
                
            news["sentiment_label"] = lbl
            news["sentiment_score"] = score
            analyzed_news.append(news)
            
        avg_sentiment_score = 0
        if valid_news_count > 0:
            avg_sentiment_score = round(sentiment_total / valid_news_count, 2)
            
        sentiment_category = "Nötr"
        if avg_sentiment_score >= 0.3: sentiment_category = "Pozitif"
        if avg_sentiment_score <= -0.3: sentiment_category = "Negatif"

        # --- NEW PHASE 12: Kelly Criterion & Risk Management ---
        # Heuristic confidence: Scale based on predicted move % and sentiment alignment
        price_change_pct = abs((predicted_price - current_price) / current_price) * 100
        
        # Base confidence 50%, increased by price change (up to 20%) and sentiment (up to 20%)
        confidence_base = 50.0
        sentiment_bonus = 20.0 if (avg_sentiment_score > 0 and direction == "Yükseliş") or (avg_sentiment_score < 0 and direction == "Düşüş") else 0
        move_bonus = min(20.0, price_change_pct * 5)
        confidence_score = min(98.0, confidence_base + sentiment_bonus + move_bonus)

        # Volatility estimation (simple std dev placeholder or range-based)
        # For now, let's use a default volatility of 2% for BIST or fetch from last 5 days
        volatility = 0.02 
        trend_strength = abs(avg_sentiment_score) # Proxy for now
        
        risk_params = suggest_trade_params(current_price, volatility, trend_strength)
        kelly_pct = calculate_kelly_fraction(confidence_score, risk_params["tp_pct"], risk_params["sl_pct"])

        # --- NEW PHASE 14: Alternative Data (Macro, Foreign, Correlation, KAP) ---
        from data_pipeline.macro_data import fetch_macroeconomic_data
        from data_pipeline.foreign_ratio import fetch_foreign_ratio
        from data_pipeline.correlation import fetch_index_correlation, fetch_correlation_arbitrage
        from data_pipeline.kap_rss import get_kap_context_for_ticker
        
        macro_report = fetch_macroeconomic_data().get("summary", "Bilinmiyor")
        foreign_ratio = fetch_foreign_ratio(ticker)
        corr_data = fetch_index_correlation(ticker)
        kap_ctx = get_kap_context_for_ticker(ticker, days=7)
        
        # Extended Tech Indicators from doc
        bb_pct = round(latest.get("bb_pct", 0), 3) if latest.get("bb_pct") else "N/A"
        obv = int(latest.get("obv", 0)) if latest.get("obv") else "N/A"
        ichimoku_tenkan = round(latest.get("ichimoku_tenkan", 0), 2) if latest.get("ichimoku_tenkan") else "N/A"
        fib_618 = round(latest.get("fib_618", 0), 2) if latest.get("fib_618") else "N/A"

        # Ask LLM (Ollama Llama3.2) for the reasoning
        prompt_str = f"""Sen profesyonel bir borsa analisti ve makro ekonomistin. {ticker} analizi:
Fiyat: {current_price:.2f} TL. LSTM Yarın Tahmini: {predicted_price:.2f} TL ({direction}).
Teknik: RSI={rsi}, MACD={macd}, Bollinger %B={bb_pct}, OBV={obv}, Ichimoku Tenkan={ichimoku_tenkan}, Fibonacci %61.8={fib_618}.
Piyasa Duyarlılığı (Beta): {corr_data.get('beta', 'N/A') if corr_data else 'N/A'}.
Endeks Korelasyonu: {corr_data.get('corr_xu100', 'N/A') if corr_data else 'N/A'}.
KAP Haber Duygusu: {sentiment_category} (Skor: {avg_sentiment_score}).
Yabancı Takas Oranı: {foreign_ratio}.
Makro Özet: {macro_report}.
Matematiksel Kelly Oranı: %{kelly_pct}.

Tüm bu verileri sentezleyerek hisseye olası etkisini çok sade, lüks bir dille 3 cümlelik devasa bir Türkçe teknik, makro ve takas analiz yorumuyla açıkla."""
        
        reasoning = llm.invoke(prompt_str)
        
        return {
            "ticker": ticker,
            "current_price": current_price,
            "predicted_price": predicted_price,
            "direction": direction,
            "rsi": rsi,
            "macd": macd,
            "avg_sentiment_score": avg_sentiment_score,
            "latest_news": analyzed_news,
            "reasoning": reasoning.strip(),
            "risk_mgmt": {
                "confidence_score": confidence_score,
                "kelly_recommendation": f"%{kelly_pct}",
                "stop_loss": risk_params["stop_loss"],
                "take_profit": risk_params["take_profit"],
                "risk_reward_ratio": risk_params["risk_reward"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error predicting single stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/commodity/{ticker}")
def predict_commodity(ticker: str):
    """
    Spesifik olarak emtialar (Altın, Gümüş, Petrol) için tahmin ve LLM yorumu döndürür.
    """
    try:
        if ticker not in ["GC=F", "SI=F", "CL=F"]:
             raise HTTPException(status_code=400, detail="Desteklenmeyen emtia. Sadece GC=F, SI=F, CL=F")
             
        # Get latest technical data
        record = list(market_data.find({"ticker": ticker}).sort("date", -1).limit(1))
        if not record:
            raise HTTPException(status_code=404, detail="Emtia verisi bulunamadı.")
            
        latest = record[0]
        current_price = latest.get("close", 0)
        rsi = latest.get("rsi", "N/A")
        macd = latest.get("macd", "N/A")
        
        # Run LSTM Prediction
        predicted_price = predict_next_day(ticker)
        if not predicted_price:
            raise HTTPException(status_code=500, detail="Tahmin oluşturulamadı.")
            
        # Extended Tech for Commodities
        bb_pct = round(latest.get("bb_pct", 0), 3) if latest.get("bb_pct") else "N/A"
        obv = int(latest.get("obv", 0)) if latest.get("obv") else "N/A"

        # Ask LLM (Ollama Llama3.2) for the reasoning
        direction = "Yükseliş" if predicted_price > current_price else "Düşüş"
        prompt_str = f"Sen profesyonel bir emtia ve makro ekonomist yapay zekanısın. {ticker} (Altın/Gümüş/Petrol) güncel fiyatı {current_price:.2f}. LSTM modeli yarın için {predicted_price:.2f} ({direction}) öngörüyor. RSI: {rsi}, MACD: {macd}, Bollinger %B: {bb_pct}, OBV: {obv}. Bu teknik ve makro verilere dayanarak, LSTM'in bu tahminini ve kısa vadeli stratejiyi 2 cümlelik, lüks ve keskin bir Türkçe dille açıkla."
        
        reasoning = llm.invoke(prompt_str)
        
        return {
            "ticker": ticker,
            "current_price": current_price,
            "predicted_price": predicted_price,
            "direction": direction,
            "rsi": rsi,
            "macd": macd,
            "reasoning": reasoning.strip()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error predicting commodity: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from data_pipeline.news_fetcher import fetch_daily_news
from models.sentiment import analyze_sentiment

@app.get("/news")
def get_live_news():
    try:
        # Fetch RSS news
        news_items = fetch_daily_news()

        # Pre-fetch known tickers for RSI enrichment
        known_tickers = set(market_data.distinct("ticker"))

        for i, item in enumerate(news_items):
            text_to_analyze = f"{item['title']} {item['description']}"

            # Predict robust sentiment using the PyTorch savasy Turkish BERT model for ALL news
            score = analyze_sentiment(text_to_analyze)
            item['score'] = score

            if score == 1:
                item['sentiment_label'] = 'Pozitif'
            elif score == -1:
                item['sentiment_label'] = 'Negatif'
            else:
                item['sentiment_label'] = 'Nötr'

            # --- Hybrid: Detect mentioned tickers and inject live RSI into AI comment ---
            ticker_context = ""
            if i < 6:
                import re as _re
                found = _re.findall(r'\b([A-Z]{2,6})\b', text_to_analyze.upper())
                matched_tickers = [t for t in found if t in known_tickers][:3]
                if matched_tickers:
                    ticker_data_parts = []
                    for t in matched_tickers:
                        rec = list(market_data.find({"ticker": t}).sort("date", -1).limit(1))
                        if rec:
                            doc = rec[0]
                            rsi = round(doc.get("rsi", 0), 1) if doc.get("rsi") else "N/A"
                            price = round(doc.get("close", 0), 2)
                            bb = round(doc.get("bb_pct", 0), 2) if doc.get("bb_pct") else "N/A"
                            obv = int(doc.get("obv", 0)) if doc.get("obv") else "0"
                            ticker_data_parts.append(f"{t}: Fiyat={price}TL, RSI={rsi}, B%={bb}, OBV={obv}")
                    if ticker_data_parts:
                        ticker_context = f" [Canlı Veri: {', '.join(ticker_data_parts)}]"

            # AI EXPERT COMMENT (Llama 3.2) - ONLY for the top 6 news
            if i < 6:
                prompt = (
                    f"Sen Borsa İstanbul yatırım uzmanısın. Şu haberi oku: '{text_to_analyze}'.{ticker_context} "
                    "Bu haberin BIST 100 hisseleri (sanayi, bankacılık vb.) üzerinde nasıl bir etki yaratabileceğini "
                    "sadece 1 veya 2 çok kısa ve öz Türkçe cümle ile analiz et."
                )
                ai_comment = llm.invoke(prompt)
                item['ai_comment'] = ai_comment.strip()
            else:
                item['ai_comment'] = ""  # No detailed comment for older news

        return {"news": news_items}

    except Exception as e:
        print(f"Error fetching news: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/heatmap")
@cache(expire=60)
async def get_heatmap_data():
    """
    Returns heatmap data by reading from pre-calculated ticker_insights.
    Ultra-fast: Single query for the entire market.
    """
    try:
        from database import ticker_insights
        
        # Single query for all insights (includes price, rsi, signal, lstm, sentiment)
        insights = await asyncio.to_thread(lambda: list(ticker_insights.find()))
        heatmap_nodes = []

        for item in insights:
            heatmap_nodes.append({
                "ticker": item["ticker"],
                "price": item.get("price", 0),
                "rsi": item.get("rsi"),
                "macd": item.get("macd"),
                "bb_pct": item.get("bb_pct"),
                "obv": item.get("obv"),
                "signal": item.get("signal", "TUT"),
                "lstm_direction": item.get("lstm_direction"),
                "lstm_predicted": item.get("lstm_predicted"),
                "sentiment": item.get("sentiment_label", "Nötr"),
                "sentiment_score": item.get("sentiment_score", 0),
                "updated_at": item.get("updated_at")
            })

        return {"heatmap": heatmap_nodes}
    except Exception as e:
        print(f"Error fetching heatmap: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def ai_chat(msg: ChatMessage):
    try:
        system_prompt = (
            "Sen Borsa İstanbul (BIST 100) ve global piyasalar üzerine uzmanlaşmış "
            "profesyonel bir finansal yapay zeka asistanısın. Adın 'OmniQuant AI'. "
            "Kullanıcının sorusuna sadece Türkçe olarak, net, profesyonel ve yardımcı "
            "bir dille cevap ver.\n\nKullanıcı Sorusu: " 
            + msg.message
        )
        
        response = llm.invoke(system_prompt)
        return {"response": response.strip()}
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/chat/{client_id}")
async def websocket_chat(websocket: WebSocket, client_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            req = json.loads(data)
            message = req.get("message", "")
            
            system_prompt = (
                "Sen Borsa İstanbul (BIST 100) uzmanı 'OmniQuant AI'sın. "
                "Kısa, net ve profesyonel Türkçe cevap ver.\n\nSoru: " + message
            )
            
            try:
                for chunk in llm.stream(system_prompt):
                    await websocket.send_json({"type": "CHAT_STREAM", "chunk": chunk})
                    await asyncio.sleep(0.01) # UI effect speed
                    
                await websocket.send_json({"type": "CHAT_DONE"})
            except Exception as e:
                await websocket.send_json({"type": "CHAT_ERROR", "detail": str(e)})
                
    except WebSocketDisconnect:
        print(f"Chat client {client_id} disconnected.")

@app.post("/agent/chat")
@limiter.limit("5/minute")
def specific_agent_chat(request: Request, req: AgentChatRequest):
    try:
        agent_personas = {
            "master": "Sen 'Ana Beyin (Master Agent)'sin. Tüm verileri inceleyip nihai kararı veren CEO pozisyonundasın.",
            "risk": "Sen 'Risk Yöneticisi'sin. Portföy güvenliği, maksimum varlık ağırlıkları ve stop-loss seviyeleri senin uzmanlık alanın.",
            "quant": "Sen 'Quant Analist'sin. Fiyat hareketlerinden matematiksel olasılıklar ve standart sapmalar hesaplayan bir algoritmik dâhisin.",
            "fundamental": "Sen 'Temel Analist'sin. Şirketlerin finansal tablolarına, F/K, PD/DD, ROE gibi metriklerine odaklanıp gerçek değer (intrinsic value) analizi yaparsın.",
            "tech": "Sen 'Teknik Analist'sin. RSI, MACD, Pivot noktaları ve hareketli ortalamalara dayanarak kısa vadeli momentum okursun.",
            "volume": "Sen 'Hacim ve Momentum' (Para Akışı İzleyici) ajanısın. Piyasaya giren çıkan yüklü kurumsal para bloklarını (breakout) incelersin.",
            "sentiment": "Sen 'Duygu Analisti'sin. Piyasaların haberlerden aldığı coşku veya paniği ölçüp psikolojik analiz yaparsın.",
            "macro": "Sen 'Makro Ekonomist'sin. Faiz oranları, global enflasyon, altın, dolar endeksi (DXY) gibi geniş çaplı verilerin piyasaya etkisini yorumlarsın.",
            "pair": "Sen 'Korelasyon Analisti'sin. Hisseler, döviz kurları veya sektörler arasındaki matematiksel ayrışmaları bularak arbitraj fırsatları çıkarırsın.",
            "insider": "Sen 'KAP & Şirket Habercisi'sin. Temettüler, bedelsizler, bilançolar gibi çok spesifik şirket bildirilerine göre hisse yorumlarsın.",
            "sector": "Sen 'Sektör Uzmanı'sın. Bankacılık, Havacılık, Sanayi gibi endüstrilerin dinamiklerini inceleyip hissenin sektörel avantajını bulursun.",
            "critic": "Sen 'Karşıt Görüş (Critic)' ajanısın. Piyasada oluşan fazla boğa veya fazla ayı beklentisine karşı riskleri yüzlerine çarpan bir şeytanın avukatısın.",
            "data": "Sen 'Veri Toplayıcı'sın. Tüm dünyaya bağlı bir ağ sensörü gibi sadece katı verileri rapor etmeye odaklısın."
        }

        persona = agent_personas.get(req.agent_id, "Sen profesyonel bir finansal yapay zeka ajanısın.")

        # --- Hybrid: Auto-detect ticker in message and inject live data ---
        live_data_context = ""
        try:
            import re as _re
            from models.sentiment import analyze_sentiment as _analyze
            from data_pipeline.kap_news import fetch_kap_and_insider_news as _kap

            # Extract potential BIST ticker (2-6 uppercase letters)
            tickers_found = _re.findall(r'\b([A-Z]{2,6})\b', req.message.upper())
            known_tickers = market_data.distinct("ticker")
            matched = [t for t in tickers_found if t in known_tickers]

            if matched:
                t = matched[0]
                rec = list(market_data.find({"ticker": t}).sort("date", -1).limit(1))
                if rec:
                    doc = rec[0]
                    price = round(doc.get("close", 0), 2)
                    rsi = round(doc.get("rsi", 0), 2) if doc.get("rsi") else "N/A"
                    macd = round(doc.get("macd", 0), 4) if doc.get("macd") else "N/A"
                    bb_pct = round(doc.get("bb_pct", 0), 3) if doc.get("bb_pct") else "N/A"
                    obv = int(doc.get("obv", 0)) if doc.get("obv") else "N/A"
                    fib_618 = round(doc.get("fib_618", 0), 2) if doc.get("fib_618") else "N/A"

                    # BERT Sentiment
                    kap = _kap(t)
                    news = kap.get("latest_company_news", [])
                    scores = [_analyze(n.get("title", "")) for n in news[:5] if n.get("title")]
                    avg_score = round(sum(scores) / len(scores), 3) if scores else 0
                    sentiment = "Pozitif" if avg_score >= 0.3 else ("Negatif" if avg_score <= -0.3 else "Nötr")

                    live_data_context = (
                        f"\n\n=== CANLI VERİ: {t} ===\n"
                        f"Güncel Fiyat: {price} TL\n"
                        f"RSI: {rsi} | MACD: {macd} | Bollinger %B: {bb_pct}\n"
                        f"OBV: {obv} | Fib %61.8 Destek: {fib_618}\n"
                        f"KAP Haber Duygusu (BERT): {sentiment} (Skor: {avg_score})\n"
                        "Bu verileri yanıtında kullan.\n"
                    )
        except Exception as e:
            print(f"[AgentChat] Live data inject error: {e}")

        system_prompt = (
            f"{persona}\n\n"
            "Kullanıcının sorusuna sadece Türkçe olarak, kendi uzmanlık çerçevenden, doğrudan ve keskin bir şekilde cevap ver. "
            "Gereksiz uzun nezaket ifadelerinden kaçın ve 'Ben ... ajanı olarak' gibi laflar etmek yerine doğrudan cevaba gir."
            f"{live_data_context}\n\n"
            f"Kullanıcı Sorusu: {req.message}"
        )

        response = llm.invoke(system_prompt)

        return {"response": response.strip()}
    except Exception as e:
        print(f"Error in specific agent chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from models.time_series import run_backtest

@app.get("/backtest/{ticker}")
def get_backtest_data(ticker: str):
    try:
        # Generate 90 days of backtest data
        results = run_backtest(ticker, days=90)
        
        if not results:
            raise HTTPException(status_code=404, detail="Yeterli veri yok veya backtest tamamlanamadı.")
            
        return {
            "ticker": ticker,
            "days": 90,
            "metrics": results["metrics"],
            "equity_curve": results["equity_curve"],
            "history": results["history"]
        }
    except Exception as e:
        print(f"Error in backtest endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from database import agent_memory
from models.time_series import device

@app.get("/system/status")
def get_system_status():
    """Returns the continuous learning status of the AI."""
    try:
        mem_count = agent_memory.count_documents({})
        market_count = market_data.count_documents({})
        
        # Count weights as active models
        weights_dir = "models"
        weights = [f for f in os.listdir(weights_dir) if f.endswith(".pth")] if os.path.exists(weights_dir) else []
        
        return {
            "memory_insights": mem_count,
            "market_data_points": market_count,
            "active_models": len(weights),
            "last_update": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "status": "Learning & Evolving",
            "device": str(device)
        }
    except Exception as e:
        print(f"Error in system status: {e}")
        return {"status": "Error", "detail": str(e)}

@app.post("/warroom/debate/{ticker}")
@limiter.limit("5/minute")
async def start_war_room_debate(request: Request, ticker: str):
    """
    Simulates a live debate between 8 distinct AI agents regarding a specific ticker.
    Enriched with live technical indicators, LSTM prediction, and Turkish BERT sentiment.
    Refactored to ASYNC to prevent blocking the event loop.
    """
    try:
        from models.sentiment import analyze_sentiment
        from data_pipeline.macro_data import fetch_macroeconomic_data
        from data_pipeline.foreign_ratio import fetch_foreign_ratio
        from data_pipeline.kap_news import fetch_kap_and_insider_news
        from models.time_series import predict_next_day

        # --- 1. Technical Indicators (Extended) ---
        current_price = "N/A"
        rsi = "N/A"
        macd = "N/A"
        bb_pct = "N/A"      # Bollinger %B
        obv = "N/A"         # On Balance Volume
        ichimoku_tenkan = "N/A"
        ichimoku_kijun = "N/A"
        fib_618 = "N/A"     # Key Fibonacci support
        fib_382 = "N/A"     # Key Fibonacci resistance
        lstm_direction = "Bilinmiyor"
        lstm_predicted = "N/A"

        try:
            record = list(market_data.find({"ticker": ticker}).sort("date", -1).limit(1))
            if record:
                latest = record[0]
                current_price = round(latest.get("close", 0), 2)
                rsi           = round(latest.get("rsi", 0), 2)     if latest.get("rsi")           else "N/A"
                macd          = round(latest.get("macd", 0), 4)    if latest.get("macd")          else "N/A"
                bb_pct        = round(latest.get("bb_pct", 0), 3)  if latest.get("bb_pct")        else "N/A"
                obv           = int(latest.get("obv", 0))           if latest.get("obv")           else "N/A"
                ichimoku_tenkan = round(latest.get("ichimoku_tenkan", 0), 2) if latest.get("ichimoku_tenkan") else "N/A"
                ichimoku_kijun  = round(latest.get("ichimoku_kijun",  0), 2) if latest.get("ichimoku_kijun")  else "N/A"
                fib_618       = round(latest.get("fib_618", 0), 2) if latest.get("fib_618")       else "N/A"
                fib_382       = round(latest.get("fib_382", 0), 2) if latest.get("fib_382")       else "N/A"
        except Exception as e:
            print(f"[WarRoom] Technical data error: {e}")

        # --- 2. LSTM Price Prediction ---
        try:
            predicted_price = predict_next_day(ticker)
            if predicted_price and current_price != "N/A":
                lstm_direction = "Yükseliş" if predicted_price > current_price else "Düşüş"
                lstm_predicted = round(predicted_price, 2)
        except Exception as e:
            print(f"[WarRoom] LSTM prediction error: {e}")

        # --- 3. Turkish BERT Sentiment (savasy/bert-base-turkish-sentiment) ---
        avg_sentiment_score = 0.0
        sentiment_category = "Nötr"
        try:
            kap_data = fetch_kap_and_insider_news(ticker)
            news_items = kap_data.get("latest_company_news", [])
            scores = [analyze_sentiment(n.get("title", "")) for n in news_items if n.get("title")]
            if scores:
                avg_sentiment_score = round(sum(scores) / len(scores), 3)
                if avg_sentiment_score >= 0.3:
                    sentiment_category = "Pozitif"
                elif avg_sentiment_score <= -0.3:
                    sentiment_category = "Negatif"
        except Exception as e:
            print(f"[WarRoom] Sentiment error: {e}")

        # --- 4. Macro + Foreign Ratio ---
        macro_report = "Bilinmiyor"
        foreign_ratio = "Bilinmiyor"
        try:
            macro_report = fetch_macroeconomic_data().get("summary", "Bilinmiyor")
            foreign_ratio = fetch_foreign_ratio(ticker)
        except Exception as e:
            print(f"[WarRoom] Macro/foreign error: {e}")

        # --- 5. KAP Disclosures + Açığa Satış (from MongoDB via kap_rss) ---
        kap_disclosures_text = "Yok"
        short_sell_text = "Veri mevcut değil"
        try:
            from data_pipeline.kap_rss import get_kap_context_for_ticker
            kap_ctx = get_kap_context_for_ticker(ticker, days=7)
            if kap_ctx.get("disclosures"):
                kap_disclosures_text = "\n".join(
                    [f"• {d.get('title', '')}" for d in kap_ctx["disclosures"][:3]]
                )
            short_data = kap_ctx.get("short_sell", {})
            if short_data.get("short_ratio") is not None:
                short_sell_text = f"%{short_data['short_ratio']:.2f} açığa satış oranı ({short_data.get('date', 'Son rapor')})"
        except Exception as e:
            print(f"[WarRoom] KAP context error: {e}")

        # --- 6. Correlation & Beta & Arbitrage (Correlation Matrix) ---
        correlation_report = "Veri hesaplanamadı"
        arbitrage_report = "Peer bulunamadı"
        try:
            from data_pipeline.correlation import fetch_index_correlation, fetch_correlation_arbitrage
            corr_data = fetch_index_correlation(ticker)
            if corr_data:
                correlation_report = (
                    f"Beta: {corr_data['beta']} | "
                    f"XU100 Korelasyon: {corr_data['corr_xu100']} | "
                    f"Sektör ({corr_data['benchmark_index']}) Korelasyon: {corr_data['corr_sector']} | "
                    f"Relatif Güç (90G): %{corr_data['relative_strength']}"
                )
            arb_data = fetch_correlation_arbitrage(ticker)
            if arb_data and "peer" in arb_data:
                arbitrage_report = f"{arb_data['peer']} ile Z-Score: {arb_data['z_score']} ({arb_data['opportunity']})"
        except Exception as e:
            print(f"[WarRoom] Correlation error: {e}")

        # --- 7. Multi-Agent Chain of Thought (Sequential Debate) ---
        debate_history = []
        
        async def invoke_agent(agent_id, persona, instruction):
            history_text = "\n".join([f"{m['agent'].upper()}: {m['text']}" for m in debate_history])
            prompt = f"""Sen OmniQuant Savaş Odası'ndaki "{agent_id}" ajanısın.
Persona: {persona}
Piyasa Verileri:
- Fiyat: {current_price} | LSTM: {lstm_direction} ({lstm_predicted})
- Teknik (RSI/MACD/BB/Fib): {rsi}, {macd}, {bb_pct}, {fib_618}
- Haber/KAP: {sentiment_category} | {kap_disclosures_text[:100]}
- Korelasyon/Arbitraj: {correlation_report} | {arbitrage_report}

Önceki Tartışma:
{history_text if history_text else "Henüz kimse konuşmadı."}

GÖREVİN: {instruction}
Sadece kendi mesajını yaz (Maks 3 cümle). Profesyonel, sert ve teknik jargon dolu ol. Türkçe konuş."""
            
            # Use await llm.ainvoke for non-blocking call
            response = await llm.ainvoke(prompt)
            text = response.content.strip() if hasattr(response, 'content') else str(response).strip()
            text = text.replace('```json', '').replace('```', '').strip()
            return {"agent": agent_id, "text": text}

        # Sequential calls but with await, releasing loop for other requests (Heatmap, Vault, etc.)
        debate_history.append(await invoke_agent("quant", "RSI, MACD ve Fibonacci uzmanıdır.", "Teknik indikatörlere dayalı agresif bir açılış yap."))
        debate_history.append(await invoke_agent("fundamental", "Bilanço ve KAP uzmanıdır.", "Temel veriler ve Z-Score arbitrajı ile derinlik kat."))
        debate_history.append(await invoke_agent("insider", "Şirket patronu ve pay alım-satım uzmanıdır.", f"KAP bildirimlerini ({kap_disclosures_text[:50]}) ve patron hareketlerini yorumla."))
        debate_history.append(await invoke_agent("bearish", "Açığa satış ve piyasa baskısı uzmanıdır.", f"Açığa satış verilerini ({short_sell_text}) ve aşağı yönlü riskleri vurgula."))
        debate_history.append(await invoke_agent("global", "Makro ekonomi ve küresel piyasa uzmanıdır.", f"Dolar/Faiz/Altın dengesinin BIST ve {ticker} üzerindeki etkisini tartış."))
        debate_history.append(await invoke_agent("macro", "Beta ve endeks korelasyonu uzmanıdır.", "Piyasa duyarlılığını (Beta) ve XU100 bağını masaya yatır."))
        debate_history.append(await invoke_agent("critic", "Şeytanın avukatı.", "Yukarıdaki TÜM argümanlardaki boşlukları bul ve en sert eleştirini yap."))
        
        master_prompt = f"""Sen OmniQuant SISTEM PROTOKOLÜSÜN. 7 farklı ajanın tartışmasını sentezle ve Ni̇hai̇ Strateji̇k Kararı ver.
{ " ".join([f"{m['agent']}: {m['text']}" for m in debate_history]) }
ZORUNLU: Mesaj sonunda "TAKTIK KARAR: [AL / SAT / TUT]" yaz."""
        master_res = await llm.ainvoke(master_prompt)
        debate_history.append({"agent": "master", "text": master_res.content.strip() if hasattr(master_res, 'content') else str(master_res).strip()})

        return {"debate": debate_history}

    except Exception as e:
        print(f"Error in warroom debate ({ticker}): {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
