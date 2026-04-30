import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from the api directory
# Adjust the path if you are running this from a different folder
env_path = r"d:\docuguard\api\.env"
load_dotenv(dotenv_path=env_path)

keys = [
    ("Primary", os.getenv("GEMINI_API_KEY")),
    ("Fallback 1", os.getenv("GEMINI_API_KEY_FALLBACK_1")),
    ("Fallback 2", os.getenv("GEMINI_API_KEY_FALLBACK_2"))
]

# Using gemini-flash-latest for best compatibility in 2026
# Falling back to 2.5-flash if needed
test_models = ["models/gemini-3-flash-preview", "models/gemini-2.5-flash"]

print("\n--- DocuGuard Gemini API Health Check ---")
print(f"Checking {len([k for _, k in keys if k])} keys...\n")

for name, key in keys:
    if not key:
        print(f"[{name:10}] MISSING: No key found in .env")
        continue
    
    genai.configure(api_key=key)
    success = False
    
    for model_name in test_models:
        try:
            model = genai.GenerativeModel(model_name)
            # Standard prompt to verify activity
            response = model.generate_content("Hello", generation_config={"max_output_tokens": 5})
            
            if response.candidates and response.candidates[0].content.parts:
                print(f"[{name:10}] OK | Model: {model_name} | Response: '{response.text.strip()}'")
                success = True
                break
            else:
                reason = response.candidates[0].finish_reason if response.candidates else "No candidates"
                # print(f"[{name:10}] INFO | Model {model_name} returned finish_reason {reason}")
                continue
                
        except Exception as e:
            # print(f"[{name:10}] INFO | Model {model_name} failed: {str(e).splitlines()[0]}")
            continue
    
    if not success:
        print(f"[{name:10}] FAILED: All tested models returned errors or blocked responses.")

print("\n--- Check Complete ---\n")
