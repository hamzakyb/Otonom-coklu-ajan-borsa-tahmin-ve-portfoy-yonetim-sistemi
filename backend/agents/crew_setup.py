import os
import sys
import json
from crewai import Agent, Task, Crew, Process
from langchain_community.llms import Ollama
from langchain_core.tools import Tool

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.sentiment import analyze_sentiment
from models.time_series import predict_next_day
from data_pipeline.news_fetcher import fetch_daily_news
from data_pipeline.fundamentals import fetch_fundamentals
from data_pipeline.momentum import fetch_momentum
from data_pipeline.macro_calendar import fetch_macro_calendar
from data_pipeline.macro_data import fetch_macroeconomic_data
from data_pipeline.correlation import fetch_correlation_arbitrage
from data_pipeline.kap_news import fetch_kap_and_insider_news
from data_pipeline.sector_news import fetch_sector_news
from database import agent_memory, market_data, news_data, macro_data

# For sentence embeddings to store in MongoDB Memory
from sentence_transformers import SentenceTransformer
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Setup Local LLM from Ollama
# Llama 3.2 (3B) is very efficient for an 8GB M1 Mac.
llm = Ollama(model="llama3.2")

def get_current_data_tool(ticker: str):
    """Fetches current data for ticker to serve as basis for analysis."""
    data = list(market_data.find({"ticker": ticker}).sort("date", -1).limit(5))
    return f"Last 5 days data for {ticker}: {data}"

def predict_time_series_tool(ticker: str):
    """Predicts next day close using LSTM."""
    price = predict_next_day(ticker)
    return f"LSTM prediction for next day {ticker} close: {price}" if price else "Not enough data"

def analyze_news_tool(topic: str):
    """Fetches news from DB and returns detailed sentiment report for audited analysis."""
    from datetime import datetime, timedelta
    recent_limit = datetime.now() - timedelta(hours=18)
    news = list(news_data.find({"fetched_at": {"$gte": recent_limit}}).sort("fetched_at", -1).limit(8))
    
    if not news:
        news = fetch_daily_news()
        
    if not news: return "No recent news found for audit."
    
    audit_trail = []
    total_score = 0
    for item in news:
        text = item.get('title', '') + " " + item.get('description', '')
        score = analyze_sentiment(text)
        total_score += score
        audit_trail.append({
            "headline": item.get('title', 'N/A'),
            "score": f"{score:.2f}",
            "label": "Positive" if score > 0.1 else ("Negative" if score < -0.1 else "Neutral")
        })
        
    avg_score = total_score / len(news)
    sentiment_str = "Positive" if avg_score > 0.1 else ("Negative" if avg_score < -0.1 else "Neutral")
    
    return {
        "summary": f"Average Sentiment: {sentiment_str} (Score: {avg_score:.2f})",
        "evidence_top_5": audit_trail[:5],
        "total_analyzed": len(news)
    }
        
def memory_save_tool(insight: str):
    """Vectorizes an insight and saves it into MongoDB agent_memory collection."""
    vector = embedder.encode(insight).tolist()
    agent_memory.insert_one({
        "insight": insight,
        "vector": vector,
        "timestamp": datetime.now()
    })
    return "Saved insight to persistent memory."

def memory_search_tool(query: str):
    """Searches the persistent memory for similar past insights/decisions using vector similarity."""
    query_vector = embedder.encode(query).tolist()
    
    # We fetch all memories (simplified for local demo, in production use $vectorSearch)
    memories = list(agent_memory.find())
    if not memories: return "No past memory found yet."
    
    scored_memories = []
    for m in memories:
        # Simple dot product for similarity (as vectors are normalized by MiniLM)
        sim = np.dot(query_vector, m['vector'])
        scored_memories.append((sim, m['insight']))
    
    # Sort by similarity
    scored_memories.sort(key=lambda x: x[0], reverse=True)
    results = [text for score, text in scored_memories[:3] if score > 0.5]
    
    return f"Recovered past insights: {results}" if results else "No relevant past experiences found for this query."

def fetch_fundamentals_tool(ticker: str):
    """Fetches P/E, P/B, ROE and other fundamentals for a BIST ticker."""
    data = fetch_fundamentals(ticker)
    return f"Fundamentals for {ticker}: {data}" if data else f"No fundamentals found for {ticker}"

def fetch_momentum_tool(ticker: str):
    """Fetches the 15-day volume momentum calculation and checks for abnormal institutional activity."""
    data = fetch_momentum(ticker)
    return f"Momentum & Volume Breakout for {ticker}: {data}" if data else f"No momentum data found for {ticker}"

