1. Serve the files locally: `python3 -m http.server 8000`
2. Open the original demo: http://localhost:8000/avalanse_mapbox_demo.html
3. Open the second avalanche demo: http://localhost:8000/avalanse_mapbox_demo_rodnei.html
4. Open the dropdown demo (all avalanches): http://localhost:8000/avalanse_mapbox_demo_dropdown.html
5. Project structure:
   - `geojson/`: per-avalanche GeoJSON files + combined file
   - `data/avalanche_incidents_2025.json`: incident metadata/camera/measurements used by the dropdown demo
   - `avalanse_mapbox_demo_dropdown.html`: visualization logic (no inline avalanche incident hardcoding)
