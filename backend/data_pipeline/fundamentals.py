import yfinance as yf

def fetch_fundamentals(ticker: str) -> dict:
    """
    Fetches fundamental data for a given BIST ticker using yfinance.
    Appends '.IS' to the ticker to match Yahoo Finance's BIST format.
    """
    yf_ticker = f"{ticker}.IS"
    try:
        stock = yf.Ticker(yf_ticker)
        info = stock.info
        
        # Extract key valuation and profitability metrics
        fundamentals = {
            "pe_ratio": info.get("trailingPE", "N/A"),             # F/K Oranı
            "forward_pe": info.get("forwardPE", "N/A"),            # İleri F/K
            "pb_ratio": info.get("priceToBook", "N/A"),            # PD/DD Oranı
            "roe": info.get("returnOnEquity", "N/A"),              # Özsermaye Kârlılığı
            "profit_margin": info.get("profitMargins", "N/A"),     # Kâr Marjı
            "debt_to_equity": info.get("debtToEquity", "N/A"),     # Borç/Özsermaye
            "revenue_growth": info.get("revenueGrowth", "N/A"),    # Gelir Büyümesi
            "market_cap": info.get("marketCap", "N/A"),            # Piyasa Değeri
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A")
        }
        return fundamentals
    except Exception as e:
        print(f"Error fetching fundamentals for {yf_ticker}: {e}")
        return {}

if __name__ == "__main__":
    test_ticker = "THYAO"
    print(f"Testing fundamentals for {test_ticker}...")
    data = fetch_fundamentals(test_ticker)
    print(data)
