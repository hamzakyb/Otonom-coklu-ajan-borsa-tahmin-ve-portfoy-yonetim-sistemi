import numpy as np

def calculate_kelly_fraction(confidence_score: float, target_profit_pct: float, stop_loss_pct: float, kelly_multiplier: float = 0.5):
    """
    Calculates the Kelly Criterion fraction for position sizing.
    Formula: f = (p * (b + 1) - 1) / b
    where:
    p = probability of winning (confidence_score / 100)
    b = odds (target_profit / stop_loss)
    
    kelly_multiplier (Fractional Kelly): Usually 0.5 (Half-Kelly) is safer for trading.
    """
    if stop_loss_pct <= 0:
        return 0.0
        
    p = confidence_score / 100.0
    b = abs(target_profit_pct / stop_loss_pct)
    
    if b == 0:
        return 0.0
        
    kelly_f = (p * (b + 1) - 1) / b
    
    # Apply fractional kelly and clip between 0 and 1
    safe_fraction = max(0, min(1.0, kelly_f * kelly_multiplier))
    
    return round(safe_fraction * 100, 2) # Return as percentage

def suggest_trade_params(current_price: float, volatility: float, trend_strength: float):
    """
    Suggests SL and TP based on volatility (ATR-like) and trend.
    """
    # Use 2x Volatility for Stop Loss as a baseline
    sl_distance = current_price * (volatility * 2)
    tp_distance = sl_distance * 2.5 # 1:2.5 Risk/Reward ratio
    
    # Adjust based on trend strength
    if trend_strength > 0.7:
        tp_distance *= 1.2 # Let winners run
        
    stop_loss = current_price - sl_distance
    take_profit = current_price + tp_distance
    
    return {
        "stop_loss": round(stop_loss, 2),
        "take_profit": round(take_profit, 2),
        "sl_pct": round((sl_distance / current_price) * 100, 2),
        "tp_pct": round((tp_distance / current_price) * 100, 2),
        "risk_reward": round(tp_distance / sl_distance, 2)
    }
