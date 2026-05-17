import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime
import vectorbt as vbt

# Ensure we can import database from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import market_data

# Force MPS (Apple Silicon) if available
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Time Series logic using device: {device}")

class StockPredictorLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=1):
        super(StockPredictorLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM Layer
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        # Fully connected layer
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(device)
        
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :]) # Use the last time step output
        return out

def prepare_data_for_ticker(ticker, sequence_length=30):
    """
    Fetches the historical 'close' prices for the ticker from MongoDB
    and prepares sliding window sequences for LSTM inference.
    """
    cursor = market_data.find({"ticker": ticker}).sort("date", 1)
    records = list(cursor)
    
    if len(records) < sequence_length + 1:
        print(f"Not enough data to form a sequence for {ticker}")
        return None, None
        
    df = pd.DataFrame(records)
    close_prices = df['close'].values.astype(float)
    
    # Scale data between 0 and 1 (min-max simple scaling for demonstration)
    min_val = np.min(close_prices)
    max_val = np.max(close_prices)
    if max_val - min_val == 0:
        return None, None
        
    scaled_prices = (close_prices - min_val) / (max_val - min_val)
    
    # We only care about predicting tomorrow, so we take the last sequence_length days
    last_sequence = scaled_prices[-sequence_length:]
    
    # Shape it for LSTM: (batch_size, sequence_length, input_size) == (1, seq_len, 1)
    tensor_data = torch.tensor(last_sequence, dtype=torch.float32).unsqueeze(0).unsqueeze(2).to(device)
    return tensor_data, (min_val, max_val)

def predict_next_day(ticker):
    """
    Loads latest data, runs a prediction using a trained LSTM model 
    if weights exist, otherwise falls back to random initialization.
    """
    tensor_data, scaler_params = prepare_data_for_ticker(ticker)
    if tensor_data is None:
        return None
        
    min_val, max_val = scaler_params
    
    model = StockPredictorLSTM().to(device)
    
    # Load pre-trained weights if they exist
    # Clean ticker name for file saving (e.g. THYAO.IS -> THYAO, XAUUSD=X -> XAUUSD_X)
    clean_ticker = ticker.replace('.IS', '').replace('=', '_')
    weight_path = f"models/weights_{clean_ticker}.pth"
    if os.path.exists(weight_path):
        print(f"Loading weights from {weight_path}")
        model.load_state_dict(torch.load(weight_path, map_location=device))
    else:
        print(f"No weights found at {weight_path}, using random init.")
    
    model.eval()
    with torch.no_grad():
        pred_scaled = model(tensor_data).item()
        
    # Inverse transform
    pred_price = pred_scaled * (max_val - min_val) + min_val
    return pred_price

