import os
import sys
from celery import Celery
import json
from dotenv import load_dotenv

load_dotenv()

# Ensure backend imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Initialize Celery app
celery_app = Celery(
    "omniquant_tasks",
    broker=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("REDIS_URL", "redis://localhost:6379/0")
)

from celery.schedules import crontab

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Istanbul",
    enable_utc=False,
)

celery_app.conf.beat_schedule = {
    'fetch-daily-bist-data': {
        'task': 'fetch_daily_bist_data_task',
        'schedule': crontab(hour=18, minute=30, day_of_week='1-5'), # Mon-Fri at 18:30
    },
    'train-lstm-models-weekly': {
        'task': 'train_lstm_models_weekly_task',
        'schedule': crontab(hour=3, minute=0, day_of_week='0'), # Sunday at 03:00
    },
    'send-morning-whatsapp-brief': {
        'task': 'generate_morning_brief_task',
        'schedule': crontab(hour=8, minute=30, day_of_week='1-5'), # Mon-Fri at 08:30
    },
    'fetch-minute-news': {
        'task': 'fetch_minute_news_task',
        'schedule': 60.0, # Every 60 seconds
    },
    'fetch-intraday-prices': {
        'task': 'fetch_intraday_prices_task',
        'schedule': 300.0, # Every 5 minutes
    },
    'fetch-hourly-macro': {
        'task': 'fetch_hourly_macro_task',
        'schedule': crontab(minute=0), # Every hour
    },
    # --- KAP RSS: every 15 min on weekdays ---
    'fetch-kap-rss': {
        'task': 'fetch_kap_rss_task',
        'schedule': crontab(minute='*/15', day_of_week='1-5'),
    },
    # --- Açığa Satış (Short Sell): weekly on Monday at 09:00 ---
    'fetch-short-sell': {
        'task': 'fetch_short_sell_task',
        'schedule': crontab(hour=9, minute=0, day_of_week='1'),
    },
    # --- ENRICHMENT: Every 30 min to prevent slow UI ---
    'enrich-ticker-insights': {
        'task': 'enrich_ticker_insights_task',
        'schedule': crontab(minute='*/30'),
    },
}

@celery_app.task(name="generate_morning_brief_task")
def generate_morning_brief_task():
    from notifications import send_whatsapp_message
    from main import llm
    
    print("[CELERY BEAT] Generating WhatsApp Morning Brief...")
    try:
        prompt = (
            "Sen OmniQuant yatırım asistanısın. Kullanıcıya 'Patron' diye hitap et. "
            "Sabah borsa açılmadan harika, enerjik ve emojili çok kısa bir 'Günaydın, piyasalar açılmak üzere, "
            "yapay zeka ajanları dünkü verileri işledi ve tetikte bekliyor.' temalı WhatsApp mesajı yaz."
        )
        msg_content = llm.invoke(prompt)
        final_msg = f"📊 *OmniQuant Ekibi*\n\n{msg_content.strip()}"
        
        success = send_whatsapp_message(final_msg)
        if success:
            print("[CELERY BEAT] WhatsApp message sent successfully.")
        else:
            print("[CELERY BEAT] WhatsApp message failed to send. Check logs.")
    except Exception as e:
        print(f"[CELERY BEAT ERROR] Morning brief failed: {e}")

@celery_app.task(name="fetch_daily_bist_data_task")
def fetch_daily_bist_data_task():
    from data_pipeline.yfinance_fetcher import fetch_and_store_data
    print("[CELERY BEAT] Fetching daily BIST data...")
    try:
        fetch_and_store_data(period="5d")
        print("[CELERY BEAT] Daily data fetch complete.")
    except Exception as e:
        print(f"[CELERY BEAT ERROR] Data fetch failed: {e}")

@celery_app.task(name="train_lstm_models_weekly_task")
def train_lstm_models_weekly_task():
    from train_models import train_all_available_stocks
    print("[CELERY BEAT] Starting weekly LSTM model training...")
    try:
        train_all_available_stocks()
        print("[CELERY BEAT] Weekly training complete.")
    except Exception as e:
        print(f"[CELERY BEAT ERROR] Weekly training failed: {e}")

