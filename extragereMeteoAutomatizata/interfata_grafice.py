import json
import os
import tkinter as tk
from tkinter import messagebox
import matplotlib.pyplot as plt


def obtine_lista_masive():
    """Extrage automat toate numele de masive unice din JSON."""
    if not os.path.exists("istoric_avalanse.json"):
        return []

    masive_unice = set()
    with open("istoric_avalanse.json", "r", encoding="utf-8") as f:
        date_istoric = json.load(f)
        for intrare in date_istoric:
            for grupa in intrare.get("grupe_montane", []):
                for m in grupa.get("masive", []):
                    masive_unice.add(m.get("nume_complet"))
    return sorted(list(masive_unice))


def afiseaza_grafic(nume_masiv):
    """Generază graficul Matplotlib pentru masivul selectat."""
    with open("istoric_avalanse.json", "r", encoding="utf-8") as f:
        date_istoric = json.load(f)

    axe_x = []
    axe_y = []

    for intrare in date_istoric:
        perioada = intrare.get("perioada", "N/A").split("-")[0].strip()
        for grupa in intrare.get("grupe_montane", []):
            for m in grupa.get("masive", []):
                if m.get("nume_complet") == nume_masiv:
                    axe_x.append(perioada)
                    axe_y.append(int(m.get("risc_peste_1800", 1)))

    if len(axe_y) < 1:
        messagebox.showwarning("Atenție", "Nu există suficiente date pentru acest masiv.")
        return


    plt.figure(figsize=(8, 5))
    plt.step(axe_x, axe_y, where='mid', marker='o', color='darkblue', linewidth=2)
    plt.title(f"Evoluție Risc Avalanșă: {nume_masiv}")
    plt.ylabel("Grad Risc (1-5)")
    plt.xlabel("Data Buletinului")
    plt.ylim(0.5, 5.5)
    plt.grid(True, alpha=0.3)
    plt.show()



root = tk.Tk()
root.title("Analiză Evoluție Munți - Licență")
root.geometry("400x500")
root.configure(bg="#f0f0f0")

label_titlu = tk.Label(root, text="Selectează Masivul pentru Grafic", font=("Arial", 12, "bold"), bg="#f0f0f0", pady=10)
label_titlu.pack()


frame_lista = tk.Frame(root)
frame_lista.pack(pady=10, padx=20, fill="both", expand=True)

scrollbar = tk.Scrollbar(frame_lista)
scrollbar.pack(side="right", fill="y")

lista_ui = tk.Listbox(frame_lista, yscrollcommand=scrollbar.set, font=("Arial", 11))
lista_ui.pack(side="left", fill="both", expand=True)
scrollbar.config(command=lista_ui.yview)


masive = obtine_lista_masive()
for m in masive:
    lista_ui.insert("end", m)


def on_click_buton():
    try:
        selectat = lista_ui.get(lista_ui.curselection())
        afiseaza_grafic(selectat)
    except:
        messagebox.showwarning("Eroare", "Te rog selectează un munte din listă!")


btn_vezi = tk.Button(root, text="Vezi Evoluție Risc", command=on_click_buton, bg="#3498db", fg="white",
                     font=("Arial", 10, "bold"), pady=10)
btn_vezi.pack(pady=20, fill="x", padx=40)

root.mainloop()