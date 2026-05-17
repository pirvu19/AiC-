import requests
import argparse
import os
import json
from datetime import datetime

def fetch_weather_data(lat, lng):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,snow_depth,precipitation&hourly=temperature_2m,freezing_level_height,snow_depth,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,snowfall_sum&timezone=auto"
    
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Eroare la extragerea datelor Open-Meteo: {e}")
        return None

def genereaza_html(data, lat, lng):
    if not data:
        return

    current = data.get('current', {})
    daily = data.get('daily', {})
    
    temp_curenta = current.get('temperature_2m', 'N/A')
    vant_curent = current.get('wind_speed_10m', 'N/A')
    zapada_curenta = current.get('snow_depth', 'N/A')
    
    # Preia date pe zile pentru rezumat
    zile = daily.get('time', [])
    temp_min = daily.get('temperature_2m_min', [])
    temp_max = daily.get('temperature_2m_max', [])
    ninsoare = daily.get('snowfall_sum', [])

    html = f"""
    <style>
        #meteo-report-container {{ font-family: 'Segoe UI', sans-serif; background: #eef2f7; padding: 20px; color: #333; border-radius: 12px; }}
        #meteo-report-container .m-header {{ background: #1a252f; color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 25px; }}
        #meteo-report-container .info-container {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        #meteo-report-container .card-info {{ background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 5px solid #3498db; text-align: center; }}
        #meteo-report-container .forecast-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }}
        #meteo-report-container .day-card {{ background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center; border-left: 5px solid #2ecc71; }}
        #meteo-report-container .val {{ font-size: 1.5em; font-weight: bold; color: #2c3e50; margin-top: 10px; }}
        #meteo-report-container .label {{ font-size: 0.9em; color: #7f8c8d; text-transform: uppercase; }}
        #meteo-report-container h2 {{ margin-top: 0; color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }}
    </style>
    <div id="meteo-report-container">
        <div class="m-header">
            <h2 style="color: white; border-bottom: none; padding-bottom: 0;">🌍 Raport Meteo Montan</h2>
            <p style="margin: 5px 0 0 0; font-size: 0.9em;">Coordonate: {lat} N, {lng} E | Data: {datetime.now().strftime('%d.%m.%Y %H:%M')}</p>
        </div>
        
        <div class="info-container">
            <div class="card-info" style="border-top-color: #e74c3c">
                <div class="label">Temperatura Curentă</div>
                <div class="val">{temp_curenta} °C</div>
            </div>
            <div class="card-info" style="border-top-color: #3498db">
                <div class="label">Strat Zăpadă Curent</div>
                <div class="val">{zapada_curenta} m</div>
            </div>
            <div class="card-info" style="border-top-color: #9b59b6">
                <div class="label">Viteză Vânt</div>
                <div class="val">{vant_curent} km/h</div>
            </div>
        </div>

        <h2>Prognoză următoarele zile</h2>
        <div class="forecast-grid">
    """

    # Afiseaza max primele 5 zile
    nr_zile = min(5, len(zile))
    for i in range(nr_zile):
        data_formatata = datetime.strptime(zile[i], "%Y-%m-%d").strftime("%d %b")
        html += f"""
            <div class="day-card">
                <div style="font-weight: bold; margin-bottom: 10px; color: #34495e;">{data_formatata}</div>
                <div style="margin-bottom: 5px;">🌡️ {temp_min[i]}°C / {temp_max[i]}°C</div>
                <div>❄️ Ninsoare: {ninsoare[i]} cm</div>
            </div>
        """

    html += """
        </div>
    </div>
    """

    nume_fisier = f"raport_meteo_{str(lat).replace('.','_')}_{str(lng).replace('.','_')}.html"
    path = os.path.abspath(nume_fisier)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
        
    print(f"path_complet: {path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extrage date meteo de la Open-Meteo")
    parser.add_argument("--lat", type=float, required=True, help="Latitudine")
    parser.add_argument("--lng", type=float, required=True, help="Longitudine")
    args = parser.parse_args()

    # Extragem și generăm raportul
    weather_data = fetch_weather_data(args.lat, args.lng)
    genereaza_html(weather_data, args.lat, args.lng)
