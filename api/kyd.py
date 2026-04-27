import json
from http.server import BaseHTTPRequestHandler
from core.database import download_image, save_kyd_scan, supabase
from core.gemini import analyze_document_kyd

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
            
            if not storage_path:
                raise Exception("Missing storage_path in request body")
                
            authorization = self.headers.get('Authorization')
            user_id = get_user_id(authorization)
            
            # Download file from Supabase storage
            file_bytes = download_image(storage_path)
            
            # Analyze using Gemini KYD Prompt
            result = analyze_document_kyd(file_bytes)
            
            # Save results to DB
            saved = save_kyd_scan(
                document_type=result.get("document_type"),
                common_name=result.get("common_name"),
                issuing_authority=result.get("issuing_authority"),
                purpose=result.get("purpose"),
                typical_use_cases=result.get("typical_use_cases"),
                key_fields_present=result.get("key_fields_present"),
                data_categories=result.get("data_categories"),
                notes=result.get("notes"),
                storage_path=storage_path,
                user_id=user_id
            )
            
            response = {**result, "scan_id": saved["id"] if saved else None}
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            # Add CORS headers if needed, vercel usually handles via vercel.json but good to add base ones
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
