import os
import json
import re
from datetime import datetime
import google.generativeai as genai
from google.api_core import exceptions
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

# Setup API Key Rotation
def get_available_keys():
    keys = [
        os.getenv("GEMINI_API_KEY"),
        os.getenv("GEMINI_API_KEY_FALLBACK_1"),
        os.getenv("GEMINI_API_KEY_FALLBACK_2")
    ]
    return [k for k in keys if k]

API_KEYS = get_available_keys()
_current_key_index = 0

def configure_client():
    global _current_key_index
    if not API_KEYS:
        print("[ERROR] No Gemini API keys found in environment variables.")
        return False
    
    genai.configure(api_key=API_KEYS[_current_key_index])
    print(f"[DEBUG] Gemini client configured with key index {_current_key_index}")
    return True

# Initial configuration
configure_client()

def get_model():
    # Using gemini-3-flash: the latest model optimized for speed and intelligence
    # for high-throughput document analysis (as of April 2026).
    return genai.GenerativeModel("models/gemini-3-flash-preview")

PROMPT = """
You are an expert document forensics analyst specializing in financial fraud detection.

Analyze the provided document image for signs of forgery, tampering, or inauthenticity.

Look specifically for:
- Inconsistent fonts or font sizes within the same document
- Misaligned text, uneven spacing, or irregular margins
- Suspicious or low-quality logos and watermarks
- Pixelation or blurring in specific areas suggesting copy-paste editing
- Implausible amounts, dates, or reference numbers
- Missing standard fields expected for this document type
- Poor print or scan quality suggesting digital fabrication
- Inconsistent colors or ink density across the document

Also evaluate the document's overall health across five axes: completeness, legibility, consistency, validity, and scan_quality.

Return ONLY a valid JSON object with absolutely no markdown, no code blocks, no explanation outside the JSON.
Use exactly this structure:

{
  "document_label": "A short descriptive name for this document (e.g. 'Standard Chartered Statement', 'Reliance Invoice', 'PAN Card')",
  "fraud_likelihood": "high" or "medium" or "low",
  "confidence_score": a number between 0 and 100,
  "red_flags": ["flag one", "flag two"],
  "explanation": "A clear 2-3 sentence plain English summary of your findings.",
  "health_score": {
    "overall": a number between 0 and 100,
    "axes": {
      "completeness": {"score": number, "note": "string"},
      "legibility": {"score": number, "note": "string"},
      "consistency": {"score": number, "note": "string"},
      "validity": {"score": number, "note": "string"},
      "scan_quality": {"score": number, "note": "string"}
    },
    "flags": ["issue one", "issue two"],
    "grade": "A" or "B" or "C" or "D" or "F"
  }
}

If the image is not a document (e.g. a photo, selfie, random image), return:
{
  "fraud_likelihood": "low",
  "confidence_score": 0,
  "red_flags": ["Not a recognizable document"],
  "explanation": "The uploaded image does not appear to be a financial document.",
  "health_score": null
}
"""

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

