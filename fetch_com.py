from backend.data_pipeline.yfinance_fetcher import fetch_and_store_data, COMMODITIES_TICKERS
from backend.data_pipeline.indicators import add_indicators_to_stock

fetch_and_store_data(tickers=COMMODITIES_TICKERS, period="5y")
for t in COMMODITIES_TICKERS:
    add_indicators_to_stock(t)

