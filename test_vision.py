import requests
import os
import json

URL = "http://localhost:8000/analyze"

relevante = [f for f in os.listdir("test_images/relevante") if f.lower().endswith((".jpg", ".jpeg", ".png"))]
spam      = [f for f in os.listdir("test_images/spam")      if f.lower().endswith((".jpg", ".jpeg", ".png"))]

TP = FN = TN = FP = 0
greseli = []

for img_name in relevante:
    path = f"test_images/relevante/{img_name}"
    with open(path, "rb") as f:
        r = requests.post(URL, files={"file": (img_name, f, "image/jpeg")})
        result = r.json()
        if result["valid"]:
            TP += 1
        else:
            FN += 1
            greseli.append({
                "imagine": img_name,
                "categorie_reala": "relevanta",
                "decizie_model": "respinsa",
                "top_label": result["top_label"],
                "confidence": round(result["confidence"], 4)
            })

for img_name in spam:
    path = f"test_images/spam/{img_name}"
    with open(path, "rb") as f:
        r = requests.post(URL, files={"file": (img_name, f, "image/jpeg")})
        result = r.json()
        if not result["valid"]:
            TN += 1
        else:
            FP += 1
            greseli.append({
                "imagine": img_name,
                "categorie_reala": "spam",
                "decizie_model": "acceptata",
                "top_label": result["top_label"],
                "confidence": round(result["confidence"], 4)
            })

total = TP + TN + FP + FN
accuracy  = (TP + TN) / total * 100
precision = TP / (TP + FP) * 100 if (TP + FP) > 0 else 0
recall    = TP / (TP + FN) * 100 if (TP + FN) > 0 else 0
f1        = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

print(f"\n=== REZULTATE ===")
print(f"Total imagini testate: {total}")
print(f"TP={TP}  FN={FN}  TN={TN}  FP={FP}")
print(f"Accuracy:  {accuracy:.1f}%")
print(f"Precision: {precision:.1f}%")
print(f"Recall:    {recall:.1f}%")
print(f"F1 Score:  {f1:.1f}%")

if greseli:
    print(f"\n=== CLASIFICARI GRESITE ({len(greseli)}) ===")
    for g in greseli:
        print(f"  {g['imagine']} -> {g['decizie_model']} | top_label: {g['top_label']} | confidence: {g['confidence']}")

with open("rezultate_test.json", "w", encoding="utf-8") as f:
    json.dump({
        "TP": TP, "TN": TN, "FP": FP, "FN": FN,
        "accuracy": round(accuracy, 1),
        "precision": round(precision, 1),
        "recall": round(recall, 1),
        "f1": round(f1, 1),
        "greseli": greseli
    }, f, ensure_ascii=False, indent=2)

print("\nRezultatele complete salvate in rezultate_test.json")
