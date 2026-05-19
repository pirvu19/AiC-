import urllib.request
import json
import os
import sys

def fetch_meteo_ro():
    url = "https://www.meteoromania.ro/wp-json/meteoapi/v2/starea-vremii"
    target_stations = ["BALEA LAC", "PARANG", "RANCA", "VLADEASA 1800", "BAISOARA"]
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
        filtered_data = []
        for feature in data.get("features", []):
            props = feature.get("properties", {})
            if props.get("nume") in target_stations:
                if "actualizat" in props:
                    props["actualizat"] = props["actualizat"].replace("&nbsp;", " ")
                filtered_data.append(feature)
                
        
        output_file = "date_meteo_ro.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(filtered_data, f, indent=2, ensure_ascii=False)
            
        print(f"[{target_stations}] -> Salvare cu succes in {output_file}")
    except Exception as e:
        print(f"Eroare la extragerea datelor meteo RO: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_meteo_ro()
