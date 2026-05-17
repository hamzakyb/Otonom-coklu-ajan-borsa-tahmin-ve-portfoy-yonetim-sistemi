import requests
import xml.etree.ElementTree as ET
from datetime import datetime
import urllib.parse
import json

def fetch_kap_and_insider_news(ticker: str) -> dict:
    """
    Fetches the latest company-specific news and KAP (Kamuyu Aydınlatma Platformu) 
    announcements for a given BIST ticker using Google News RSS.
    """
    # Remove .IS if it exists to get the pure stock name
    base_ticker = ticker.split('.')[0]
    
    # Create the search query: "THYAO hisse KAP haberleri"
    query = f"{base_ticker} hisse KAP haberleri"
    encoded_query = urllib.parse.quote(query)
    
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=tr&gl=TR&ceid=TR:tr"
    
    try:
        # Google News RSS requires a standard User-Agent to avoid 403 blocks
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return {"error": f"Failed to fetch news. Status: {response.status_code}"}
            
        # Parse XML
        root = ET.fromstring(response.content)
        
        news_items = []
        # Find all 'item' tags in the RSS feed
        for item in root.findall('./channel/item'):
            title = item.find('title').text if item.find('title') is not None else ""
            pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ""
            source = item.find('source').text if item.find('source') is not None else "Bilinmiyor"
            
            # Clean up the title (Google News appends ' - SourceName' at the end of titles)
            if " - " in title:
                title = " - ".join(title.split(" - ")[:-1])
                
            news_items.append({
                "title": title,
                "source": source,
                "date": pub_date
            })
            
            # Limit to the top 5 most recent breaking news items for this specific stock
            if len(news_items) >= 5:
                break
                
        res = {
            "ticker": base_ticker,
            "latest_company_news": news_items,
            "count": len(news_items)
        }
        
        # Store to news_data collection
        from data_pipeline.store_util import store_news
        # Adapt format for store_news
        items_to_store = []
        for item in news_items:
            # Add ticker context to news item
            item["ticker"] = base_ticker
            item["category"] = "KAP"
            items_to_store.append(item)
        
        store_news(items_to_store)
        
        return res
        
    except Exception as e:
        print(f"Error fetching KAP news for {ticker}: {e}")
        return {}

if __name__ == "__main__":
    test_ticker = "THYAO"
    print(f"Testing KAP/Insider news fetcher for {test_ticker}...")
    events = fetch_kap_and_insider_news(test_ticker)
    print(json.dumps(events, indent=2, ensure_ascii=False))
