import requests
from datetime import datetime
import json

def fetch_macro_calendar() -> dict:
    """
    Fetches the current week's macroeconomic calendar from ForexFactory's public JSON API.
    Filters for High and Medium impact events (especially USD, EUR) to inform the AI about volatility.
    """
    url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return {"error": f"Failed to fetch. Status: {response.status_code}"}
            
        data = response.json()
        
        # We want to filter for today or the upcoming days in the week
        # And keep only High/Medium impact events
        important_events = []
        
        for event in data:
            impact = event.get('impact', '')
            country = event.get('country', '')
            
            if impact in ['High', 'Medium'] or country == 'TRY':
                # Simplify the event object
                clean_event = {
                    "title": event.get("title", ""),
                    "country": country,
                    "date": event.get("date", ""),
                    "impact": impact,
                    "forecast": event.get("forecast", ""),
                    "previous": event.get("previous", "")
                }
                important_events.append(clean_event)
                
        # Limit to the most recent/upcoming 10 crucial events to save LLM context
        events_to_store = important_events[:15]
        
        # Store to database
        from data_pipeline.store_util import store_macro_events
        store_macro_events(events_to_store)
        
        return {"events": events_to_store}
        
    except Exception as e:
        print(f"Error fetching macro calendar: {e}")
        return {}

if __name__ == "__main__":
    print("Testing macroeconomic calendar fetcher...")
    events = fetch_macro_calendar()
    print(json.dumps(events, indent=2, ensure_ascii=False))