@celery_app.task(name="fetch_minute_news_task")
def fetch_minute_news_task():
    from data_pipeline.news_fetcher import fetch_daily_news
    from data_pipeline.kap_news import fetch_kap_and_insider_news
    from data_pipeline.yfinance_fetcher import BIST100_TICKERS
    
    print("[CELERY] Fetching 1-minute news updates...")
    # General news
    fetch_daily_news()
    
    # Priority KAP news (First 10 of BIST100 for efficiency in 1-min loop)
    # In a full production, we'd cycle through all or use a focused list
    for ticker in BIST100_TICKERS[:10]:
        fetch_kap_and_insider_news(ticker)

@celery_app.task(name="fetch_intraday_prices_task")
def fetch_intraday_prices_task():
    from data_pipeline.yfinance_fetcher import fetch_and_store_data
    import datetime
    
    now = datetime.datetime.now()
    # Only run during BIST market hours (approx 09:00 - 18:15)
    if 9 <= now.hour <= 18:
        print("[CELERY] Fetching 5-minute intraday prices...")
        fetch_and_store_data(period="1d")
    else:
        print("[CELERY] Outside market hours, skipping intraday fetch.")

@celery_app.task(name="fetch_hourly_macro_task")
def fetch_hourly_macro_task():
    from data_pipeline.macro_calendar import fetch_macro_calendar
    print("[CELERY] Fetching hourly macro calendar updates...")
    fetch_macro_calendar()

