from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

print("DEBUG - Loaded key:", os.getenv('GROQ_API_KEY'))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("reports", exist_ok=True)
os.makedirs("logs", exist_ok=True)

def write_log(message: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] {message}\n"
    with open("logs/activity.log", "a", encoding="utf-8") as f:
        f.write(log_line)
    print(log_line.strip())

def fetch_stock_data(symbol: str):
    write_log(f"Fetching stock data for {symbol}...")
    ticker = yf.Ticker(symbol)
    info = ticker.info
    data = {
        "name": info.get("longName", symbol),
        "price": info.get("currentPrice", "N/A"),
        "52w_high": info.get("fiftyTwoWeekHigh", "N/A"),
        "52w_low": info.get("fiftyTwoWeekLow", "N/A"),
        "pe_ratio": info.get("trailingPE", "N/A"),
        "market_cap": info.get("marketCap", "N/A"),
        "sector": info.get("sector", "N/A"),
        "summary": info.get("longBusinessSummary", "N/A")[:300],
    }
    write_log(f"Stock data fetched successfully for {data['name']}")
    return data

def generate_report(stock_data: dict):
    write_log(f"Sending data to LLM for analysis...")
    prompt = f"""You are a professional financial research analyst for Indian markets.

Based on this data for {stock_data['name']}:
- Current Price: {stock_data['price']}
- 52 Week High: {stock_data['52w_high']}
- 52 Week Low: {stock_data['52w_low']}
- P/E Ratio: {stock_data['pe_ratio']}
- Market Cap: {stock_data['market_cap']}
- Sector: {stock_data['sector']}
- About: {stock_data['summary']}

Write a structured investment research report with exactly these 4 sections:
1. Executive Summary (2-3 sentences)
2. Key Metrics Analysis (3 bullet points)
3. Risk Factors (2 bullet points)
4. Analyst Verdict (Buy / Hold / Sell with one line reason)

Be concise and professional."""

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
            "Content-Type": "application/json"
        },
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
        },
        timeout=30
    )
    result = response.json()
    write_log(f"GROQ RAW RESPONSE: {result}")
    report = result["choices"][0]["message"]["content"]
    write_log(f"LLM report generated successfully")
    return report

def save_report(stock: str, stock_data: dict, report: str):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"reports/{stock}_{timestamp}.json"
    data = {
        "generated_at": timestamp,
        "stock_symbol": stock,
        "stock_data": stock_data,
        "report": report
    }
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    write_log(f"Report saved to {filename}")
    return filename

@app.get("/analyze")
def analyze(stock: str):
    write_log(f"--- New request received for {stock} ---")
    try:
        stock_data = fetch_stock_data(stock)
        report = generate_report(stock_data)
        filename = save_report(stock, stock_data, report)
        return {
            "status": "success",
            "stock": stock_data,
            "report": report,
            "saved_to": filename
        }
    except Exception as e:
        write_log(f"ERROR: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/reports")
def list_reports():
    files = os.listdir("reports")
    return {"reports": sorted(files, reverse=True)}




