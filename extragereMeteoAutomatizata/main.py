import pdfplumber
import requests
import io
import json
import webbrowser
import os
import re
import sys
## 
# 1. Configurare
#API_KEY = "AIzaSyD-8d-fMW2A2GMuF6-TucOn_FqeKZ0dWJE"
API_KEY = "AIzaSyD7iw-RVlObcqUW3_SRuNOvb4vEzmzWvHI"
MODEL_NAME = "gemini-3-flash-preview"
#MODEL_NAME = "gemini-1.5-flash"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"


def curata_nume_fisier(perioada):
    """
    Transformă perioada în structura: raport_DD.MM.YYYY-DD.MM.YYYY.html
    """
    date_gasite = re.findall(r'(\d{2}\.\d{2}\.\d{4})', perioada)

    if len(date_gasite) >= 2:
        nume_curat = f"{date_gasite[0]}-{date_gasite[1]}"
    else:
        nume_curat = perioada.replace(" ", "_").replace(":", "")

    return f"raport_{nume_curat}.html"


def normalize_mountain_names(data):
    if not isinstance(data, dict): return data
    
    # 1. Normalizare Grupe Montane
    grupa_mapping = {
        "meridionali": "CARPAȚII MERIDIONALI",
        "orientali": "CARPAȚII ORIENTALI",
        "occidentali": "CARPAȚII OCCIDENTALI",
        "făgăraș": "CARPAȚII MERIDIONALI",
        "bucegi": "CARPAȚII MERIDIONALI",
        "parâng": "CARPAȚII MERIDIONALI",
        "țarcu": "CARPAȚII MERIDIONALI",
        "rodnei": "CARPAȚII ORIENTALI",
        "călimani": "CARPAȚII ORIENTALI",
        "ceahlău": "CARPAȚII ORIENTALI"
    }

    # 2. Normalizare Masive
    masiv_mapping = {
        "făgăraș": "Făgăraș",
        "fagaras": "Făgăraș",
        "bucegi": "Bucegi",
        "țarcu": "Țarcu-Godeanu",
        "tarcu": "Țarcu-Godeanu",
        "godeanu": "Țarcu-Godeanu",
        "parâng": "Parâng-Șureanu",
        "parang": "Parâng-Șureanu",
        "pârang": "Parâng-Șureanu",
        "șureanu": "Parâng-Șureanu",
        "sureanu": "Parâng-Șureanu",
        "rodne": "Rodnei",
        "călimani": "Călimani",
        "calimani": "Călimani",
        "ceahlău": "Ceahlău",
        "ceahlau": "Ceahlău",
        "occidentali": "Carpații Occidentali",
        "apuseni": "Carpații Occidentali",
        "banatu": "Carpații Occidentali",
        "vlad": "Carpații Occidentali", # Vlădeasa
        "semenic": "Carpații Occidentali",
        "băișoara": "Carpații Occidentali",
        "retezat": "Retezat",
        "piatra craiului": "Piatra Craiului",
        "postăvar": "Postăvarul",
        "postavar": "Postăvarul"
    }
    
    for grupa in data.get('grupe_montane', []):
        # Normalizăm numele grupei
        raw_grupa = grupa.get('nume_grupa', '').lower()
        for key, standard_name in grupa_mapping.items():
            if key in raw_grupa:
                grupa['nume_grupa'] = standard_name
                break
        
        # Normalizăm masivele
        for masiv in grupa.get('masive', []):
            raw_name = masiv.get('nume_complet', '').lower()
            for key, standard_name in masiv_mapping.items():
                if key in raw_name:
                    masiv['nume_complet'] = standard_name
                    break
    return data

