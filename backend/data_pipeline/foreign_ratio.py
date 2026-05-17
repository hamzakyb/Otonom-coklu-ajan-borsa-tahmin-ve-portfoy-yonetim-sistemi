import requests
from bs4 import BeautifulSoup
import re

def fetch_foreign_ratio(ticker: str) -> str:
    """
    Attempts to scrape the 'Yabancı Takas Oranı' (Foreign Ownership Ratio)
    from public financial websites (Is Yatirim) for a given BIST ticker.
    """
    clean_ticker = ticker.replace('.IS', '').upper()
    url = f"https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/default.aspx?hisse={clean_ticker}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code != 200:
            return "Bilinmiyor (Sunucu Hatası)"
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # In Is Yatirim, yabancı oran is typically displayed in the summary tables.
        # As web structures change, we will look for the text "Yabancı Oranı"
        # and extract the next numeric value.
        page_text = soup.get_text()
        
        # Regex to find something like "Yabancı Oranı (%) 34.50"
        match = re.search(r'Yabancı Oran[ıi].*?(\d{1,2}[\.,]\d{1,2})', page_text, re.IGNORECASE | re.DOTALL)
        
        if match:
            ratio = match.group(1).replace(',', '.')
            return f"%{ratio}"
        else:
            return "Bilinmiyor (Veri Bulunamadı)"
            
    except Exception as e:
        print(f"Error fetching foreign ratio for {clean_ticker}: {e}")
        return "Bilinmiyor (Bağlantı Hatası)"

if __name__ == "__main__":
    print("Testing Foreign Ratio Scraper...")
    print("THYAO:", fetch_foreign_ratio("THYAO"))
    print("GARAN:", fetch_foreign_ratio("GARAN"))
