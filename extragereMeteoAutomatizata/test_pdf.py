import requests
import io
import pdfplumber

url = "https://www.meteoromania.ro/Upload-Produse/nivologie/nivologie.pdf"
headers = {'User-Agent': 'Mozilla/5.0'}
print(f"Downloading from {url}...")
try:
    response = requests.get(url, headers=headers, timeout=15)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        with pdfplumber.open(io.BytesIO(response.content)) as pdf:
            text = "\n".join([p.extract_text() or "" for p in pdf.pages])
            print(f"Text length: {len(text)}")
            print(text[:100])
except Exception as e:
    print(f"Error: {e}")
