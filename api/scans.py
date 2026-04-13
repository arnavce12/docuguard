import json
from urllib.parse import parse_qs, urlparse
from http.server import BaseHTTPRequestHandler
from core.database import get_user_scans, delete_user_scan, supabase

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
    def do_GET(self):
        try:
            authorization = self.headers.get('Authorization')
            user_id = get_user_id(authorization)
            scans = get_user_scans(user_id)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"scans": scans}).encode('utf-8'))
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            
    def do_DELETE(self):
        try:
            authorization = self.headers.get('Authorization')
            user_id = get_user_id(authorization)
            
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            
            scan_id = query_params.get('id', [None])[0]
            if not scan_id:
                raise Exception("Missing scan_id parameter")
                
            deleted = delete_user_scan(scan_id, user_id)
            if not deleted:
                raise Exception("Scan not found or not authorized to delete")
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "Scan deleted successfully"}).encode('utf-8'))
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