def fetch_macro_calendar_tool(topic: str = ""):
    """Fetches the global macroeconomic calendar from DB."""
    # Check DB first
    data = list(macro_data.find().sort("fetched_at", -1).limit(15))
    if data:
        # Clean up for LLM (remove MongoDB IDs)
        for d in data: d.pop('_id', None); d.pop('fetched_at', None)
        return f"This week's global macro events (from DB): {data}"
        
    print("[AGENT] DB Macro empty, falling back to live fetch...")
    data = fetch_macro_calendar()
    return f"This week's global macro events: {data}" if data else "No major macro events found."

def fetch_macro_trend_tool(topic: str = ""):
    """Fetches real-time USD/TRY, Gold, and US 10-Yr Bond Yield trends."""
    data = fetch_macroeconomic_data().get("summary", "")
    return f"Current Macro Trends: {data}" if data else "Failed to fetch macro trends."

def fetch_correlation_tool(ticker: str):
    """Calculates Statistical Arbitrage Z-Score for a ticker compared to its sector peers."""
    data = fetch_correlation_arbitrage(ticker)
    return f"Pair Trading / Correlation analysis for {ticker}: {data}" if data else f"No correlation data found for {ticker}."

def fetch_kap_tool(ticker: str):
    """Fetches ticker-specific KAP news from DB and returns audited sentiment report."""
    base_ticker = ticker.split('.')[0].upper()
    data = list(news_data.find({"ticker": base_ticker}).sort("fetched_at", -1).limit(5))
    
    if not data:
        data = fetch_kap_and_insider_news(ticker).get('latest_company_news', [])
        
    if not data: return f"No special KAP news found for {ticker}."
    
    audit_trail = []
    for item in data:
        text = item.get('title', '')
        score = analyze_sentiment(text)
        audit_trail.append({
            "headline": text,
            "score": f"{score:.2f}",
            "impact": "Positive" if score > 0.1 else ("Negative" if score < -0.1 else "Neutral")
        })
        
    return {
        "ticker": ticker,
        "latest_kap_audit": audit_trail,
        "note": "Ajanlar bu tekil haberlere bakarak nihai kararı vermelidir."
    }

def fetch_sector_tool(ticker: str):
    """Fetches macro sector news (e.g. Aviation, Banking) for the given ticker's industry."""
    data = fetch_sector_news(ticker)
    return f"Sector News for {ticker}: {data}" if data else f"No sector news found for {ticker}."

# Custom Tools using Langchain Tool abstraction
get_data_t = Tool(name="Get Latest Market Data", func=get_current_data_tool, description="Get last 5 days OHLCV and indicators for a ticker")
predict_t = Tool(name="Predict LSTM Next Day", func=predict_time_series_tool, description="Gets the LSTM predicted closing price for tomorrow")
fundamental_t = Tool(name="Get Company Fundamentals", func=fetch_fundamentals_tool, description="Gets P/E, P/B, Market Cap and financial ratios for a BIST stock")
momentum_t = Tool(name="Get Volume Momentum", func=fetch_momentum_tool, description="Checks if the stock has abnormal institutional volume/momentum currently")
macro_t = Tool(name="Get Macro Economic Calendar", func=fetch_macro_calendar_tool, description="Fetches upcoming major global economic events and interest rate decisions.")
macro_trend_t = Tool(name="Get Macro Trends", func=fetch_macro_trend_tool, description="Fetches live USD/TRY, Gold, and Global Interest Rate trends.")
correlation_t = Tool(name="Get Stock Correlation", func=fetch_correlation_tool, description="Gets the Pair Trading Z-score to find undervalued/overvalued stocks relative to peers.")
kap_t = Tool(name="Get Specific KAP/Insider News", func=fetch_kap_tool, description="Fetches fresh stock-specific news like dividends, buybacks, and tenders.")
sector_t = Tool(name="Get Sector News", func=fetch_sector_tool, description="Fetches broad industry news for the stock's sector (e.g. auto exports, flight cancellations).")
sentiment_t = Tool(name="Economy News Sentiment", func=analyze_news_tool, description="Analyzes today's economy news sentiment via Turkish BERT")
save_mem_t = Tool(name="Save Corporate Memory", func=memory_save_tool, description="Saves lessons learned or systemic evaluations into vector DB memory")
search_mem_t = Tool(name="Search Corporate Memory", func=memory_search_tool, description="Searches the long-term memory for past stock behaviors and agent mistakes.")

