import requests
from bs4 import BeautifulSoup

# Test TradingView Turkish Ideas RSS
tv_url = "https://tr.tradingview.com/feed/"
try:
    headers = {'User-Agent': 'Mozilla/5.0'}
    r = requests.get(tv_url, headers=headers, timeout=5)
    print(f"TradingView RSS Status: {r.status_code}")
except Exception as e:
    print(e)
