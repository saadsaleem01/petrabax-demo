"""Inline code/prompt files into an n8n SDK template -> .sdk.js"""
import json, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / "n8n"
tpl, out = sys.argv[1], sys.argv[2]
s = (root / tpl).read_text()
subs = {
  "__CODE_BUILD_SOURCE__": "code/build-source-text.js",
  "__CODE_VALIDATE__": "code/validate-offer.js",
  "__CODE_COMPARE__": "code/compare-and-build-page.js",
  "__SYSTEM_PROMPT__": "prompts/extract-system.txt",
  "__SCHEMA_EXAMPLE__": "prompts/offer-schema-example.json",
}
for k, p in subs.items():
    if k in s:
        s = s.replace(k, json.dumps((root / p).read_text(), ensure_ascii=False))
(root / out).write_text(s)
print("wrote", out, len(s))
