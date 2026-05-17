import yfinance as yf
import numpy as np

def fetch_momentum(ticker: str) -> dict:
    """
    Fetches the last 15 days of historical data for a BIST ticker.
    Calculates the average volume of the first 14 days and compares it to the most recent day.
    Checks if there's an abnormal volume surge (momentum / breakout indication).
    """
    yf_ticker = f"{ticker}.IS"
    try:
        stock = yf.Ticker(yf_ticker)
        # Fetch last 15 days
        history = stock.history(period="15d")
        
        if history.empty or len(history) < 5:
            return {"error": "Not enough data"}
            
        volumes = history['Volume'].values
        closes = history['Close'].values
        
        # Latest day
        latest_vol = volumes[-1]
        latest_close = closes[-1]
        prev_close = closes[-2]
        
        # Calculate trailing average volume excluding the latest day
        # Look at the previous 10 days if available
        lookback = min(10, len(volumes) - 1)
        prev_volumes = volumes[-(lookback+1):-1]
        
        avg_vol = np.mean(prev_volumes) if len(prev_volumes) > 0 else 1
        
        # Calculate surge percentage
        volume_surge_pct = ((latest_vol / avg_vol) - 1.0) * 100 if avg_vol > 0 else 0
        
        # Price change
        price_change_pct = ((latest_close / prev_close) - 1.0) * 100
        
        # Evaluate anomaly
        anomaly = False
        message = "Normal piyasa hacmi."
        
        if volume_surge_pct > 150: # 2.5x the normal volume
            anomaly = True
            if price_change_pct > 2:
                message = f"GÜÇLÜ ALIM MOMENTUMU! Hacim normalin %{volume_surge_pct:.0f} üzerinde patladı ve fiyat yükseliyor. Kurumsal para girişi olabilir."
            elif price_change_pct < -2:
                message = f"CİDDİ SATIŞ BASKISI! Hacim normalin %{volume_surge_pct:.0f} üzerinde patladı ve fiyat düşüyor. Kurumsal veya panik satışı."
            else:
                message = f"KARARSIZ YÜKSEK HACİM! Hacim normalin %{volume_surge_pct:.0f} üzerinde patladı ancak yön belirsiz (Testere piyasası)."
                
        momentum_data = {
            "latest_volume": int(latest_vol),
            "average_volume_10d": int(avg_vol),
            "volume_surge_percent": round(volume_surge_pct, 2),
            "price_change_percent": round(price_change_pct, 2),
            "has_anomaly": anomaly,
            "momentum_message": message
        }
        
        return momentum_data
        
    except Exception as e:
        print(f"Error fetching momentum for {yf_ticker}: {e}")
        return {}

if __name__ == "__main__":
    test_ticker = "THYAO"
    print(f"Testing momentum for {test_ticker}...")
    data = fetch_momentum(test_ticker)
    for k, v in data.items():
        print(f"{k}: {v}")
