import requests
import xml.etree.ElementTree as ET
import urllib.parse
import json

# Define human-readable search queries for sectors
SECTOR_QUERIES = {
    'BANKA': 'Bankacılık Sektörü Merkez Bankası ekonomi',
    'HOLDING': 'Holding Borsa İstanbul',
    'HAVACILIK': 'Havacılık Sektörü Uçuş Turizm',
    'TELEKOM': 'Telekomünikasyon Sektörü İnternet Teknoloji',
    'OTOMOTIV': 'Otomotiv Sektörü İhracat Üretim',
    'DEMIR_CELIK': 'Demir Çelik Sektörü Sanayi İhracat',
    'PERAKENDE': 'Perakende Market Sektörü Enflasyon Gıda'
}

def get_sector_query(ticker: str) -> str:
    # A basic categorization of BIST heavyweights for peer comparison
    from data_pipeline.correlation import BIST_SECTORS
    base_ticker = ticker.replace('.IS', '')
    for sector, peers in BIST_SECTORS.items():
        if base_ticker in peers:
            return SECTOR_QUERIES.get(sector, sector)
    return "Türkiye piyasa borsa şirket"

def fetch_sector_news(ticker: str) -> dict:
    """
    Fetches the latest macro sector news (Aviation, Banking, etc.) using Google News RSS.
    """
    # Create the search query
    sector_query = get_sector_query(ticker)
    query = f"{sector_query} haberleri"
    encoded_query = urllib.parse.quote(query)
    
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=tr&gl=TR&ceid=TR:tr"
    
    try:
        # Google News RSS requires a standard User-Agent to avoid 403 blocks
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return {"error": f"Failed to fetch sector news. Status: {response.status_code}"}
            
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
            
            # Limit to the top 4 general sector news
            if len(news_items) >= 4:
                break
                
        return {
            "ticker": ticker.split('.')[0],
            "sector_query": sector_query,
            "latest_sector_news": news_items,
            "count": len(news_items)
        }
        
    except Exception as e:
        print(f"Error fetching Sector news for {ticker}: {e}")
        return {}

if __name__ == "__main__":
    test_ticker = "THYAO"
    print(f"Testing Sector news fetcher for {test_ticker}...")
    events = fetch_sector_news(test_ticker)
    for k, v in events.items():
        if k == 'latest_sector_news':
            for n in v:
                print(f" - {n['title']} ({n['source']})")
        else:
            print(f"{k}: {v}")
