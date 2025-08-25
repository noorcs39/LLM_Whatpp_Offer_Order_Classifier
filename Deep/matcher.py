from pymongo import MongoClient
from sentence_transformers import SentenceTransformer, util
import pandas as pd
import json
import re
from dotenv import load_dotenv
import os

# ✅ Load environment variables from .env
load_dotenv()

# ✅ Get MongoDB URI from .env
MONGO_URI = os.getenv("MONGO_URI")

# ✅ Connect to MongoDB using .env URI
client = MongoClient(MONGO_URI)
db = client.whatsappdb

# Load structured map from categories.xlsx
df = pd.read_excel("/root/whatsapp-bot_v2/Deep/categories.xlsx")

# Build expanded match dictionary from Excel
abbreviation_map = {}
for _, row in df.iterrows():
    key = str(row.get("type", "")).strip().lower()
    val = str(row.get("example", "")).strip().lower()
    if key and val:
        abbreviation_map[key] = val

# Normalize text by replacing known brand/type variants using the map
def normalize(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)  # remove punctuation
    words = text.split()
    normalized = [abbreviation_map.get(word, word) for word in words]
    return " ".join(normalized)

# ✅ Fetch messages & numbers from DB
messages = list(db.messages.find({}))
number_entries = {entry['number']: entry.get('name', '') for entry in db.numberentries.find({})}

orders = [m for m in messages if m.get('category') == 'order']
offers = [m for m in messages if m.get('category') == 'offer']

model = SentenceTransformer("all-MiniLM-L6-v2")
results = []

for order in orders:
    order_text = order.get("translated") or order.get("message", "")
    if not order_text.strip():
        continue

    norm_order_text = normalize(order_text)
    order_vec = model.encode(norm_order_text, convert_to_tensor=True)
    matched_offers = []

    for offer in offers:
        offer_text = offer.get("translated") or offer.get("message", "")
        if not offer_text.strip():
            continue

        norm_offer_text = normalize(offer_text)
        offer_vec = model.encode(norm_offer_text, convert_to_tensor=True)
        score = float(util.cos_sim(order_vec, offer_vec))

        if score >= 0.60:  # Reasonable threshold for good matches
            offer_name = offer.get("name") or number_entries.get(offer["number"], "")
            offer_link = offer.get("link", "")
            matched_offers.append({
                "offer": {
                    "number": offer["number"],
                    "name": offer_name,
                    "message": offer["message"],
                    "translated": offer.get("translated", ""),
                    "language": offer.get("language", ""),
                    "price": offer.get("price", ""),
                    "timestamp": str(offer["timestamp"]),
                    "link": offer_link,
                    "button": f'<a href="{offer_link}" class="btn btn-success btn-sm" target="_blank">Go Offer</a>' if offer_link else ""
                },
                "score": round(score * 100, 2)
            })

    if matched_offers:
        order_name = order.get("name") or number_entries.get(order["number"], "")
        order_link = order.get("link", "")
        results.append({
            "order": {
                "number": order["number"],
                "name": order_name,
                "message": order["message"],
                "translated": order.get("translated", ""),
                "language": order.get("language", ""),
                "price": order.get("price", ""),
                "timestamp": str(order["timestamp"]),
                "link": order_link,
                "button": f'<a href="{order_link}" class="btn btn-primary btn-sm" target="_blank">Go Order</a>' if order_link else ""
            },
            "matches": matched_offers
        })

# ✅ Save results to JSON file
with open("/root/whatsapp-bot_v2/match_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

# ✅ Print JSON output for Node.js to capture
print(json.dumps(results))