def analyze_document(image_bytes: bytes) -> dict:
    """Send image to Gemini and return parsed fraud analysis with fallback logic."""
    global _current_key_index
    print(f"[DEBUG] gemini.analyze_document started (bytes: {len(image_bytes)})")
    
    for attempt in range(len(API_KEYS) or 1):
        try:
            if image_bytes.startswith(b'%PDF'):
                input_data = {'mime_type': 'application/pdf', 'data': image_bytes}
            else:
                input_data = Image.open(io.BytesIO(image_bytes))

            generation_config = {
                "temperature": 0.1,
                "top_p": 1,
                "top_k": 32,
                "max_output_tokens": 4096,
            }
            
            model = get_model()
            current_date = datetime.now().strftime("%B %d, %Y")
            full_prompt = f"IMPORTANT: Today's reference date is {current_date}. Use this to accurately determine if dates in the document are in the future.\n\n{PROMPT}"
            response = model.generate_content([full_prompt, input_data], generation_config=generation_config)
            print(f"[DEBUG] Gemini responded successfully (Key index: {_current_key_index})")
            
            raw = response.text.strip()
            raw = re.sub(r"```json|```", "", raw).strip()
            result = json.loads(raw)

            # Validate and sanitize
            assert result["fraud_likelihood"] in ("high", "medium", "low")
            assert isinstance(result["confidence_score"], (int, float))
            
            result["confidence_score"] = int(result["confidence_score"])
            result["document_label"] = result.get("document_label", "Unnamed Document")
            return result

        except (exceptions.ResourceExhausted, exceptions.ServiceUnavailable, exceptions.PermissionDenied, exceptions.Unauthenticated) as e:
            print(f"[WARNING] Gemini API Issue (Attempt {attempt+1}): {str(e)}")
            if len(API_KEYS) > 1 and attempt < len(API_KEYS) - 1:
                _current_key_index = (_current_key_index + 1) % len(API_KEYS)
                configure_client()
                print(f"[INFO] Switched to fallback API key (New index: {_current_key_index})")
                continue
            else:
                raise e
        except (json.JSONDecodeError, AssertionError, KeyError) as e:
            print(f"[DEBUG] Parse/validation error: {type(e).__name__}: {e}")
            return {
                "fraud_likelihood": "medium",
                "confidence_score": 50,
                "red_flags": ["Analysis inconclusive — please try again"],
                "explanation": "The AI could not produce a structured analysis for this document. Try uploading a clearer image.",
                "health_score": None
            }
        except Exception as e:
            print(f"[ERROR] Unexpected error in analyze_document: {str(e)}")
            raise RuntimeError(f"Gemini API error: {str(e)}")

    raise RuntimeError("All Gemini API keys exhausted or failed.")

def analyze_document_kyd(image_bytes: bytes) -> dict:
    """Send image to Gemini for KYD analysis with fallback logic."""
    global _current_key_index
    print(f"[DEBUG] gemini.analyze_document_kyd started (bytes: {len(image_bytes)})")
    
    for attempt in range(len(API_KEYS) or 1):
        try:
            if image_bytes.startswith(b'%PDF'):
                input_data = {'mime_type': 'application/pdf', 'data': image_bytes}
            else:
                input_data = Image.open(io.BytesIO(image_bytes))

            generation_config = {
                "temperature": 0.1,
                "top_p": 1,
                "top_k": 32,
                "max_output_tokens": 4096,
            }
            
            model = get_model()
            current_date = datetime.now().strftime("%B %d, %Y")
            full_prompt = f"IMPORTANT: Today's reference date is {current_date}. Use this to accurately determine if dates in the document are in the future.\n\n{KYD_PROMPT}"
            response = model.generate_content([full_prompt, input_data], generation_config=generation_config)
            print(f"[DEBUG] Gemini KYD responded successfully (Key index: {_current_key_index})")
            
            raw = response.text.strip()
            raw = re.sub(r"```json|```", "", raw).strip()
            result = json.loads(raw)
            
            return {
                "document_type": result.get("document_type", "Unknown Document type"),
                "common_name": result.get("common_name", "Unknown Name"),
                "issuing_authority": result.get("issuing_authority", None),
                "purpose": result.get("purpose", "Analysis could not precisely determine purpose."),
                "typical_use_cases": result.get("typical_use_cases", []),
                "key_fields_present": result.get("key_fields_present", []),
                "data_categories": result.get("data_categories", []),
                "notes": result.get("notes", None)
            }

        except (exceptions.ResourceExhausted, exceptions.ServiceUnavailable, exceptions.PermissionDenied, exceptions.Unauthenticated) as e:
            print(f"[WARNING] Gemini KYD API Issue (Attempt {attempt+1}): {str(e)}")
            if len(API_KEYS) > 1 and attempt < len(API_KEYS) - 1:
                _current_key_index = (_current_key_index + 1) % len(API_KEYS)
                configure_client()
                continue
            else:
                raise e
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[DEBUG] KYD Parse error: {type(e).__name__}: {e}")
            return {
                "document_type": "Unknown Document",
                "common_name": "Unrecognized",
                "issuing_authority": None,
                "purpose": "Could not extract details. Image may be unclear.",
                "typical_use_cases": [],
                "key_fields_present": [],
                "data_categories": [],
                "notes": "Failed to structured data from AI."
            }
        except Exception as e:
            raise RuntimeError(f"Gemini KYD API error: {str(e)}")

    raise RuntimeError("All Gemini API keys exhausted or failed for KYD.")
