import os
import requests
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

# We will read setup info from ENV. User will customize this.
WHATSAPP_PHONE = os.getenv("WHATSAPP_PHONE", "")
WHATSAPP_APIKEY = os.getenv("WHATSAPP_APIKEY", "")

def send_whatsapp_message(text: str):
    """
    Sends a WhatsApp message using the free CallMeBot API.
    Returns True if successful, False otherwise.
    """
    if not WHATSAPP_PHONE or not WHATSAPP_APIKEY:
        print("[WhatsApp] API Key veya Telefon eksik. Lütfen .env dosyasını güncelleyin.")
        return False
        
    try:
        encoded_text = urllib.parse.quote(text)
        url = f"https://api.callmebot.com/whatsapp.php?phone={WHATSAPP_PHONE}&text={encoded_text}&apikey={WHATSAPP_APIKEY}"
        
        response = requests.get(url, timeout=15)
        
        if response.status_code == 200:
            print("[WhatsApp] Mesaj başarıyla gönderildi!")
            return True
        else:
            print(f"[WhatsApp] Hata kodu: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"[WhatsApp] Beklenmeyen Hata: {e}")
        return False

# Self-test block: Use this directly from python if wanted
if __name__ == "__main__":
    test_msg = "🟢 *OmniQuant AI Devrede!*\n\nBu bir deneme mesajıdır. Asistanınıza başarıyla bağlandınız."
    send_whatsapp_message(test_msg)
