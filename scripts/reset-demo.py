"""Clear all Airtable demo data. Usage: AIRTABLE_PAT=... python3 scripts/reset-demo.py"""
import json, os, urllib.request
BASE = "https://api.airtable.com/v0/appq1uORcGaTdhNiA/"
TABLES = {"Promotions": "tblto8v1qITtb9Bjw", "Price Tiers": "tbl6Kgg2f4rSvzsrV", "Content": "tblJ0nBAkpOAXkBkv", "Change Log": "tblTFaxIO2C8y6ePa"}
tok = os.environ["AIRTABLE_PAT"]
def call(m, u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, method=m, headers={"Authorization": "Bearer " + tok})))
for name, t in TABLES.items():
    ids = [r["id"] for r in call("GET", BASE + t + "?pageSize=100")["records"]]
    for i in range(0, len(ids), 10):
        call("DELETE", BASE + t + "?" + "&".join("records[]=" + x for x in ids[i:i + 10]))
    print(f"{name}: cleared {len(ids)}")
