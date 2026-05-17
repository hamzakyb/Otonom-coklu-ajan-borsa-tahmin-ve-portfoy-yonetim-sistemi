import pandas as pd
import ta
import sys
import os

# Ensure we can import database from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import market_data

def calculate_fibonacci_levels(high: float, low: float) -> dict:
    """
    Calculates standard Fibonacci retracement levels from a swing high/low.
    Used as key support/resistance reference points.
    """
    diff = high - low
    return {
        "fib_236": round(high - diff * 0.236, 4),
        "fib_382": round(high - diff * 0.382, 4),
        "fib_500": round(high - diff * 0.500, 4),
        "fib_618": round(high - diff * 0.618, 4),
        "fib_786": round(high - diff * 0.786, 4),
        "fib_high": round(high, 4),
        "fib_low":  round(low, 4),
    }


def add_indicators_to_stock(ticker):
    """
    Fetches stock data from MongoDB, calculates all technical indicators,
    and updates the documents back in MongoDB.

    Indicators computed:
    - RSI (14)
    - MACD + Signal
    - SMA 50 / SMA 200
    - Bollinger Bands (20, 2sigma) + %B
    - OBV (On Balance Volume)
    - Ichimoku Cloud (Tenkan 9, Kijun 26, Senkou A/B, Chikou)
    - Fibonacci Retracement Levels (52-week rolling high/low)
    """
    print(f"Calculating indicators for {ticker}...")

    cursor = market_data.find({"ticker": ticker}).sort("date", 1)
    records = list(cursor)

    if len(records) < 52:
        print(f"Not enough records for {ticker} (found {len(records)})")
        return

    df = pd.DataFrame(records)
    df['close']  = pd.to_numeric(df['close'],  errors='coerce')
    df['high']   = pd.to_numeric(df['high'],   errors='coerce')
    df['low']    = pd.to_numeric(df['low'],    errors='coerce')
    df['volume'] = pd.to_numeric(df['volume'], errors='coerce').fillna(0)

    # 1. RSI
    df['rsi'] = ta.momentum.RSIIndicator(close=df['close'], window=14).rsi()

    # 2. MACD
    macd_ind = ta.trend.MACD(close=df['close'])
    df['macd']        = macd_ind.macd()
    df['macd_signal'] = macd_ind.macd_signal()

    # 3. SMA
    df['sma_50']  = ta.trend.SMAIndicator(close=df['close'], window=50).sma_indicator()
    df['sma_200'] = ta.trend.SMAIndicator(close=df['close'], window=200).sma_indicator()

    # 4. Bollinger Bands
    bb = ta.volatility.BollingerBands(close=df['close'], window=20)
    df['bb_high'] = bb.bollinger_hband()
    df['bb_low']  = bb.bollinger_lband()
    df['bb_mid']  = bb.bollinger_mavg()
    df['bb_pct']  = bb.bollinger_pband()   # %B position within bands (0-1)

    # 5. OBV (On Balance Volume)
    df['obv'] = ta.volume.OnBalanceVolumeIndicator(
        close=df['close'], volume=df['volume']
    ).on_balance_volume()

    # 6. Ichimoku Cloud
    ichimoku = ta.trend.IchimokuIndicator(
        high=df['high'], low=df['low'],
        window1=9, window2=26, window3=52
    )
    df['ichimoku_tenkan']   = ichimoku.ichimoku_conversion_line()
    df['ichimoku_kijun']    = ichimoku.ichimoku_base_line()
    df['ichimoku_senkou_a'] = ichimoku.ichimoku_a()
    df['ichimoku_senkou_b'] = ichimoku.ichimoku_b()
    df['ichimoku_chikou']   = df['close'].shift(-26)

    # 7. Fibonacci Retracements (52-week rolling window)
    window_52w = min(252, len(df))
    roll_high = df['high'].rolling(window_52w).max()
    roll_low  = df['low'].rolling(window_52w).min()
    df['fib_high'] = roll_high
    df['fib_low']  = roll_low
    df['fib_236']  = roll_high - (roll_high - roll_low) * 0.236
    df['fib_382']  = roll_high - (roll_high - roll_low) * 0.382
    df['fib_500']  = roll_high - (roll_high - roll_low) * 0.500
    df['fib_618']  = roll_high - (roll_high - roll_low) * 0.618
    df['fib_786']  = roll_high - (roll_high - roll_low) * 0.786

    # Replace NaN with None for MongoDB
    df = df.where(pd.notnull(df), None)

    # Bulk update to MongoDB
    from pymongo import UpdateOne
    operations = []

    for _, row in df.iterrows():
        update_doc = {
            "rsi":               row.get('rsi'),
            "macd":              row.get('macd'),
            "macd_signal":       row.get('macd_signal'),
            "sma_50":            row.get('sma_50'),
            "sma_200":           row.get('sma_200'),
            "bb_high":           row.get('bb_high'),
            "bb_low":            row.get('bb_low'),
            "bb_mid":            row.get('bb_mid'),
            "bb_pct":            row.get('bb_pct'),
            "obv":               row.get('obv'),
            "ichimoku_tenkan":   row.get('ichimoku_tenkan'),
            "ichimoku_kijun":    row.get('ichimoku_kijun'),
            "ichimoku_senkou_a": row.get('ichimoku_senkou_a'),
            "ichimoku_senkou_b": row.get('ichimoku_senkou_b'),
            "ichimoku_chikou":   row.get('ichimoku_chikou'),
            "fib_high":          row.get('fib_high'),
            "fib_low":           row.get('fib_low'),
            "fib_236":           row.get('fib_236'),
            "fib_382":           row.get('fib_382'),
            "fib_500":           row.get('fib_500'),
            "fib_618":           row.get('fib_618'),
            "fib_786":           row.get('fib_786'),
        }
        operations.append(UpdateOne({"_id": row['_id']}, {"$set": update_doc}))

    if operations:
        batch_size = 1000
        total_modified = 0
        for i in range(0, len(operations), batch_size):
            result = market_data.bulk_write(operations[i:i+batch_size])
            total_modified += result.modified_count
        print(f"[{ticker}] Updated {total_modified} records with extended indicators.")


def process_all_stocks():
    tickers = market_data.distinct("ticker")
    print(f"Found {len(tickers)} tickers to process.")
    for ticker in tickers:
        add_indicators_to_stock(ticker)


if __name__ == "__main__":
    process_all_stocks()
