import sys, os
sys.path.append(os.path.abspath('.'))
from agents.crew_setup import run_rebalance_crew
from dotenv import load_dotenv
load_dotenv()

mock_port = {
    "reserve_cash": 1000,
    "allocations": [{"ticker":"THYAO","lots":5,"amount_tl":1000,"bought_price":200,"current_price":200,"pnl_tl":0,"pnl_percent":0}],
    "market_sentiment":"Nötr"
}

print("Running rebalance...")
try:
    res = run_rebalance_crew(mock_port)
    print("Result:")
    print(res)
except Exception as e:
    print(f"Error: {e}")
