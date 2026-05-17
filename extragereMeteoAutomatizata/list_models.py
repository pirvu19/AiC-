import requests

API_KEY = "AIzaSyD-8d-fMW2A2GMuF6-TucOn_FqeKZ0dWJE"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    models = response.json()
    for m in models.get('models', []):
        print(f"Model: {m['name']}")
except Exception as e:
    print(f"Error: {e}")