def run_backtest(ticker, days=90, sequence_length=30):
    """
    Runs an advanced VectorBT backtest on the last `days` days of available data.
    """
    cursor = market_data.find({"ticker": ticker}).sort("date", 1)
    records = list(cursor)
    
    if len(records) < sequence_length + days:
        print(f"Not enough data for a {days} day backtest on {ticker}")
        return None
        
    df = pd.DataFrame(records)
    df['date'] = pd.to_datetime(df['date'])
    df.set_index('date', inplace=True)
    
    close_prices = df['close'].values.astype(float)
    dates = df.index
    
    min_val = np.min(close_prices)
    max_val = np.max(close_prices)
    if max_val - min_val == 0:
        return None
    scaled_prices = (close_prices - min_val) / (max_val - min_val)
    
    model = StockPredictorLSTM().to(device)
    weight_path = f"models/weights_{ticker.replace('.IS', '')}.pth"
    if os.path.exists(weight_path):
        model.load_state_dict(torch.load(weight_path, map_location=device))
    model.eval()
    
    start_idx = len(scaled_prices) - days
    entries = []
    exits = []
    history = []

    for i in range(start_idx, len(scaled_prices)):
        actual_price = close_prices[i]
        window = scaled_prices[i - sequence_length : i]
        tensor_data = torch.tensor(window, dtype=torch.float32).unsqueeze(0).unsqueeze(2).to(device)
        
        with torch.no_grad():
            pred_val = model(tensor_data).item()
            
        pred_price = pred_val * (max_val - min_val) + min_val
        pred_price = max(pred_price, 0)
        
        # Signal Generation Logic: >0.5% up predicts buy
        if pred_price > actual_price * 1.005:
            entries.append(True)
            exits.append(False)
        elif pred_price < actual_price * 0.995:
            entries.append(False)
            exits.append(True)
        else:
            entries.append(False)
            exits.append(False)
            
        history.append({
            "date": dates[i].strftime("%Y-%m-%d"),
            "actual": round(actual_price, 2),
            "predicted": round(pred_price, 2)
        })

    # VectorBT Execution (fees: 0.1%, starting capital: 10,000 TL)
    vbt_close = df['close'].iloc[-days:]
    vbt_entries = pd.Series(entries, index=vbt_close.index)
    vbt_exits = pd.Series(exits, index=vbt_close.index)
    
    pf = vbt.Portfolio.from_signals(
        vbt_close,
        vbt_entries,
        vbt_exits,
        init_cash=10000,
        fees=0.001,
        freq='1D'
    )
    
    total_return = pf.total_return() * 100
    max_drawdown = pf.max_drawdown() * 100
    try:
        win_rate = pf.trades.win_rate() * 100
    except Exception:
        win_rate = 0
        
    total_trades = pf.trades.count()
    fees_paid = pf.trades.records_readable['Fee'].sum() if total_trades > 0 else 0
    
    equity_data = []
    for date, val in pf.value().items():
        equity_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": round(val, 2)
        })
        
    return {
        "metrics": {
            "total_return_percent": round(total_return, 2),
            "max_drawdown": round(max_drawdown, 2),
            "win_rate": round(win_rate, 2) if not pd.isna(win_rate) else 0,
            "total_trades": int(total_trades),
            "fees_paid": round(fees_paid, 2)
        },
        "equity_curve": equity_data,
        "history": history
    }

def train_lstm_model(ticker, epochs=20, sequence_length=30):
    """
    Trains a new LSTM model for a specific ticker using the last 2 years of data.
    Saves the weights to models/weights_{ticker}.pth.
    """
    print(f"Training LSTM model for {ticker}...")
    
    # Fetch data (last 2 years approx 500 trading days)
    cursor = market_data.find({"ticker": ticker}).sort("date", 1)
    records = list(cursor)
    
    if len(records) < sequence_length + 20:
        print(f"Not enough data to train {ticker} (found {len(records)})")
        return False
        
    df = pd.DataFrame(records)
    close_prices = df['close'].values.astype(float)
    
    # Scaling
    min_val, max_val = np.min(close_prices), np.max(close_prices)
    if max_val - min_val == 0: return False
    scaled = (close_prices - min_val) / (max_val - min_val)
    
    # Prepare training sequences
    X, y = [], []
    for i in range(len(scaled) - sequence_length):
        X.append(scaled[i : i + sequence_length])
        y.append(scaled[i + sequence_length])
        
    X = torch.tensor(np.array(X), dtype=torch.float32).unsqueeze(2).to(device)
    y = torch.tensor(np.array(y), dtype=torch.float32).unsqueeze(1).to(device)
    
    model = StockPredictorLSTM().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.MSELoss()
    
    model.train()
    for epoch in range(epochs):
        optimizer.zero_grad()
        output = model(X)
        loss = criterion(output, y)
        loss.backward()
        optimizer.step()
        if (epoch + 1) % 10 == 0:
            print(f"Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.6f}")
            
    # Save weights
    if not os.path.exists("models"):
        os.makedirs("models")
        
    clean_ticker = ticker.replace('.IS', '').replace('=', '_')
    save_path = f"models/weights_{clean_ticker}.pth"
    torch.save(model.state_dict(), save_path)
    print(f"Model saved for {ticker} at {save_path}")
    return True

if __name__ == "__main__":
    t = "THYAO.IS"
    # train_lstm_model(t, epochs=5)
    print(f"Prediction for {t}: {predict_next_day(t)}")
