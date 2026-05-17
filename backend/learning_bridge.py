import time
import os
import sys
from datetime import datetime

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import market_data
from train_models import train_all_available_stocks

def check_and_train():
    """
    Checks if there's enough new data or if it's time to retrain models.
    For this demo, we check the count of market data records.
    """
    print(f"[{datetime.now()}] Learning Bridge: Checking system state...")
    
    # In a real app, you'd store 'last_trained_count' in a config collection
    # Here we just check total records as a proxy
    count = market_data.count_documents({})
    print(f"Current market data records: {count}")
    
    # Logic: If we have more than 1000 records and no weights exist, or periodic check
    # For now, we simulate an autonomous trigger
    weights_exist = any(f.endswith(".pth") for f in os.listdir("models") if os.path.isfile(os.path.join("models", f)))
    
    if not weights_exist and count > 100:
        print("Initial training required. Starting now...")
        train_all_available_stocks()
    elif count % 500 == 0: # Every 500 new data points (approx every few days of BIST 100 updates)
        print("Periodic retraining threshold reached. Updating models...")
        train_all_available_stocks()
    else:
        print("System is up to date. No retraining needed at this moment.")

if __name__ == "__main__":
    check_and_train()
