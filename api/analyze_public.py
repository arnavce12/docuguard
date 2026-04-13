import json
from http.server import BaseHTTPRequestHandler
from core.database import download_image, save_scan
from core.gemini import analyze_document

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            storage_path = body.get('storage_path')
            
            if not storage_path:
                raise Exception("Missing storage_path in request body")
            
            # Download file from Supabase storage
            file_bytes = download_image(storage_path)
            
            # Analyze using Gemini
            result = analyze_document(file_bytes)
            
            # Save aggregate data only
            save_scan(
                fraud_likelihood=result["fraud_likelihood"],
                confidence_score=result["confidence_score"],
                red_flags=result["red_flags"],
                explanation=result["explanation"],
                is_public_demo=True
            )
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
