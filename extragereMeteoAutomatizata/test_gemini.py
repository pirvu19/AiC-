import requests
import json

API_KEY = "AIzaSyD-8d-fMW2A2GMuF6-TucOn_FqeKZ0dWJE"
MODEL_NAME = "gemini-1.5-flash"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"

payload = {
    "contents": [{"parts": [{"text": "Say hello"}]}]
}

print(f"Testing Gemini API with {MODEL_NAME}...")
try:
    response = requests.post(API_URL, json=payload, timeout=15)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
