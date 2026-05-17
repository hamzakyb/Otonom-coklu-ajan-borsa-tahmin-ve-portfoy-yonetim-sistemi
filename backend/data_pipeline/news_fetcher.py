import requests
import xml.etree.ElementTree as ET
from datetime import datetime

# Financial & BIST Focused Turkish Economy RSS Feeds
RSS_FEEDS = [
    "https://www.bloomberght.com/rss",
    "https://tr.investing.com/rss/news.rss",             # Investing Haberleri
    "https://tr.investing.com/rss/market_overview.rss",  # Investing Piyasa Özeti
    "https://tr.tradingview.com/feed/",                  # TradingView Analist Yorumları ve Fikirleri
    "https://www.dunya.com/rss",
    "https://www.trthaber.com/ekonomi_articles.rss",
    "https://www.haberturk.com/rss/ekonomi.xml"
]

def fetch_daily_news():
    print("Fetching daily economy news...")
    news_items = []
    
    for feed_url in RSS_FEEDS:
        print(f"Fetching from {feed_url}...")
        try:
            response = requests.get(feed_url, timeout=10)
            if response.status_code == 200:
                root = ET.fromstring(response.content)
                # RSS standard has <channel> -> <item>
                for item in root.findall('.//item'):
                    title = item.find('title').text if item.find('title') is not None else ""
                    description = item.find('description').text if item.find('description') is not None else ""
                    link = item.find('link').text if item.find('link') is not None else ""
                    pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
                    
                    news_items.append({
                        "title": title,
                        "description": description,
                        "link": link,
                        "published_at": pub_date,
                        "source": feed_url,
                        "fetched_at": datetime.now().isoformat()
                    })
        except Exception as e:
            print(f"Error fetching from {feed_url}: {e}")
            
    print(f"Fetched {len(news_items)} news articles.")
    
    # Store to database
    from data_pipeline.store_util import store_news
    store_news(news_items)
    
    return news_items

if __name__ == "__main__":
    news = fetch_daily_news()
    print("Sample news:")
    for n in news[:5]:
        print(f"- {n['title'].strip()} ({n['source']})")
