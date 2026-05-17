import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime

# A basic categorization of BIST heavyweights for peer comparison
BIST_SECTORS = {
    'BANKA': ['AKBNK', 'GARAN', 'ISCTR', 'YKBNK', 'VAKBN', 'HALKB', 'ALBRK'],
    'HOLDING': ['KCHOL', 'SAHOL', 'ALARK', 'DOHOL', 'AGHOL'],
    'HAVACILIK': ['THYAO', 'PGSUS', 'TAVHL'],
    'TELEKOM': ['TCELL', 'TTKOM'],
    'OTOMOTIV': ['FROTO', 'TOASO', 'DOAS', 'OTKAR'],
    'DEMIR_CELIK': ['EREGL', 'KRDMD', 'ISDMR'],
    'PERAKENDE': ['BIMAS', 'MGROS', 'SOKM', 'ULKER'],
    'ENERJI': ['AKSEN', 'ENJSA', 'ODAS', 'ZOREN', 'AYDEM'],
    'SAVUNMA': ['ASELS', 'SDTTR'],
}

# Mapping Sectors to their relevant Benchmark Index
SECTOR_INDEX_MAP = {
    'BANKA': 'XBANK.IS',
    'HOLDING': 'XHOLD.IS',
    'ENERJI': 'XU100.IS', 
}

def get_sector_and_peers(ticker: str):
    base_ticker = ticker.replace('.IS', '').upper()
    for sector, peers in BIST_SECTORS.items():
        if base_ticker in peers:
            return sector, [p for p in peers if p != base_ticker]
    return "DIGER", []

def fetch_index_correlation(ticker: str) -> dict:
    """
    Calculates the correlation and Beta of a ticker against XU100 (BIST 100) 
    and its specific sector index over the last 90 days.
    """
    base_ticker = ticker.replace('.IS', '').upper()
    sector, _ = get_sector_and_peers(base_ticker)
    
    main_benchmark = "XU100.IS"
    sector_benchmark = SECTOR_INDEX_MAP.get(sector, "XU100.IS")
    
    tickers_to_fetch = [f"{base_ticker}.IS", main_benchmark]
    if sector_benchmark != main_benchmark:
        tickers_to_fetch.append(sector_benchmark)
        
    try:
        # Fetch 90 days of daily close data
        data = yf.download(tickers_to_fetch, period="90d", interval="1d", progress=False)['Close']
        if data.empty or f"{base_ticker}.IS" not in data.columns:
            return {}
            
        data = data.dropna()
        if len(data) < 20:
            return {}
            
        # 1. Calculate Returns
        returns = data.pct_change().dropna()
        
        # 2. Pearson Correlation with XU100
        corr_xu100 = returns[f"{base_ticker}.IS"].corr(returns[main_benchmark])
        
        # 3. Beta Calculation ( Covariance / Variance of Market )
        covariance = returns[f"{base_ticker}.IS"].cov(returns[main_benchmark])
        variance = returns[main_benchmark].var()
        beta = covariance / variance if variance > 0 else 1.0
        
        # 4. Relative Strength (RS) - Performance vs XU100 over 90 days
        stock_perf = (data[f"{base_ticker}.IS"].iloc[-1] / data[f"{base_ticker}.IS"].iloc[0]) - 1
        market_perf = (data[main_benchmark].iloc[-1] / data[main_benchmark].iloc[0]) - 1
        relative_strength = stock_perf - market_perf
        
        # 5. Sector Index Correlation
        corr_sector = returns[f"{base_ticker}.IS"].corr(returns[sector_benchmark]) if sector_benchmark in data.columns else corr_xu100
        
        return {
            "ticker": base_ticker,
            "sector": sector,
            "beta": round(float(beta), 2),
            "corr_xu100": round(float(corr_xu100), 2),
            "corr_sector": round(float(corr_sector), 2),
            "relative_strength": round(float(relative_strength) * 100, 2), # percentage
            "benchmark_index": sector_benchmark.replace('.IS', '')
        }
    except Exception as e:
        print(f"[Correlation] Error fetching index data for {base_ticker}: {e}")
        return {}

def fetch_correlation_arbitrage(ticker: str) -> dict:
    """
    Peer Arbitrage (Pair Trading) logic.
    """
    base_ticker = ticker.split('.')[0].upper()
    sector, peers = get_sector_and_peers(base_ticker)
    
    if not peers:
        return {"error": "Peer data unavailable."}
        
    peer_ticker = peers[0] # Top peer
    
    try:
        t1, t2 = f"{base_ticker}.IS", f"{peer_ticker}.IS"
        data = yf.download([t1, t2], period="60d", interval="1d", progress=False)['Close']
        if data.empty: return {}
        
        data = data.dropna()
        p1_norm = data[t1] / data[t1].iloc[0]
        p2_norm = data[t2] / data[t2].iloc[0]
        spread = p1_norm - p2_norm
        
        z_score = (spread.iloc[-1] - spread.mean()) / spread.std() if spread.std() > 0 else 0
        
        return {
            "peer": peer_ticker,
            "z_score": round(float(z_score), 2),
            "opportunity": "AŞIRI DEĞERLİ" if z_score > 2 else ("AŞIRI UCUZ" if z_score < -2 else "NÖTR")
        }
    except Exception as e:
        print(f"[Arbitrage] Error for {base_ticker}: {e}")
        return {}

if __name__ == "__main__":
    t = "AKBNK"
    print(f"Index Correlation for {t}:", fetch_index_correlation(t))
    print(f"Arbitrage for {t}:", fetch_correlation_arbitrage(t))
