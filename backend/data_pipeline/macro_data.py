import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def get_macro_trend(ticker_symbol: str) -> dict:
    """
    Fetches the last 30 days of data for a given macro symbol,
    calculates its short-term trend (Up/Down) and current price.
    """
    try:
        # Download last 1 month of data
        data = yf.download(ticker_symbol, period="1mo", interval="1d", progress=False)['Close']
        if data.empty:
            return {"current": "N/A", "trend": "Nötr", "change_pct": 0}
            
        data = data.dropna()
        current_price = float(data.iloc[-1])
        past_price = float(data.iloc[0])
        
        # Calculate percentage change
        change_pct = ((current_price - past_price) / past_price) * 100
        
        # Determine trend
        trend = "Nötr"
        if change_pct > 1.0:
            trend = "Yükseliş"
        elif change_pct < -1.0:
            trend = "Düşüş"
            
        return {
            "current": round(current_price, 2),
            "trend": trend,
            "change_pct": round(change_pct, 2)
        }
    except Exception as e:
        print(f"Error fetching macro data for {ticker_symbol}: {e}")
        return {"current": "N/A", "trend": "Nötr", "change_pct": 0}

def fetch_macroeconomic_data() -> dict:
    """
    Retrieves key macroeconomic indicators and their recent trends.
    - USD/TRY (TRY=X)
    - Gold Futures (GC=F)
    - Brent Crude Oil (BZ=F)
    - BIST 100 Index (XU100.IS)
    - BIST Banking Index (XBANK.IS)
    - BIST Industrials Index (XUSIN.IS)
    """
    try:
        usd_try = get_macro_trend("TRY=X")
        gold_oz = get_macro_trend("GC=F")
        brent_oil = get_macro_trend("BZ=F")
        bist100 = get_macro_trend("XU100.IS")
        bank_idx = get_macro_trend("XBANK.IS")
        indus_idx = get_macro_trend("XUSIN.IS")
        
        # Construct a descriptive summary for the LLM
        summary = (
            f"Dolar/TL ({usd_try['current']}, {usd_try['trend']}), "
            f"Ons Altın ({gold_oz['current']}, {gold_oz['trend']}), "
            f"Brent Petrol ({brent_oil['current']}, {brent_oil['trend']}). "
            f"BIST100 ({bist100['current']}, {bist100['trend']}), "
            f"BIST Bankacılık Endeksi ({bank_idx['current']}, {bank_idx['trend']}), "
            f"BIST Sanayi Endeksi ({indus_idx['current']}, {indus_idx['trend']})."
        )
        
        return {
            "usd_try": usd_try,
            "gold_oz": gold_oz,
            "brent_oil": brent_oil,
            "bist100": bist100,
            "bank_idx": bank_idx,
            "indus_idx": indus_idx,
            "summary": summary
        }
    except Exception as e:
        print(f"Error generating macro data summary: {e}")
        return {"summary": "Makro veri anlık olarak çekilemedi."}

if __name__ == "__main__":
    print("Testing Macroeconomic Data Fetcher...")
    res = fetch_macroeconomic_data()
    print("Makro Rapor:", res.get("summary"))
