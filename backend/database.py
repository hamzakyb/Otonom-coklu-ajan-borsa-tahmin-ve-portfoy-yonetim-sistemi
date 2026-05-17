import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# We support both MONGO_URL and MONGO_URI (common mismatch)
MONGO_URI = os.getenv("MONGO_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017/"
DB_NAME = "ayssoft_bist_ai"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Define Collections FIRST so they are always available for import
market_data = db["market_data"]
agent_memory = db["agent_memory"]
saved_portfolios = db["saved_portfolios"]
users_db = db["users"] # main.py expects users_db
refresh_tokens = db["refresh_tokens"] # main.py expects refresh_tokens
news_data = db["news_data"]
macro_data = db["macro_data"]
company_info = db["company_info"]
trade_vault = db["trade_vault"]
trade_history = db["trade_history"]
ticker_insights = db["ticker_insights"]

try:
    # Attempt indexing safely
    market_data.create_index([("ticker", 1), ("date", -1)])
    saved_portfolios.create_index("user_id")
    users_db.create_index("email", unique=True)
    refresh_tokens.create_index("token")
    news_data.create_index([("title", 1), ("date", -1)], unique=True)
    macro_data.create_index([("title", 1), ("date", 1)], unique=True)
    news_data.create_index("fetched_at", expireAfterSeconds=2592000) # 30 days
    macro_data.create_index("fetched_at", expireAfterSeconds=2592000) # 30 days
    company_info.create_index("ticker", unique=True)
    ticker_insights.create_index("ticker", unique=True)
    print("MongoDB connection and indexing successful.")
except Exception as e:
    # If indexing fails (e.g. index already exists with different name), we still want the app to run
    print(f"Index initialization warning (non-fatal): {e}")
except:
    print("Unknown database initialization error.")
