import os
import json
import re
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("models/gemini-2.5-flash")

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

Return ONLY a valid JSON object with absolutely no markdown, no code blocks, no explanation outside the JSON.
Use exactly this structure:

{
  "fraud_likelihood": "high" or "medium" or "low",
  "confidence_score": a number between 0 and 100,
  "red_flags": ["flag one", "flag two"],
  "explanation": "A clear 2-3 sentence plain English summary of your findings."
}

If the image is not a document (e.g. a photo, selfie, random image), return:
{
  "fraud_likelihood": "low",
  "confidence_score": 0,
  "red_flags": ["Not a recognizable document"],
  "explanation": "The uploaded image does not appear to be a financial document."
}
"""


def analyze_document(image_bytes: bytes) -> dict:
    """Send image to Gemini and return parsed fraud analysis."""
    print(f"[DEBUG] gemini.analyze_document started (bytes: {len(image_bytes)})")
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Add generation config for more control
        generation_config = {
            "temperature": 0.1,
            "top_p": 1,
            "top_k": 32,
            "max_output_tokens": 4096,
        }
        response = model.generate_content([PROMPT, image], generation_config=generation_config)
        print("[DEBUG] Gemini responded successfully")
        raw = response.text.strip()

        # Strip markdown code fences if Gemini adds them anyway
        raw = re.sub(r"```json|```", "", raw).strip()
        print(raw)
        result = json.loads(raw)

        # Validate and sanitize the response
        assert result["fraud_likelihood"] in ("high", "medium", "low")
        assert isinstance(result["confidence_score"], (int, float))
        assert isinstance(result["red_flags"], list)
        assert isinstance(result["explanation"], str)

        result["confidence_score"] = int(result["confidence_score"])
        return result

    except (json.JSONDecodeError, AssertionError, KeyError) as e:
        print(f"[DEBUG] Parse/validation error: {type(e).__name__}: {e}")
        print(f"[DEBUG] Raw length: {len(raw) if 'raw' in dir() else 'N/A'}")
        print(f"[DEBUG] Raw tail: {raw[-200:] if 'raw' in dir() and raw else 'N/A'}")
        # Fallback if Gemini returns something unexpected
        return {
            "fraud_likelihood": "medium",
            "confidence_score": 50,
            "red_flags": ["Analysis inconclusive — please try again"],
            "explanation": "The AI could not produce a structured analysis for this document. Try uploading a clearer image."
        }
    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")