# --- AGENT DEFINITIONS ---

data_gatherer = Agent(
    role="Veri Madencisi (Data Gatherer)",
    goal="Piyasadaki en güncel hisse ve haber verilerini toplayıp formatlamak.",
    backstory="Finansal piyasaların en derin veritabanlarına ulaşan ve verileri sadeleştiren uzman sistem.",
    verbose=True,
    allow_delegation=False,
    tools=[get_data_t],
    llm=llm
)

quant_analyst = Agent(
    role="Teknik Analist (Quant)",
    goal="Hisselerin teknik göstergelerini incelemek ve PyTorch LSTM modelleriyle ertesi gün için tahmin üretmek.",
    backstory="Matematiksel modelleri ve derin öğrenme algoritmalarını harmanlayarak teknik al-sat sinyali üreten kuant ustası.",
    verbose=True,
    allow_delegation=False,
    tools=[predict_t],
    llm=llm
)

sentiment_analyst = Agent(
    role="Duygu Analisti (Sentiment)",
    goal="Ekonomi haberlerini ve genel piyasa duyarlılığını okuyarak piyasanın genel yönü hakkında skor üretmek.",
    backstory="Makroekonomik gelişmeleri ve haber başlıklarındaki gizli duyguları tespit eden NLP uzmanı.",
    verbose=True,
    allow_delegation=False,
    tools=[sentiment_t],
    llm=llm
)

fundamental_analyst = Agent(
    role="Temel Analist (Fundamental)",
    goal="Hisselerin F/K, PD/DD, Kâr Marjı ve Piyasa Değeri gibi rasyolarını şirketin finansal sağlığı açısından yorumlamak.",
    backstory="Bilanço ve gelir tablolarını satır satır okuyan, şirketin gerçek değerini (intrinsic value) hesaplayan değer yatırımcısı.",
    verbose=True,
    allow_delegation=False,
    tools=[fundamental_t],
    llm=llm
)

momentum_analyst = Agent(
    role="Hacim ve Momentum Analisti (Volume Breakout)",
    goal="Hisselerdeki anormal işlem hacmi artışlarını (Volume Surges) yakalayarak kurumsal para giriş/çıkışını (Smart Money) tespit etmek.",
    backstory="Ekrana düşmeden önce büyük balinaların emirlerini hacim barlarından sezen algoritmik sistem.",
    verbose=True,
    allow_delegation=False,
    tools=[momentum_t],
    llm=llm
)

macro_analyst = Agent(
    role="Makro Ekonomi ve Risk Uzmanı",
    goal="Küresel ekonomik takvime (FED/TCMB kararları, vb.) ve haberlere bakarak piyasadaki şok risklerini fiyatlamak.",
    backstory="Tüm fon portföyünü küresel kasırgalardan (faiz kararları, enflasyon verileri) koruyan kıdemli stratejist.",
    verbose=True,
    allow_delegation=False,
    tools=[macro_t, macro_trend_t],
    llm=llm
)

correlation_agent = Agent(
    role="İstatistiksel Arbitraj ve Korelasyon Uzmanı (Pair Trading)",
    goal="Hisselerin kendi içindeki sektörleriyle olan tarihsel spread (makas) bağıntısını (Z-Score) ölçerek geçici fiyat anormalliklerini bulmak.",
    backstory="Sektör içi korelasyon kırılımlarını arayan, piyasa geneli düşerken bile ucuz kalmış kardeşi alıp pahalı kardeşi açığa satmayı hedefleyen kantitatif arbitrajcı.",
    verbose=True,
    allow_delegation=False,
    tools=[correlation_t],
    llm=llm
)

insider_analyst = Agent(
    role="KAP ve Şirket Özel Haber Analisti (Insider)",
    goal="Hisseye özel paylaşılan KAP duyurularını (Temettü, Geri Alım, İhale) ve son dakika şirket haberlerini analiz ederek ani fiyat tepkilerini önceden yakalamak.",
    backstory="Sadece makro veya grafiğe değil, şirketin patronaj kararlarına ve kapalı kapılar ardındaki hikayesine odaklanan dedektif.",
    verbose=True,
    allow_delegation=False,
    tools=[kap_t],
    llm=llm
)

