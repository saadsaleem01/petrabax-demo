"""Create the Petrabax Marketing Airtable schema.

Usage: AIRTABLE_PAT=... python3 scripts/setup-airtable.py <baseId>
Idempotent-ish: skips tables/fields that already exist.
"""
import json, os, sys, urllib.request

PAT = os.environ["AIRTABLE_PAT"]
BASE = sys.argv[1]
API = "https://api.airtable.com/v0/meta/bases/" + BASE


def call(method, url, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": "Bearer " + PAT, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {url} -> {e.code}: {e.read().decode()}")


def sel(*names):
    colors = ["greenLight2", "yellowLight2", "redLight2", "blueLight2", "purpleLight2", "grayLight2", "orangeLight2", "tealLight2", "pinkLight2", "cyanLight2"]
    return {"choices": [{"name": n, "color": colors[i % len(colors)]} for i, n in enumerate(names)]}


TEXT = {"type": "singleLineText"}
LONG = {"type": "multilineText"}
USD = {"type": "currency", "options": {"precision": 0, "symbol": "$"}}
DATE = {"type": "date", "options": {"dateFormat": {"name": "iso"}}}
DT = {"type": "dateTime", "options": {"dateFormat": {"name": "iso"}, "timeFormat": {"name": "24hour"}, "timeZone": "America/New_York"}}
NUM = {"type": "number", "options": {"precision": 0}}
FILES = {"type": "multipleAttachments"}
CHECK = {"type": "checkbox", "options": {"icon": "check", "color": "greenBright"}}
URL = {"type": "url"}


def f(name, spec, **extra):
    d = {"name": name, **spec}
    d.update(extra)
    return d


SCHEMA = {
    "Promotions": [
        f("Promo", TEXT),
        f("Supplier", TEXT),
        f("Check result", {"type": "singleSelect", "options": sel("Verified", "Needs check", "Blocked")}),
        f("Workflow status", {"type": "singleSelect", "options": sel("Ready for review", "Needs check", "Approved", "Blocked", "Sent back", "Rejected", "Expired", "Superseded")}),
        f("Version", NUM),
        f("From price", USD),
        f("Currency", TEXT),
        f("Booking deadline", DATE),
        f("Travel start", DATE),
        f("Travel end", DATE),
        f("Departures", LONG),
        f("Issues", LONG),
        f("Supplier changes", LONG),
        f("Discounts", LONG),
        f("Restrictions", LONG),
        f("Inclusions", LONG),
        f("Commission (internal only)", TEXT),
        f("Source text", LONG),
        f("Source file", FILES),
        f("Promo key", TEXT),
        f("Offer JSON", LONG),
        f("Customer facts JSON", LONG),
        f("Updated", DT),
    ],
    "Price Tiers": [
        f("Tier", TEXT),
        f("Room type", TEXT),
        f("Applies to", TEXT),
        f("Price", USD),
        f("Type", {"type": "singleSelect", "options": sel("promo", "brochure", "supplement")}),
        f("Source quote", LONG),
        f("Verified in source", CHECK),
    ],
    "Content": [
        f("Item", TEXT),
        f("Channel", {"type": "singleSelect", "options": sel("Facebook", "Instagram", "LinkedIn", "Instagram carousel", "Email")}),
        f("Language", {"type": "singleSelect", "options": sel("EN", "ES")}),
        f("Status", {"type": "singleSelect", "options": sel("Ready for review", "Needs changes", "Approved", "Scheduled", "Published", "Pulled back", "Rejected")}),
        f("Headline", TEXT),
        f("Subline", TEXT),
        f("Body", LONG),
        f("Email subject", TEXT),
        f("Email preview text", TEXT),
        f("Photo URL", URL),
        f("Graphic", FILES),
        f("Fact-check warnings", LONG),
        f("Reviewer notes", LONG),
        f("Scheduled for", DT),
        f("Published link", URL),
        f("Mailchimp campaign ID", TEXT),
    ],
    "Change Log": [
        f("Event", TEXT),
        f("Type", {"type": "singleSelect", "options": sel("Created", "Supplier correction", "Edited", "Approved", "Sent back", "Rejected", "Pulled back", "Expired", "Published")}),
        f("Details", LONG),
        f("At", DT),
    ],
}

tables = {t["name"]: t for t in call("GET", API + "/tables")["tables"]}

# Reuse the default "Table 1" as Promotions
if "Promotions" not in tables and "Table 1" in tables:
    t1 = tables.pop("Table 1")
    call("PATCH", f"{API}/tables/{t1['id']}", {"name": "Promotions"})
    prim = t1["fields"][0]
    call("PATCH", f"{API}/tables/{t1['id']}/fields/{prim['id']}", {"name": "Promo"})
    t1 = {**t1, "name": "Promotions"}
    t1["fields"][0]["name"] = "Promo"
    tables["Promotions"] = t1

for name, fields in SCHEMA.items():
    if name not in tables:
        tables[name] = call("POST", API + "/tables", {"name": name, "fields": fields})
        print("created table", name)
    else:
        have = {x["name"] for x in tables[name]["fields"]}
        for fd in fields:
            if fd["name"] not in have:
                call("POST", f"{API}/tables/{tables[name]['id']}/fields", fd)
                print("  added field", name, "/", fd["name"])

# Links: child tables -> Promotions (Airtable creates the reverse field automatically)
tables = {t["name"]: t for t in call("GET", API + "/tables")["tables"]}
promo_id = tables["Promotions"]["id"]
for child in ["Price Tiers", "Content", "Change Log"]:
    have = {x["name"] for x in tables[child]["fields"]}
    if "Promotion" not in have:
        call("POST", f"{API}/tables/{tables[child]['id']}/fields",
             {"name": "Promotion", "type": "multipleRecordLinks", "options": {"linkedTableId": promo_id}})
        print("  linked", child, "-> Promotions")

tables = {t["name"]: t for t in call("GET", API + "/tables")["tables"]}
out = {n: {"id": t["id"], "fields": {x["name"]: x["id"] for x in t["fields"]}} for n, t in tables.items()}
print(json.dumps({n: {"id": v["id"], "fields": list(v["fields"])} for n, v in out.items()}, indent=1))
