from backend.database import market_data
print("XAUUSD=X count:", market_data.count_documents({"ticker": "XAUUSD=X"}))
print("XAGUSD=X count:", market_data.count_documents({"ticker": "XAGUSD=X"}))
print("CL=F count:", market_data.count_documents({"ticker": "CL=F"}))