sector_analyst = Agent(
    role="Sektörel Rüzgar Analisti (Sector Analyst)",
    goal="Hissenin ait olduğu sektördeki (Bankacılık, Havacılık vb.) genel haberleri okumak ve regülasyonların/gelişmelerin o sektöre nasıl etki edeceğini bulmak.",
    backstory="Bireysel şirketlere değil, ormanın tamamına (sektöre) bakan, sektör içi rüzgarı (tailwinds/headwinds) hisseden usta analist.",
    verbose=True,
    allow_delegation=False,
    tools=[sector_t],
    llm=llm
)

critic_agent = Agent(
    role="Eleştirmen (Critic/Memory)",
    goal="Sistemin önceki kararlarını sorgulamak, hatalardan ders çıkarmak ve bu dersleri RAG belleğine vektör olarak kaydetmek.",
    backstory="Sürekli öğrenmeyi(Continuous Learning) sağlayan, eski trade hatalarını bellekte tutan vicdan ajan.",
    verbose=True,
    allow_delegation=False,
    tools=[save_mem_t],
    llm=llm
)

risk_manager = Agent(
    role="Risk ve Sermaye Yöneticisi",
    goal="Mevcut toplam bakiyeye (Portfolio Balance) ve risk toleransına göre yatırılacak hisse başına Lot sayısını ve Stop-Loss seviyelerini belirlemek. (Kelly Criteria)",
    backstory="Sermayeyi korumayı her zaman maksimizasyondan daha önde tutan, defansif portföy yöneticisi.",
    verbose=True,
    allow_delegation=False,
    llm=llm
)

master_agent = Agent(
    role="Ana Beyin (Master Agent)",
    goal="Tüm ajanların ürettiği raporları ve tavsiyeleri birleştirerek nihai AL/SAT kararını, dağılım yüzdelerini hesaplamak.",
    backstory="Tüm departmanlardan gelen verileri alıp, son tuşa basan CEO. Geçmiş hafızayı kontrol ederek hatalardan ders çıkarır.",
    verbose=True,
    allow_delegation=False, # Disabled to prevent AgentFinish parsing errors in local LLM
    tools=[search_mem_t], # Master Agent can search previous experiences
    llm=llm
)

