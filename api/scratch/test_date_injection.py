import os
import sys
from unittest.mock import MagicMock, patch

# Add the parent directory to sys.path to import from core
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.gemini import analyze_document

@patch('core.gemini.genai.GenerativeModel')
def test_injection(mock_model_class):
    mock_model = MagicMock()
    mock_model_class.return_value = mock_model
    mock_response = MagicMock()
    mock_response.text = '{"fraud_likelihood": "low", "confidence_score": 90, "red_flags": [], "explanation": "Test", "health_score": null}'
    mock_model.generate_content.return_value = mock_response
    
    # Mock Image.open to avoid needing a real image
    with patch('PIL.Image.open', return_value=MagicMock()):
        try:
            result = analyze_document(b"not a real image")
            print("Successfully called analyze_document")
            
            # Check if the prompt contains a date
            call_args = mock_model.generate_content.call_args
            prompt_sent = call_args[0][0][0]
            print(f"Prompt starts with: {prompt_sent[:100]}...")
            
            if "Today's reference date is" in prompt_sent:
                print("SUCCESS: Date injection confirmed in prompt")
            else:
                print("FAILURE: Date injection NOT found in prompt")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_injection()
