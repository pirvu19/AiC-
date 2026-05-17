import os
import re
import json
from bs4 import BeautifulSoup
from normalize_istoric import normalize_mountain_names

def parse_html_report(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'html.parser')

    # 1. Extrage Perioada
    perioada = ""
    header_p = soup.find('div', class_='header').find('p')
    if header_p:
        perioada = header_p.find('strong').get_text(strip=True)

    # 2. Extrage Temperaturi
    temperaturi = {
        "peste_1800m": {"min": "N/A", "max": "N/A"},
        "sub_1800m": {"min": "N/A", "max": "N/A"}
    }
    temp_card = soup.find('h3', string=re.compile(r'Temperaturi')).parent
    if temp_card:
        p_tags = temp_card.find_all('p')
        for p in p_tags:
            text = p.get_text()
            if "Peste 1800m" in text:
                parts = text.split(":")[1].split("/")
                temperaturi["peste_1800m"]["min"] = parts[0].strip()
                if len(parts) > 1: temperaturi["peste_1800m"]["max"] = parts[1].strip()
            elif "Sub 1800m" in text:
                parts = text.split(":")[1].split("/")
                temperaturi["sub_1800m"]["min"] = parts[0].strip()
                if len(parts) > 1: temperaturi["sub_1800m"]["max"] = parts[1].strip()

    # 3. Extrage Statistici Zapada
    statistici_zapada = {}
    zapada_card = soup.find('h3', string=re.compile(r'Strat de zăpadă')).parent
    if zapada_card:
        p_tags = zapada_card.find_all('p')
        for p in p_tags:
            text = p.get_text()
            if ":" in text:
                key, val = text.split(":", 1)
                statistici_zapada[key.replace("❄️", "").strip()] = val.strip()

    # 4. Extrage Grupe Montane
    grupe_montane = []
    containers = soup.find_all('div', class_='grupa-container')
    for container in containers:
        nume_grupa = container.find('div', class_='grupa-titlu').get_text(strip=True)
        masive = []
        cards = container.find_all('div', class_='card')
        for card in cards:
            nume_masiv = card.find('div', style=re.compile(r'font-weight:bold')).get_text(strip=True)
            risc_divs = card.find_all('div')
            risc_peste = 1
            risc_sub = 1
            for div in risc_divs:
                if "Altitudine > 1800m" in div.get_text():
                    match = re.search(r'Grad (\d)', div.get_text())
                    if match: risc_peste = int(match.group(1))
                elif "Altitudine < 1800m" in div.get_text():
                    match = re.search(r'Grad (\d)', div.get_text())
                    if match: risc_sub = int(match.group(1))
            
            masive.append({
                "nume_complet": nume_masiv,
                "risc_peste_1800": risc_peste,
                "risc_sub_1800": risc_sub
            })
        
        grupe_montane.append({
            "nume_grupa": nume_grupa,
            "masive": masive
        })

    return {
        "perioada": perioada,
        "temperaturi": temperaturi,
        "statistici_zapada": statistici_zapada,
        "grupe_montane": grupe_montane
    }

def main():
    directory = "."
    istoric_file = "istoric_avalanse.json"
    
    istoric = []
    if os.path.exists(istoric_file):
        with open(istoric_file, 'r', encoding='utf-8') as f:
            istoric = json.load(f)

    perioade_existente = {entry.get('perioada') for entry in istoric}
    
    pentru_adaugat = []
    for filename in os.listdir(directory):
        if filename.startswith("raport_") and filename.endswith(".html") and "final" not in filename:
            try:
                data = parse_html_report(filename)
                if data['perioada'] not in perioade_existente:
                    print(f"📥 Importat: {filename} ({data['perioada']})")
                    normalized_data = normalize_mountain_names(data)
                    pentru_adaugat.append(normalized_data)
                    perioade_existente.add(data['perioada'])
                else:
                    # Chiar dacă perioada există, poate vrem să-i aplicăm normalizarea nouă
                    for i, entry in enumerate(istoric):
                        if entry.get('perioada') == data['perioada']:
                            istoric[i] = normalize_mountain_names(entry)
            except Exception as e:
                print(f"❌ Eroare la {filename}: {e}")

    istoric.extend(pentru_adaugat)
    
    # Sortare după dată (aproximativă, bazată pe perioada)
    # Formate: "16.03.2026 ora 20 - 18.03.2026 ora 20"
    def get_date_key(entry):
        try:
            match = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', entry.get('perioada', ''))
            if match:
                day, month, year = match.groups()
                return f"{year}-{month}-{day}"
        except:
            pass
        return "0000-00-00"

    istoric.sort(key=get_date_key, reverse=True)

    with open(istoric_file, 'w', encoding='utf-8') as f:
        json.dump(istoric, f, indent=4, ensure_ascii=False)
    
    print(f"✅ Finalizat! Total înregistrări în istoric: {len(istoric)}")

if __name__ == "__main__":
    main()