def run_analysis_crew(portfolio_balance: float, risk_tolerance: str):
    """Starts the Crew process and returns analysis."""
    
    # We will define generic tasks that get routed through the crew.
    # Due to token and time constraints, a simplified task chain is employed here.
    
    gather_task = Task(
        description="BIST 100 içerisindeki en kritik hisselerin (hacim ve değer bazlı) günün özet verilerini topla.",
        expected_output="Seçilen ana hisselerin mevcut fiyat ve hacimlerini içeren kısa bir JSON.",
        agent=data_gatherer
    )
    
    quant_task = Task(
        description="Veritabanındaki BIST 100 hisseleri için yarına yönelik LSTM fiyat tahminlerini al ve teknik bir AL/SAT/TUT kararı üret.",
        expected_output="Analiz edilen hisseler için tahmini fiyatlar ve teknik yorum.",
        agent=quant_analyst
    )
    
    sentiment_task = Task(
        description="Bugünün ekonomi haberlerini analiz et ve BIST için piyasa duyarlılık skorunu çıkar.",
        expected_output="Piyasanın Genel Yönü: Pozitif/Negatif/Nötr ve Skor.",
        agent=sentiment_analyst
    )
    
    fundamental_task = Task(
        description="Kantitatif analizi yapılan hisselerin temel rasyolarını (F/K, PD/DD, ROE vb.) incele. Şirketler aşırı mı değerli, yoksa ucuz mu? Temel finansal açıdan yorumla.",
        expected_output="Seçili hisseler için temel analiz (Değerleme) yorumları.",
        agent=fundamental_analyst
    )
    
    momentum_task = Task(
        description="Seçilen hisseler için yfinance üzerinden son 15 günlük hacim momentumu incelemesi yap. Anormal bir hacim patlaması (breakout) veya kurumsal para girişi/çıkışı var mı kontrol et.",
        expected_output="Hisseler için Hacim Momentumu ve Anomali tespiti raporu.",
        agent=momentum_analyst
    )
    
    macro_task = Task(
        description="Makroekonomik takvimden gelecek büyük olayları ve GÜNCEL MAKRO TRENDLERI (Dolar/Altın/Faiz yönü) 'Get Macro Trends' aracılığıyla incele. Bu verilerin Türk Borsa yatırımcılarına etkisini tahmin et.",
        expected_output="Gelecek haftanın Makroekonomik Risk Raporu.",
        agent=macro_analyst
    )
    
    correlation_task = Task(
        description="Seçilen hisseler için Pair Trading (İkili İşlem) analizini yap. Sektörel rakipleriyle arasındaki fiyat makası kopmuş mu? Z-Score'a bakarak hangi hissenin çok şiştiğini veya gereksiz ucuz kaldığını tespit et.",
        expected_output="Hisseler için Arbitraj (Aşırı Fiyatlama) Raporu.",
        agent=correlation_agent
    )
    
    insider_task = Task(
        description="Analiz edilen hisseler için son dakika Özel KAP Bildirimlerini (Temettü, Hisse Geri Alımı, İhale, Bedelsiz) kontrol et. Hissenin fiyatını radikal değiştirecek bir temel 'katalizör' var mı?",
        expected_output="Hisseye özel Haber/KAP Katalizör raporu.",
        agent=insider_analyst
    )
    
    sector_task = Task(
        description="Analiz edilen hisselerin ait olduğu sektörlerle ilgili gelişmeleri (Örn: Havacılık sektörü krizleri, bankacılık regülasyonları) tara. Sektörel olarak rüzgar arkadan mı esiyor karşıdan mı?",
        expected_output="Sektörel Haberler ve Etki (Tailwinds/Headwinds) Raporu.",
        agent=sector_analyst
    )
    
    risk_task = Task(
        description=f"Toplam bakiye: {portfolio_balance} TL. Risk Profil: {risk_tolerance}. "
                    "Bu verilerle quant, sentiment, fundamental, momentum, makro, arbitraj, KAP ve sektörel haber raporlarına dayanarak sermaye tahsisi ve stop-loss seviyeleri belirle.",
        expected_output="Her hisse için alınacak Net TL tutarı, Lot sayısı ve Stop-loss seviyesi planı.",
        agent=risk_manager
    )
    
    master_task = Task(
        description="Önceki tüm raporları sentezle. ÖNCELİKLE 'Search Corporate Memory' aracını kullanarak bu hisseler veya piyasa durumu hakkında geçmişte kaydedilmiş bir 'insight' veya hata olup olmadığını kontrol et. Sonuç olarak reserve_cash, overall_rationale (Başkan'ın genel strateji özeti ve hisseleri seçme nedenleri), allocations(ticker, amount_tl, lots, stop_loss, target, reason), market_sentiment, lessons_learned (bu analizden çıkarılan yeni ders) alanlarını içeren KESİN bir yatırım kararı yayınla. UYARI: SADECE GEÇERLİ BİR JSON FORMATI DÖNDÜRÜN. SOHBETE BENZER VEYA AÇIKLAYICI HİÇBİR CÜMLE KULLANMAYIN. JSON DIŞINDA HİÇBİR KARAKTER KULLANMA.",
        expected_output="SADECE GEÇERLİ JSON. BAŞKA HİÇBİR KELİME YOK.",
        agent=master_agent
    )

    crew = Crew(
        agents=[data_gatherer, quant_analyst, sentiment_analyst, fundamental_analyst, momentum_analyst, macro_analyst, correlation_agent, insider_analyst, sector_analyst, risk_manager, master_agent],
        tasks=[gather_task, quant_task, sentiment_task, fundamental_task, momentum_task, macro_task, correlation_task, insider_task, sector_task, risk_task, master_task],
        process=Process.sequential,
        verbose=True
    )
    
    result = crew.kickoff()
    return result

