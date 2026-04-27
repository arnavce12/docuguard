# Know Your Document (KYD) — Feature Spec

## Overview

KYD lets a user upload any document and instantly understand what it is — its type, purpose, key fields, issuing authority, and what data it contains. It complements the existing fraud detection feature: fraud detection tells you *if* something is wrong, KYD tells you *what the document even is*.

---

## Stack Context

- **Frontend**: React + Vite + TypeScript (same as existing DocuGuard UI)
- **Backend**: FastAPI (Python)
- **AI**: Google Gemini Pro Vision via `google-generativeai`
- **Auth/Storage**: Supabase with RLS (same as existing flow)

---

## Agent Instructions

### 1. Backend — FastAPI endpoint (`/api/kyd`)

Create a new POST endpoint at `/api/kyd`.

**What it should do:**
- Accept a file upload (image or PDF, same as the fraud detection endpoint)
- Convert the file to base64 if needed
- Call Gemini Vision with the KYD prompt (see below)
- Parse and return a structured JSON response

**Constraints:**
- Reuse the existing file validation logic from the fraud detection endpoint
- Reuse the existing Gemini client initialization — do not create a second one
- The endpoint should return a consistent shape even if Gemini returns partial info (use `null` for missing fields, not missing keys)
- Add the same CORS handling already present on other routes

**Response shape to return:**
```json
{
  "document_type": "string",
  "common_name": "string",
  "issuing_authority": "string | null",
  "purpose": "string",
  "typical_use_cases": ["string"],
  "key_fields_present": ["string"],
  "data_categories": ["string"],
  "notes": "string | null"
}
```

---

### 2. Gemini Vision Prompt

This is the core logic. Pass this as the prompt alongside the document image:

```python
KYD_PROMPT = """
You are a document analysis expert. Analyze the uploaded document image and return a JSON object with the following fields:

- document_type: The formal category of this document (e.g. "Government ID", "Bank Statement", "Insurance Policy", "Invoice", "Academic Certificate")
- common_name: The common name people use for this document (e.g. "Aadhaar Card", "PAN Card", "Salary Slip")
- issuing_authority: Who typically issues this type of document (e.g. "UIDAI", "Income Tax Department", "Reserve Bank of India"). Set to null if not determinable.
- purpose: One or two sentences describing what this document is officially used for.
- typical_use_cases: A list of 3–5 real-world scenarios where this document is submitted or required.
- key_fields_present: A list of the actual field names/labels visible in this specific document (e.g. ["Name", "Date of Birth", "PAN Number"]).
- data_categories: Broader categories of data this document contains (e.g. ["Personal Identity", "Financial", "Address Proof"]).
- notes: Any important observations about this specific document instance — unusual fields, missing sections, language, format version, etc. Set to null if nothing notable.

Return ONLY a valid JSON object. No explanation, no markdown, no extra text.
"""
```

**Agent note:** After calling Gemini, wrap the response parsing in a try/except. If JSON parsing fails, return a 422 with a clear error message rather than a 500.

---

### 3. Frontend — KYD page/component

Create a new page or tab called "Know Your Document" in the existing React app.

**What it should do:**
- Reuse the existing file upload component (drag-and-drop + click)
- On upload, POST to `/api/kyd`
- Show a loading state while waiting
- Render the result as a structured breakdown (not raw JSON)

**UI sections to render from the response:**

| Section | Field(s) |
|---|---|
| Document identity | `document_type`, `common_name` |
| Issued by | `issuing_authority` |
| Purpose | `purpose` |
| Where it's used | `typical_use_cases` (list) |
| Fields found in this document | `key_fields_present` (chips/tags) |
| Data categories | `data_categories` (badges) |
| Notes | `notes` (only render if not null) |

**Agent note:** The result card should have a "Now check for fraud" CTA button that passes the same uploaded file to the existing fraud detection flow — this makes the two features work together naturally.

---

### 4. Supabase — storing KYD results (optional but recommended)

If the user is authenticated, save KYD results to a `kyd_analyses` table alongside the existing analyses table.

**Suggested table schema:**
```sql
create table kyd_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text,
  document_type text,
  common_name text,
  issuing_authority text,
  purpose text,
  typical_use_cases jsonb,
  key_fields_present jsonb,
  data_categories jsonb,
  notes text,
  created_at timestamptz default now()
);

-- RLS: users can only see their own rows
alter table kyd_analyses enable row level security;

create policy "Users see own kyd analyses"
  on kyd_analyses for select
  using (auth.uid() = user_id);

create policy "Users insert own kyd analyses"
  on kyd_analyses for insert
  with check (auth.uid() = user_id);
```

---

### 5. Routing

Add a new route `/kyd` in the React router. Add a nav link to it in the existing sidebar/navbar alongside the fraud detection link.

---

## Key Decisions

- **No separate Gemini client** — reuse whatever is already initialized in the backend. KYD is just a different prompt on the same model.
- **No separate file upload flow** — reuse the existing upload component. The file just gets sent to a different endpoint.
- **Graceful degradation** — if Gemini cannot confidently identify the document type, it should still return what it can. The frontend should handle null fields cleanly.
- **KYD → Fraud handoff** — the "check for fraud" button on the KYD result should make the two features feel like a workflow, not two isolated tools.

---

## What NOT to build yet

- Batch KYD (multiple documents at once) — out of scope for this iteration
- Exporting KYD results as PDF — out of scope
- Comparing KYD results across documents — out of scope
