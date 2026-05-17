import requests

RSS_FEEDS = [
    "https://www.bloomberght.com/rss",
    "https://tr.investing.com/rss/news.rss",             # Investing Haberleri
    "https://tr.investing.com/rss/market_overview.rss",  # Investing Piyasa Özeti
    "https://tr.tradingview.com/feed/",                  # TradingView Analist Yorumları ve Fikirleri
    "https://www.dunya.com/rss",
    "https://www.trthaber.com/ekonomi_articles.rss",
    "https://www.haberturk.com/rss/ekonomi.xml"
]

for url in RSS_FEEDS:
    try:
        r = requests.get(url, timeout=5)
        print(f"{url}: Status {r.status_code}")
    except Exception as e:
        print(f"{url}: ERROR {e}")
