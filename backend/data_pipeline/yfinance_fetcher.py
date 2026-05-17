import yfinance as yf
import pandas as pd
from datetime import datetime
import sys
import os

# Ensure we can import database from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import market_data

# BIST 100 Tickers
BIST100_TICKERS = [
    "AEFES.IS", "AGHOL.IS", "AHGAZ.IS", "AKBNK.IS", "AKCNS.IS", "AKFGY.IS", "AKFYE.IS", "AKSA.IS", "AKSEN.IS", "ALARK.IS", 
    "ALBRK.IS", "ALFAS.IS", "ANELE.IS", "ARCLK.IS", "ASELS.IS", "ASTOR.IS", "ASUZU.IS", "AYDEM.IS", "BAGFS.IS", "BERA.IS", 
    "BIENP.IS", "BIMAS.IS", "BIOEN.IS", "BOBET.IS", "BRSAN.IS", "BRYAT.IS", "BSOKE.IS", "BTCIM.IS", "CANTE.IS", "CCOLA.IS", 
    "CIMSA.IS", "CWENE.IS", "DOAS.IS", "DOHOL.IS", "EGEEN.IS", "EKGYO.IS", "ENERY.IS", "ENJSA.IS", "ENKAI.IS", "EREGL.IS", 
    "EUPWR.IS", "EUREN.IS", "FROTO.IS", "GARAN.IS", "GENIL.IS", "GESAN.IS", "GOKNR.IS", "GOZDE.IS", "GSDHO.IS", "GUBRF.IS", 
    "GWIND.IS", "HALKB.IS", "HEKTS.IS", "IPEKE.IS", "ISCTR.IS", "ISDMR.IS", "ISGYO.IS", "ISMEN.IS", "IZENR.IS", "KAYSE.IS", 
    "KCAER.IS", "KCHOL.IS", "KENT.IS", "KLSER.IS", "KONTR.IS", "KORDS.IS", "KOZAA.IS", "KOZAL.IS", "KRDMD.IS", "KZBGY.IS", 
    "MAVI.IS", "MGROS.IS", "MIATK.IS", "ODAS.IS", "OTKAR.IS", "OYAKC.IS", "PASEU.IS", "PENTA.IS", "PETKM.IS", "PGSUS.IS", 
    "QUAGR.IS", "REEDR.IS", "SAHOL.IS", "SASA.IS", "SAYAS.IS", "SDTTR.IS", "SISE.IS", "SKBNK.IS", "SMRTG.IS", "SOKM.IS", 
    "TABGD.IS", "TARKN.IS", "TAVHL.IS", "TCELL.IS", "THYAO.IS", "TKFEN.IS", "TMSN.IS", "TOASO.IS", "TSKB.IS", "TTKOM.IS", 
    "TUPRS.IS", "TURSG.IS", "ULKER.IS", "VAKBN.IS", "VESBE.IS", "VESTL.IS", "YEOTK.IS", "YKBNK.IS", "YYLGD.IS", "ZOREN.IS"
]

# Global Commodities Tickers
COMMODITIES_TICKERS = [
    "GC=F", # Gold Futures
    "SI=F", # Silver Futures
    "CL=F", # Crude Oil WTI
    "USDTRY=X" # USD/TRY Exchange Rate
]

# BIST Indices for Correlation & Beta
BIST_INDICES = [
    "XU100.IS", # BIST 100
    "XU030.IS", # BIST 30
    "XBANK.IS", # BIST Banks
    "XHOLD.IS"  # BIST Holdings
]

def fetch_and_store_data(tickers=BIST100_TICKERS + COMMODITIES_TICKERS + BIST_INDICES, period="5y"):
    print(f"Fetching {period} of historical data for tracked assets...")
    
    for ticker in tickers:
        print(f"Processing {ticker}...")
        try:
            stock = yf.Ticker(ticker)
            df = stock.history(period=period)
            
            if df.empty:
                print(f"No data found for {ticker}")
                continue
            
            # Reset index to make Date a column instead of index
            df.reset_index(inplace=True)
            
            # Convert Date to string or standard datetime for MongoDB
            records = []
            for _, row in df.iterrows():
                record = {
                    "ticker": ticker,
                    "date": row["Date"].strftime("%Y-%m-%d"),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                    "volume": float(row["Volume"])
                }
                records.append(record)
                
            if records:
                # Upsert records to prevent duplicates
                from pymongo import UpdateOne
                operations = [
                    UpdateOne(
                        {"ticker": r["ticker"], "date": r["date"]},
                        {"$set": r},
                        upsert=True
                    ) for r in records
                ]
                
                if operations:
                    result = market_data.bulk_write(operations)
                    print(f"[{ticker}] Upserted: {result.upserted_count}, Modified: {result.modified_count}")
                
        except Exception as e:
            print(f"Error processing {ticker}: {e}")

if __name__ == "__main__":
    fetch_and_store_data()
