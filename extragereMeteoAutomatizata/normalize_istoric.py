import json
import os

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

filename = "istoric_avalanse.json"
if os.path.exists(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        history = json.load(f)
        
    for index, entry in enumerate(history):
        history[index] = normalize_mountain_names(entry)
        
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=4, ensure_ascii=False)
    print(f"✅ Fișierul {filename} a fost curățat și normalizat cu succes!")
else:
    print(f"❌ Fișierul {filename} nu există.")
