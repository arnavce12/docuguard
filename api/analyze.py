import json
from http.server import BaseHTTPRequestHandler
from core.database import download_image, save_scan, supabase
from core.gemini import analyze_document

def get_user_id(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise Exception("Missing or invalid token")
    token = authorization.split(" ")[1]
    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise Exception("Invalid or expired token")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            storage_path = body.get('storage_path')
            label = body.get('label')
            
            if not storage_path:
                raise Exception("Missing storage_path in request body")
                
            authorization = self.headers.get('Authorization')
            user_id = get_user_id(authorization)
            
            # Download file from Supabase storage
            file_bytes = download_image(storage_path)
            
            # Analyze using Gemini
            result = analyze_document(file_bytes)
            
            # Save results to DB
            saved = save_scan(
                fraud_likelihood=result["fraud_likelihood"],
                confidence_score=result["confidence_score"],
                red_flags=result["red_flags"],
                explanation=result["explanation"],
                storage_path=storage_path,
                user_id=user_id,
                document_label=label,
                is_public_demo=False
            )
            
            response = {**result, "scan_id": saved["id"]}
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
