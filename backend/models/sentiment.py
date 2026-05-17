from transformers import pipeline
import torch
import warnings

warnings.filterwarnings("ignore")

device = 0 if torch.backends.mps.is_available() else -1
print(f"Sentiment logic using device ID: {device} (0=MPS/GPU, -1=CPU)")

MODEL_NAME = "savasy/bert-base-turkish-sentiment-cased"

try:
    print(f"Loading {MODEL_NAME} pipeline...")
    sentiment_pipeline = pipeline("sentiment-analysis", model=MODEL_NAME, tokenizer=MODEL_NAME, device=device)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    sentiment_pipeline = None

def analyze_sentiment(news_text: str) -> int:
    """
    Analyzes the economic news text using a pre-trained Turkish Sentiment model and returns:
    -1 (Negative)
     0 (Neutral / Error)
     1 (Positive)
    """
    if sentiment_pipeline is None:
        return 0

    try:
        # Pipeline takes max 512 tokens, we truncate simply by character length to be safe before passing
        safe_text = news_text[:2000]
        result = sentiment_pipeline(safe_text)[0]
        label = result['label'] # 'positive' or 'negative'
        
        if label.lower() == 'positive':
            return 1
        elif label.lower() == 'negative':
            return -1
        else:
            return 0
    except Exception as e:
        print(f"Error in sentiment prediction: {e}")
        return 0

if __name__ == "__main__":
    # Test cases
    sample_news_positive = "Şirketin net kârı geçen yılın aynı dönemine göre yüzde 50 artış gösterdi."
    sample_news_negative = "Enflasyon oranlarındaki beklenmedik yükseliş piyasaları vurdu, hisselerde sert düşüş."
    
    score1 = analyze_sentiment(sample_news_positive)
    score2 = analyze_sentiment(sample_news_negative)
    
    print(f"Text: '{sample_news_positive}' -> Score: {score1}")
    print(f"Text: '{sample_news_negative}' -> Score: {score2}")
