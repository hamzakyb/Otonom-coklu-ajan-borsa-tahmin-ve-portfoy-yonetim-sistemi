# Use official Python runtime as a parent image
FROM --platform=linux/arm64 python:3.9-slim

# Set working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Global pip settings for resilience
ENV PIP_DEFAULT_TIMEOUT=100
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Layer 1: Core ML (Already fast)
COPY requirements-core.txt .
RUN pip install --prefer-binary --no-cache-dir -r requirements-core.txt

# Layer 2: Data Stack (Fast)
COPY requirements-data.txt .
RUN pip install --prefer-binary --no-cache-dir -r requirements-data.txt

# Layer 3: AI Stack (Heavy - will be cached once done)
COPY requirements-ai.txt .
RUN pip install --prefer-binary --no-cache-dir -r requirements-ai.txt

# Layer 4: Infrastructure & Backtest
COPY requirements-extra.txt .
RUN pip install --prefer-binary --no-cache-dir -r requirements-extra.txt

# 3. Copy the rest of the application code
COPY . .

# Expose port (default FastAPI)
EXPOSE 8000

# Run uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
