import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
import numpy as np
import sys
import os
from torch.utils.data import DataLoader, Dataset

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import market_data
from models.time_series import StockPredictorLSTM, device

class StockDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)
    def __len__(self):
        return len(self.X)
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

def train_lstm_for_ticker(ticker, epochs=50, sequence_length=30):
    print(f"\n--- {ticker} için LSTM eğitimi başlıyor ---")
    
    # 1. Veriyi çek
    cursor = market_data.find({"ticker": ticker}).sort("date", 1)
    df = pd.DataFrame(list(cursor))
    
    if len(df) < sequence_length + 20:
        print(f"Yetersiz veri: {ticker}")
        return

    prices = df['close'].values.astype(float)
    
    # 2. Ölçeklendirme
    min_val, max_val = np.min(prices), np.max(prices)
    scaled_prices = (prices - min_val) / (max_val - min_val)
    
    # 3. Sequence oluşturma
    X, y = [], []
    for i in range(len(scaled_prices) - sequence_length):
        X.append(scaled_prices[i:i+sequence_length])
        y.append(scaled_prices[i+sequence_length])
    
    X = np.array(X).reshape(-1, sequence_length, 1)
    y = np.array(y).reshape(-1, 1)
    
    dataset = StockDataset(X, y)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    # 4. Model, Loss, Optimizer
    model = StockPredictorLSTM().to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # 5. Eğitim Döngüsü (M1 GPU/MPS Kullanır)
    model.train()
    for epoch in range(epochs):
        epoch_loss = 0
        for batch_X, batch_y in dataloader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
            
        if (epoch+1) % 10 == 0:
            print(f"Epoch [{epoch+1}/{epochs}], Loss: {epoch_loss/len(dataloader):.6f}")
            
    # 6. Kaydet
    save_path = f"models/weights_{ticker.replace('.IS', '')}.pth"
    torch.save(model.state_dict(), save_path)
    print(f"Model kaydedildi: {save_path}")

def train_all_available_stocks():
    # Fetch all unique tickers from the database to train
    tickers = market_data.distinct("ticker")
    print(f"Found {len(tickers)} tickers in database. Starting batch training...")
    for t in tickers:
        train_lstm_for_ticker(t)

if __name__ == "__main__":
    train_all_available_stocks()