def salveaza_in_istoric(date_noi):
    """
    Salvează datele extrase într-un fișier JSON centralizat pentru istoric și grafice, normalizând numele munților.
    """
    date_noi = normalize_mountain_names(date_noi)
    nume_fisier = "istoric_avalanse.json"

    # 1. Încercăm să citim istoricul existent
    istoric = []
    if os.path.exists(nume_fisier):
        try:
            with open(nume_fisier, "r", encoding="utf-8") as f:
                istoric = json.load(f)
        except Exception as e:
            print(f"Eroare la citirea istoricului: {e}")
            istoric = []

    # 2. Verificăm dacă perioada există deja (evităm duplicatele)
    perioada_actuala = date_noi.get('perioada')
    if any(entry.get('perioada') == perioada_actuala for entry in istoric):
        print(f"Datele pentru perioada '{perioada_actuala}' sunt deja in istoricul JSON.")
        return

    # 3. Adăugăm intrarea nouă
    istoric.append(date_noi)

    # 4. Salvăm fișierul actualizat
    try:
        with open(nume_fisier, "w", encoding="utf-8") as f:
            json.dump(istoric, f, indent=4, ensure_ascii=False)
        print(f"Datele au fost salvate cu succes in {nume_fisier}!")
    except Exception as e:
        print(f"Eroare la salvarea in JSON: {e}")


def extrage_date_cu_ai(text_pdf):
    print("2. Analiza AI (Grupare Statii Meteo pe Regiuni)...")
    prompt = f"""
    Analizează buletinul nivometeorologic și returnează un obiect JSON valid.
    IMPORTANT: 
    1. Denumirile de grupe mari se află pe BANDA NEAGRĂ.
    2. Extrage temperaturile prognozate (min/max) de la finalul PDF-ului.
    3. Extrage grosimea stratului de zăpadă din secțiunea "EVOLUŢIA VREMII", grupate pe cele 3 mari regiuni.
    Structura JSON obligatorie:
    {{
      "perioada": "text interval valabilitate",
      "temperaturi": {{
         "peste_1800m": {{ "min": "val", "max": "val" }},
         "sub_1800m": {{ "min": "val", "max": "val" }}
      }},
      "statistici_zapada": {{
         "Meridionali": "string", "Orientali": "string", "Occidentali": "string"
      }},
      "grupe_montane": [
        {{
          "nume_grupa": "Numele de pe banda neagră",
          "masive": [
            {{ "nume_complet": "string", "risc_peste_1800": "numeric", "risc_sub_1800": "numeric" }}
          ]
        }}
      ]
    }}
    TEXT PDF:
    {text_pdf}
    """
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }
    
    for incercare in range(3):
        try:
            response = requests.post(API_URL, json=payload, timeout=45)
            if response.status_code != 200:
                print(f"Error details: {response.text}")
            response.raise_for_status()
            res_json = response.json()
            raw_text = res_json['candidates'][0]['content']['parts'][0]['text']
            print(f"DEBUG: Raw AI text (first 100 chars): {raw_text[:100]}")
            return json.loads(raw_text)
        except requests.exceptions.Timeout:
            print(f"Eroare AI: Timeout la incercarea {incercare + 1}, se reincearca...")
            continue
        except Exception as e:
            print(f"Eroare AI: {e}")
            return None
            
    print("Eroare AI: S-au epuizat toate cele 3 incercari.")
    return None


