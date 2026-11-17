"""Clear all demo data (Airtable tables + Petrabax Mailchimp drafts).
Usage: AIRTABLE_PAT=... MAILCHIMP_KEY=... python3 scripts/reset-demo.py"""
import json, os, urllib.request
BASE = "https://api.airtable.com/v0/appq1uORcGaTdhNiA/"
TABLES = {"Promotions": "tblto8v1qITtb9Bjw", "Price Tiers": "tbl6Kgg2f4rSvzsrV", "Content": "tblJ0nBAkpOAXkBkv", "Change Log": "tblTFaxIO2C8y6ePa", "Reports": "tblCeEpY4wKrbhbPW"}
tok = os.environ["AIRTABLE_PAT"]
def call(m, u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, method=m, headers={"Authorization": "Bearer " + tok})))
for name, t in TABLES.items():
    ids = [r["id"] for r in call("GET", BASE + t + "?pageSize=100")["records"]]
    for i in range(0, len(ids), 10):
        call("DELETE", BASE + t + "?" + "&".join("records[]=" + x for x in ids[i:i + 10]))
    print(f"{name}: cleared {len(ids)}")

# Mailchimp: delete unsent Petrabax drafts
import base64
mk = os.environ.get("MAILCHIMP_KEY")
if mk:
    dc = mk.split("-")[-1]
    auth = "Basic " + base64.b64encode(("x:" + mk).encode()).decode()
    def mc(m, u):
        r = urllib.request.urlopen(urllib.request.Request(u, method=m, headers={"Authorization": auth}))
        return json.load(r) if m == "GET" else None
    camps = mc("GET", f"https://{dc}.api.mailchimp.com/3.0/campaigns?status=save&count=100&fields=campaigns.id,campaigns.settings.title")["campaigns"]
    n = 0
    for c in camps:
        if c["settings"]["title"].startswith(("[Petrabax]", "[DEMO]")):
            mc("DELETE", f"https://{dc}.api.mailchimp.com/3.0/campaigns/{c['id']}"); n += 1
    print(f"Mailchimp: deleted {n} draft(s)")
