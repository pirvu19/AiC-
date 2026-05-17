import json
import matplotlib.pyplot as plt
import os
import io

# Use headless backend for Matplotlib
plt.switch_backend('Agg')

def genereaza_grafic_risc_bytes(nume_masiv):
    nume_fisier = "extragereMeteoAutomatizata/istoric_avalanse.json"
    if not os.path.exists(nume_fisier):
        # Fallback to local if running from within the folder
        nume_fisier = "istoric_avalanse.json"

    if not os.path.exists(nume_fisier):
        return None

    with open(nume_fisier, "r", encoding="utf-8") as f:
        date_istoric = json.load(f)

    axe_x_perioade = []
    axe_y_risc_peste = []
    axe_y_risc_sub = []

    # Process in reverse to get chronological order (oldest to newest)
    for intrare in reversed(date_istoric):
        perioada = intrare.get("perioada", "N/A")
        
        risc_peste = None
        risc_sub = None
        
        for grupa in intrare.get("grupe_montane", []):
            for m in grupa.get("masive", []):
                if nume_masiv.lower() == m.get("nume_complet", "").lower():
                    risc_peste = m.get("risc_peste_1800")
                    risc_sub = m.get("risc_sub_1800")
                    break
        
        if risc_peste is not None:
            # Format date for X axis (13.04.2026 ora 21 -> 13.04)
            date_part = perioada.split("-")[0].strip().split(" ")[0]
            # Remove year for brevity if needed
            short_date = ".".join(date_part.split(".")[:2])
            
            axe_x_perioade.append(short_date)
            axe_y_risc_peste.append(int(risc_peste))
            axe_y_risc_sub.append(int(risc_sub) if risc_sub is not None else 0)

    if not axe_y_risc_peste:
        return None

    # Desenarea graficului
    plt.figure(figsize=(10, 5), facecolor='#f8fafc')
    plt.plot(axe_x_perioade, axe_y_risc_peste, marker='o', markersize=8, linestyle='-', color='#3b82f6', linewidth=3, label='> 1800m')
    plt.plot(axe_x_perioade, axe_y_risc_sub, marker='s', markersize=8, linestyle='--', color='#60a5fa', linewidth=3, label='< 1800m')

    # Styling
    plt.title(f'Evoluția Riscului de Avalanșă - {nume_masiv}', fontsize=16, fontweight='bold', pad=20, color='#1e293b')
    plt.xlabel('Data Buletinului', fontsize=12, labelpad=10, color='#64748b')
    plt.ylabel('Grad Risc (1-5)', fontsize=12, labelpad=10, color='#64748b')
    plt.ylim(0.5, 5.5)
    plt.yticks([1, 2, 3, 4, 5])
    plt.grid(True, linestyle='--', alpha=0.3, axis='y')
    plt.legend(frameon=True, facecolor='white', framealpha=0.8)
    
    # Clean up layout
    plt.tight_layout()

    # Save to buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100)
    buf.seek(0)
    plt.close()
    return buf.read()

if __name__ == "__main__":
    # Test script
    import sys
    masiv = sys.argv[1] if len(sys.argv) > 1 else "Făgăraș"
    img_data = genereaza_grafic_risc_bytes(masiv)
    if img_data:
        with open(f"chart_{masiv.lower()}.png", "wb") as f:
            f.write(img_data)
        print(f"Chart generated for {masiv}")
    else:
        print(f"No data for {masiv}")