def run_rebalance_crew(portfolio_data: dict):
    """
    Takes an existing saved portfolio with current PnL data,
    runs a specialized rebalancing agent workflow to advise on next steps.
    """
    
    # We create a specific task for rebalancing that uses the same agents
    portfolio_str = json.dumps(portfolio_data, ensure_ascii=False, indent=2) if 'json' in sys.modules else str(portfolio_data)
    
    quant_task = Task(
        description=f"Şu anki kayıtlı portföy durumu: {portfolio_str}. Bu hisselerin her biri için veritabanındaki (yada hafızadaki) en son verilere bakarak, LSTM teknik analizi ve destek/direnç durumlarını özetle.",
        expected_output="Her bir hisse için kısa teknik durum özeti.",
        agent=quant_analyst
    )
    
    sentiment_task = Task(
        description=f"Kayıtlı portföydeki hisseleri ({portfolio_str}) etkileyebilecek bugünün güncel haberlerine bak. Haberler bu hisseler için olumlu mu, olumsuz mu?",
        expected_output="Portföydeki hisselere yönelik özel piyasa duyarlılık özeti.",
        agent=sentiment_analyst
    )
    
    fundamental_task = Task(
        description=f"Kayıtlı portföydeki hisselerin ({portfolio_str}) en güncel finansal rasyolarını (F/K, PD/DD, Kâr Marjı) çek. Bu şirketler şu an ucuz mu pahalı mı yansıt.",
        expected_output="Şirketlerin değerlemesi ve bilançolarının sağlığı hakkında kısa finansal rapor.",
        agent=fundamental_analyst
    )
    
    momentum_task = Task(
        description=f"Kayıtlı portföydeki hisselerin ({portfolio_str}) son işlem günündeki hacmini son 14 günlük ortalamayla kıyasla. Olağandışı bir balina alımı/satımı var mı özetle.",
        expected_output="Portföydeki hisseler için tespit edilen Hacim Momentumu özeti.",
        agent=momentum_analyst
    )
    
    macro_task = Task(
        description="Makroekonomik takvimden (ForexFactory) gelecek büyük küresel olayları ve 'Get Macro Trends' ile güncel Dolar/Altın kurunu inceleyerek, bu olayların kayıtlı portföyümüz için sistematik risk yaratıp yaratmayacağını değerlendir.",
        expected_output="Portföye yönelik Makroekonomik Risk Analizi.",
        agent=macro_analyst
    )
    
    correlation_task = Task(
        description=f"Kayıtlı portföydeki hisselerin ({portfolio_str}) kendi sektöründeki rakiplerine kıyasla İkili İşlem (Pair Trading) Z-Score'larını kontrol et. Limon gibi sıkılmış ama sektörü uçan veya tam tersi aşırı şişmiş bir hisse var mı raporla.",
        expected_output="Portföy içi Korelasyon ve Spread Analiz Özeti.",
        agent=correlation_agent
    )
    
    insider_task = Task(
        description=f"Kayıtlı portföydeki hisselere ({portfolio_str}) ait çok yeni bir KAP duyurusu (Geri alım, rekor kâr, temettü vs) var mı? Varsa portföy dengelemesini etkiler mi özetle.",
        expected_output="Portföydeki hisselerin Güncel Şirket Özel Haber (KAP) Durumu.",
        agent=insider_analyst
    )
    
    sector_task = Task(
        description=f"Kayıtlı portföydeki hisseler ({portfolio_str}) için, ait oldukları sektöre dair genel bir kriz veya büyüme potansiyeli haberleri (Örn: Çimento ihracatı, bankacılık kredi kısıtlamaları) var mı araştır.",
        expected_output="Portföyün maruz kaldığı Sektörel Rüzgarlar (Tailwinds/Headwinds) özeti.",
        agent=sector_analyst
    )
    
    rebalance_task = Task(
        description="Önceki kantitatif, duyarlılık, temel, momentum, makro, korelasyon, KAP ve Sektörel Haber raporlarını sentezle. Portföydeki her bir hisse için (Kâr/Zarar durumlarını göz önüne alarak) YENİDEN DENGELEME (Rebalance) tavsiyesi ver. Örn: 'Kâr Realize Et', 'Zarar Kes (Stop-Loss)', 'Tut', 'Maliyet Düşür'. UYARI: METİN ÜRETMEYİN. SADECE GEÇERLİ JSON DÖNDÜRÜN. Format: {\"rebalance_actions\": [{\"ticker\": \"THYAO\", \"action\": \"TUT/SAT/EKLE\", \"reason\": \"neden...\"}], \"overall_rationale\": \"genel yorum\"}",
        expected_output="SADECE GEÇERLİ JSON. BAŞKA HİÇBİR KELİME YOK.",
        agent=master_agent
    )

    crew = Crew(
        agents=[quant_analyst, sentiment_analyst, fundamental_analyst, momentum_analyst, macro_analyst, correlation_agent, insider_analyst, sector_analyst, master_agent],
        tasks=[quant_task, sentiment_task, fundamental_task, momentum_task, macro_task, correlation_task, insider_task, sector_task, rebalance_task],
        process=Process.sequential,
        verbose=True
    )
    
    result = crew.kickoff()
    return result

if __name__ == "__main__":
    # Test Run
    print("Test run of CrewAI framework...")
    res = run_analysis_crew(100000, "dengeli")
    print("\n--- FINAL OUTPUT ---")
    print(res)
