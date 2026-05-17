import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import news_data, macro_data, company_info, market_data
from pymongo import UpdateOne
from datetime import datetime

def store_news(items):
    """
    Stores a list of news items into the news_data collection.
    Prevents duplicates based on title and date.
    """
    if not items:
        return
        
    operations = []
    for item in items:
        # Ensure we have required fields
        if not item.get("title") or not item.get("date"):
            continue
            
        item["fetched_at"] = datetime.now()
        operations.append(
            UpdateOne(
                {"title": item["title"], "date": item["date"]},
                {"$set": item},
                upsert=True
            )
        )
        
    if operations:
        result = news_data.bulk_write(operations)
        print(f"[STORE] News items processed: {len(items)}. Upserted: {result.upserted_count}, Modified: {result.modified_count}")

def store_macro_events(events):
    """
    Stores a list of macro events into the macro_data collection.
    """
    if not events:
        return
        
    operations = []
    for event in events:
        event["fetched_at"] = datetime.now()
        operations.append(
            UpdateOne(
                {"title": event["title"], "date": event["date"]},
                {"$set": event},
                upsert=True
            )
        )
        
    if operations:
        result = macro_data.bulk_write(operations)
        print(f"[STORE] Macro events processed: {len(events)}. Upserted: {result.upserted_count}, Modified: {result.modified_count}")

def store_company_info(ticker, info):
    """
    Stores/Updates company fundamental info and foreign ratio.
    """
    company_info.update_one(
        {"ticker": ticker},
        {"$set": {
            "ticker": ticker,
            "info": info,
            "updated_at": datetime.now().isoformat()
        }},
        upsert=True
    )
    print(f"[STORE] Company info updated for {ticker}")
