# Petrabax AI Marketing Automation — Demo

Demo build for Petrabax East: supplier promotions → verified offer data → bilingual branded content → human approval → publishing → reporting.

## Structure
- `n8n/code/` — Code-node source (kept here so it's versioned and reviewable)
- `n8n/prompts/` — AI prompts and structured-output schemas
- `n8n/*.template.js` — n8n Workflow SDK definitions (placeholders filled by `scripts/build-sdk.py`)

## Workflows
1. **Intake, Extract & Validate** — supplier PDF/email → AI extracts every price tier, departure, deadline, discount, commission and restriction → code verifies every value against the source → supplier-correction diff → saved to *Petrabax Promotions*.
2. Generate (copy, graphics, Mailchimp) — _next_
3. Review & approve — _next_
4. Publish & report — _next_