def genereaza_html(date):
    if isinstance(date, list): date = date[0]
    if not date or not isinstance(date, dict): return

    culori = {"1": "#2ECC71", "2": "#F1C40F", "3": "#E67E22", "4": "#E74C3C", "5": "#000000", "N/A": "#95A5A6"}
    temp = date.get('temperaturi', {})
    zapada = date.get('statistici_zapada', {})
    perioada = date.get('perioada', 'Nespecificat')

    html = f"""
    <!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8">
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; background: #eef2f7; padding: 20px; color: #333; }}
        .header {{ background: #1a252f; color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 25px; }}
        .info-container {{ display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-bottom: 40px; }}
        .card-info {{ background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 5px solid #3498db; }}
        .grupa-titlu {{ background: #2c3e50; color: #ecf0f1; padding: 12px 25px; border-radius: 8px; font-size: 1.5em; margin-bottom: 20px; text-transform: uppercase; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }}
        .card {{ background: white; padding: 20px; border-radius: 15px; border-left: 12px solid; box-shadow: 0 5px 15px rgba(0,0,0,0.08); }}
        .grad-cifra {{ font-weight: bold; padding: 2px 8px; border-radius: 4px; color: white; }}
    </style></head><body>
        <div class="header">
            <h1>BULETIN NIVOMETEOROLOGIC - CARPAȚI</h1>
            <p>Interval valabilitate: <strong>{perioada}</strong></p>
        </div>
        <div class="info-container">
            <div class="card-info">
                <h3>🌡️ Temperaturi Prognozate</h3>
                <p><strong>🏔️ Peste 1800m:</strong> {temp.get('peste_1800m', {}).get('min')}°C / {temp.get('peste_1800m', {}).get('max')}°C</p>
                <p><strong>🌲 Sub 1800m:</strong> {temp.get('sub_1800m', {}).get('min')}°C / {temp.get('sub_1800m', {}).get('max')}°C</p>
            </div>
            <div class="card-info">
                <h3>❄️ Strat de zăpadă (ora 14)</h3>
                <p><strong>Meridionali:</strong> {zapada.get('Meridionali')}</p>
                <p><strong>Orientali:</strong> {zapada.get('Orientali')}</p>
                <p><strong>Occidentali:</strong> {zapada.get('Occidentali')}</p>
            </div>
        </div>
    """
    for grupa in date.get('grupe_montane', []):
        html += f'<div class="grupa-container"><div class="grupa-titlu">{grupa.get("nume_grupa")}</div><div class="grid">'
        for m in grupa.get('masive', []):
            rp = str(m.get('risc_peste_1800', '1'))[0]
            rs = str(m.get('risc_sub_1800', '1'))[0]
            html += f"""
            <div class="card" style="border-left-color: {culori.get(max(rp, rs))}">
                <div style="font-weight:bold; font-size:1.2em; margin-bottom:10px;">{m.get('nume_complet')}</div>
                <div>Altitudine > 1800m: <span class="grad-cifra" style="background:{culori.get(rp)}">Grad {rp}</span></div>
                <div style="margin-top:5px;">Altitudine < 1800m: <span class="grad-cifra" style="background:{culori.get(rs)}">Grad {rs}</span></div>
            </div>
            """
        html += "</div></div>"

    html += "</body></html>"
    nume_fisier = curata_nume_fisier(perioada)
    path = os.path.abspath(nume_fisier)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
        
    no_browser = "--no-browser" in sys.argv
    if not no_browser:
        webbrowser.open("file://" + path)
        print(f"Creat: {path}")
        
    print(f"path_complet: {path}")


def obtine_text_brut_pdf(url):
    try:
        print("1. Descarcare si citire PDF...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=15)
        with pdfplumber.open(io.BytesIO(response.content)) as pdf:
            return "\n".join([p.extract_text() or "" for p in pdf.pages])
    except Exception as e:
        return None


if __name__ == "__main__":
    print("Script pornit...")
    URL_PDF = "https://www.meteoromania.ro/Upload-Produse/nivologie/nivologie.pdf"
    text_sursa = obtine_text_brut_pdf(URL_PDF)
    print(f"Text extras (lungime): {len(text_sursa) if text_sursa else 'None'}")

    if text_sursa:
        # 1. Extragem datele calendaristice din text folosind Regex (fără AI)
        date_gasite = re.findall(r'(\d{2}\.\d{2}\.\d{4})', text_sursa)

        if len(date_gasite) >= 2:
            # 2. Construim numele fișierului exact după formatul tău
            perioada_fisier = f"{date_gasite[0]}-{date_gasite[1]}"
            nume_raport = f"raport_{perioada_fisier}.html"
            path_complet = os.path.abspath(nume_raport)

            # 3. VERIFICAREA: Există deja acest fișier?
            if os.path.exists(nume_raport):
                print(f"OK: Raportul pentru perioada {perioada_fisier} exista deja local.")
                
                no_browser = "--no-browser" in sys.argv
                if not no_browser:
                    print(f"Deschidem direct fisierul: {nume_raport}")
                    webbrowser.open("file://" + path_complet)
                
                print(f"path_complet: {path_complet}")
                os._exit(0)

        print("Raport nou detectat. Se porneste analiza cu Gemini...")
        date_finale = extrage_date_cu_ai(text_sursa)

        if date_finale:
            # Salvăm în istoric (doar dacă e raport nou)
            salveaza_in_istoric(date_finale)
            # Generăm HTML-ul
            genereaza_html(date_finale)