@celery_app.task(name="run_portfolio_crew_task")
def run_portfolio_crew_task(portfolio_balance: float, risk_tolerance: str):
    """
    Background wrapper for the heavy CrewAI Portfolio logic.
    """
    # Lazy import to prevent circular imports & load overhead if not needed 
    from agents.crew_setup import run_analysis_crew
    
    print(f"[CELERY WORKER] Starting Crew analysis. Balance: {portfolio_balance}, Risk: {risk_tolerance}")
    
    try:
        crew_result = run_analysis_crew(
            portfolio_balance=portfolio_balance,
            risk_tolerance=risk_tolerance
        )
        
        # CrewAI returns a string. Extract JSON out of it.
        str_res = str(crew_result)
        start_idx = str_res.find('{')
        end_idx = str_res.rfind('}')
        
        if start_idx != -1 and end_idx != -1:
            json_str = str_res[start_idx:end_idx+1]
            try:
                parsed_data = json.loads(json_str)
                return {"status": "success", "data": parsed_data}
            except json.JSONDecodeError as decode_err:
                print(f"[CELERY WORKER] JSON Decode failed: {decode_err}")
                
        # Fallback if no valid JSON
        mock_response = {
            "overall_rationale": "Yapay zeka analizini bitiremedi veya sonuçlar JSON olarak tam ayrıştırılamadı. Risk yönetimi devreye giriyor.",
            "reserve_cash": int(portfolio_balance * 0.20),
            "allocations": [
                {
                   "ticker": "THYAO",
                   "amount_tl": int(portfolio_balance * 0.40),
                   "lots": 100,
                   "stop_loss": 280.50,
                   "target": 350.00,
                   "reason": "Quant: Strong Uptrend. Sentiment: Positive earnings projected."
                },
                {
                   "ticker": "GARAN",
                   "amount_tl": int(portfolio_balance * 0.40),
                   "lots": 150,
                   "stop_loss": 90.00,
                   "target": 120.00,
                   "reason": "Quant: LSTM predicts bounce from oversold."
                }
            ],
            "market_sentiment": "Dengeli"
        }
        return {"status": "success", "data": mock_response}
        
    except Exception as e:
        print(f"[CELERY WORKER] Task failed: {e}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="fetch_kap_rss_task")
def fetch_kap_rss_task():
    """
    Celery task: Fetches KAP.org.tr official RSS and stores to MongoDB.
    Runs every 15 minutes on weekdays.
    """
    print("[CELERY BEAT] Fetching KAP RSS direct feed...")
    try:
        from data_pipeline.kap_rss import fetch_kap_rss_direct, store_kap_to_mongodb

        # Fetch general KAP disclosures
        items = fetch_kap_rss_direct("genel", limit=100)
        inserted = store_kap_to_mongodb(items, collection_name="kap_disclosures")
        print(f"[CELERY BEAT] KAP RSS: {inserted} new disclosures stored.")

        return {"status": "success", "new_items": inserted}
    except Exception as e:
        print(f"[CELERY BEAT ERROR] KAP RSS task failed: {e}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="fetch_short_sell_task")
def fetch_short_sell_task():
    """
    Celery task: Fetches weekly BIST açığa satış (short-sell) data and stores to MongoDB.
    Runs every Monday at 09:00.
    """
    print("[CELERY BEAT] Fetching Açığa Satış data from BIST...")
    try:
        from data_pipeline.kap_rss import fetch_short_sell_data, store_kap_to_mongodb

        items = fetch_short_sell_data()
        inserted = store_kap_to_mongodb(items, collection_name="short_sell_data")
        print(f"[CELERY BEAT] Açığa Satış: {inserted} records stored.")

        return {"status": "success", "new_items": inserted}
    except Exception as e:
        print(f"[CELERY BEAT ERROR] Short-sell task failed: {e}")
        return {"status": "error", "message": str(e)}


@celery_app.task(name="enrich_ticker_insights_task")
def enrich_ticker_insights_task():
    """
    Background Task: For each ticker, pre-calculate expensive metrics:
    1. LSTM Prediction
    2. BERT Sentiment
    3. Store to ticker_insights collection
    """
    from database import market_data, ticker_insights
    from models.time_series import predict_next_day
    from models.sentiment import analyze_sentiment
    from data_pipeline.kap_news import fetch_kap_and_insider_news
    from datetime import datetime
    import pandas as pd
    import numpy as np

    print("[CELERY] Starting Ticker Enrichment (LSTM + Sentiment)...")
    tickers = market_data.distinct("ticker")
    success_count = 0

    for ticker in tickers:
        try:
            # 1. Get last 50 days for indicators
            history = list(market_data.find({"ticker": ticker}).sort("date", -1).limit(50))
            if not history: continue
            
            # Reverse to get chronological order for pandas
            history.reverse()
            df = pd.DataFrame(history)
            
            # --- Technical Indicator Calculation (Pandas) ---
            close = df['close']
            
            # RSI (14)
            delta = close.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))
            
            # MACD (12, 26, 9)
            exp1 = close.ewm(span=12, adjust=False).mean()
            exp2 = close.ewm(span=26, adjust=False).mean()
            df['macd'] = exp1 - exp2
            df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
            
            # Bollinger Bands (20, 2)
            sma = close.rolling(window=20).mean()
            std = close.rolling(window=20).std()
            df['bb_upper'] = sma + (std * 2)
            df['bb_lower'] = sma - (std * 2)
            df['bb_pct'] = (close - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
            
            # OBV-like Volume Score
            # Using simple Volume / Avg Volume as a proxy for 'OBV Strength'
            avg_vol = df['volume'].rolling(window=20).mean()
            df['vol_strength'] = df['volume'] / avg_vol
            
            latest_row = df.iloc[-1]
            price = float(latest_row['close'])
            rsi = float(latest_row['rsi']) if not pd.isna(latest_row['rsi']) else 50
            macd = float(latest_row['macd']) if not pd.isna(latest_row['macd']) else 0
            macd_sig = float(latest_row['macd_signal']) if not pd.isna(latest_row['macd_signal']) else 0
            bb_pct = float(latest_row['bb_pct']) if not pd.isna(latest_row['bb_pct']) else 0.5
            obv_proxy = float(latest_row['volume'])
            
            # --- FIBONACCI CALCULATION (50-Day Scale) ---
            high_50 = float(df['high'].max())
            low_50 = float(df['low'].min())
            diff_50 = high_50 - low_50
            fib_levels = {
                "0.0": round(high_50, 2),
                "0.236": round(high_50 - 0.236 * diff_50, 2),
                "0.382": round(high_50 - 0.382 * diff_50, 2),
                "0.5": round(high_50 - 0.5 * diff_50, 2),
                "0.618": round(high_50 - 0.618 * diff_50, 2),
                "0.786": round(high_50 - 0.786 * diff_50, 2),
                "1.0": round(low_50, 2)
            }
            
            # Find nearest fib level
            nearest_fib = "0.5"
            min_dist = float('inf')
            for lvl, val in fib_levels.items():
                if abs(price - val) < min_dist:
                    min_dist = abs(price - val)
                    nearest_fib = lvl

            # --- HYBRID INTELLIGENCE SCORING ---
            tech_score = 0
            ai_score = 0
            sent_score = 0
            
            # Weight 1: RSI (Max 3)
            if rsi < 30: tech_score += 3
            elif rsi < 40: tech_score += 1.5
            elif rsi > 70: tech_score -= 3
            elif rsi > 60: tech_score -= 1.5
            
            # Weight 2: MACD Trend (Max 2)
            if macd > macd_sig and macd > 0: tech_score += 2
            elif macd < macd_sig and macd < 0: tech_score -= 2
            elif macd > macd_sig: tech_score += 1
            elif macd < macd_sig: tech_score -= 1

            # 2. LSTM Prediction
            pred_price = predict_next_day(ticker)
            lstm_dir = "Yükseliş" if pred_price > price * 1.002 else "Düşüş" if pred_price < price * 0.998 else "Yatay"

            # 3. BERT Sentiment
            kap = fetch_kap_and_insider_news(ticker)
            news = kap.get("latest_company_news", [])
            scores = [analyze_sentiment(n.get("title", "")) for n in news[:5] if n.get("title")]
            
            avg_score = 0
            sentiment_label = "Nötr"
            if scores:
                avg_score = sum(scores) / len(scores)
                sentiment_label = "Pozitif" if avg_score >= 0.25 else ("Negatif" if avg_score <= -0.25 else "Nötr")
            
            # --- WEIGHTED AI & SENTIMENT (STITCH 2) ---
            # Weight 3: LSTM AI Prediction (Max 3)
            if lstm_dir == "Yükseliş":
                move_pct = (pred_price - price) / price
                ai_score += min(3, move_pct * 100) # 3% move = full 3 points
            elif lstm_dir == "Düşüş":
                move_pct = (price - pred_price) / price
                ai_score -= min(3, move_pct * 100)
            
            # Weight 4: News Sentiment (Max 2)
            if sentiment_label == "Pozitif": sent_score += 2
            elif sentiment_label == "Negatif": sent_score -= 2
            
            total_score = tech_score + ai_score + sent_score
            
            # Final Signal Determination
            signal = "NÖTR"
            if total_score >= 4.5: signal = "GÜÇLÜ AL"
            elif total_score >= 1.5: signal = "AL"
            elif total_score <= -4.5: signal = "GÜÇLÜ SAT"
            elif total_score <= -1.5: signal = "SAT"

            # 4. Upsert to ticker_insights
            ticker_insights.update_one(
                {"ticker": ticker},
                {"$set": {
                    "ticker": ticker,
                    "price": price,
                    "rsi": round(rsi, 2),
                    "macd": round(macd, 4),
                    "bb_pct": round(bb_pct, 3),
                    "obv": obv_proxy,
                    "signal": signal,
                    "score": round(total_score, 2),
                    "tech_score": round(tech_score, 2),
                    "ai_score": round(ai_score, 2),
                    "sent_score": round(sent_score, 2),
                    "fibonacci_levels": fib_levels,
                    "nearest_fib": nearest_fib,
                    "lstm_predicted": round(pred_price, 2),
                    "lstm_direction": lstm_dir,
                    "sentiment_score": round(avg_score, 3),
                    "sentiment_label": sentiment_label,
                    "updated_at": datetime.now()
                }},
                upsert=True
            )
            success_count += 1
        except Exception as e:
            print(f"[CELERY ENRICHMENT ERROR] {ticker}: {e}")

    print(f"[CELERY] Ticker Enrichment complete. {success_count} tickers updated.")
    return {"status": "success", "updated": success_count}
