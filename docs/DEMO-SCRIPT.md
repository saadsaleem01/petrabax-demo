# Petrabax demo script (30–40 min)

Follows Marcos's six points in his order. Image quota needed live: ~11 (one Generate = 10, one headline rebuild = 1).

## Before the call (15 min before)
1. Ask Claude to **reset the demo** (clears Airtable, loads a clean v1 of the Spain & Portugal promo with content).
2. Open these tabs, in this order:
   1. **Intake form:** https://saadullahsaleem.app.n8n.cloud/form/afd86223-bcde-4e0c-b9b3-587bd018ef3a
   2. **Airtable → Interfaces → Petrabax Review**
   3. **Mailchimp → Campaigns**
   4. **n8n → workflow "Petrabax · 1. Intake, Extract & Validate"** (canvas, for the architecture question)
3. Have a clean supplier PDF/email from Marcos ready if he sent the sanitized promotion (paste it into the form instead of the demo sample).

## 1. Supplier promotion processing (6 min)
- **Tab 1 (form):** choose **"Portugal - Coastal Highlights (conflicting + expired)"** → Process promo.
  - Say: *"Two different prices for the same room, and a deadline that has passed."*
  - Result page: **⛔ Blocked**: conflicting $1,290 vs $1,190, deadline Oct 31 2026 passed. *"Nothing gets generated from this."*
- **Back on the form:** choose **"Spain & Portugal Grand Tour - Early Booking (complex)"** (or Marcos's sanitized promo).
  - Result page: walk through **8 price tiers by room × season**, **9 departures**, deadline, **2 discounts**, **restrictions**, and the **12% commission marked INTERNAL ONLY**.
  - Point at the green ✔ quotes: *"Every number is tied to the exact sentence in the supplier's email. Code checks it, not the AI."*

## 2 + 3. Marketing materials and Mailchimp (8 min)
- **Tab 2 (Airtable → Supplier Promotions):** open the promo → click **✨ Generate content** (~30 s).
  - While it runs: *"AI writes EN + ES copy only from the verified facts; code then checks every price in the copy and blocks commission leaks."*
- **Content Review page:** open **Facebook EN** → show the **post graphic**; open **Instagram carousel ES** → show the **4 Spanish slides** (Córdoba, Sevilla, Lisboa, "Reserva antes del 31 de enero de 2027").
- **Email EN** → click **Preview link** → **Tab 3 Mailchimp** draft: logo, price banner, price table, departure chips, CTA, terms footer. Mention: *"Subject + preview text are set; on your paid plan it schedules directly."*

## 4. Employee interface (6 min)
- In **Content Review**, open **Facebook EN**:
  1. Change the **Headline** to something new → click **🔁 Rebuild** → new graphic appears (1 image).
  2. Type **"Now only $1,999!"** into the Body → **🔁 Rebuild** → ⚠️ *"$1,999 is not in the verified supplier offer"* → status **Needs changes**.
  3. Add **"supplier confirmed by phone"** to Reviewer notes → **🔁 Rebuild** → accepted and logged in the Change Log.
  4. Remove the $1,999 text → **🔁 Rebuild** → ✅ → set **Status = Approved**.
- *"Approve / Needs changes / Reject is just this Status dropdown; approved items leave the review queue."*

## 5. Accuracy & safeguards (6 min)
- **Tab 1 (form):** choose **"Spain & Portugal Grand Tour - Supplier correction"** → Process.
  - Result: **version 2**, *"What the supplier changed"*: June prices $2,490→$2,540 and $3,290→$3,340, **June 19 departure cancelled**, deadline Jan 31→Feb 15.
- **Airtable:** the promotion now shows **Needs check / version 2**; **all its drafts switched to "Pulled back"** with a note. **Change Log** shows *Created → Edited → Supplier correction*.
- Expired: recall the Portugal promo blocked at step 1 (and the daily expiry check for already-scheduled posts).

## 6. Publishing & reporting (4 min)
- Approved items → scheduled to Facebook / Instagram / LinkedIn; weekly report of reach, engagement and Mailchimp opens/clicks.
- (Show the live publishing step if test pages / Ayrshare are connected; otherwise walk through it on the n8n canvas and the report sample.)

## Close (3 min)
- Everything runs in **Petrabax's own n8n, Airtable and Mailchimp**: they own it.
- The paid POC = this on **their real supplier promotions** and **their templates/photos**; $600 credited toward the full build.
