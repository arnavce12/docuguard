# DocuGuard

DocuGuard is a modern financial document forensics tool that uses AI to detect signs of forgery, tampering, and inauthenticity.

## Project Structure

- `backend/`: FastAPI application handling document analysis via Gemini Pro Vision and storage via Supabase.
- `frontend/`: React + Vite + TypeScript frontend based on premium Stitch designs.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Supabase account and project
- Google Gemini API key

### Backend Setup

1. Navigate to `backend/`
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file based on `.env.example` and add your credentials:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (default: http://localhost:8000)
4. Run the development server:
   ```bash
   npm run dev
   ```

## Technology Stack

- **Frontend**: React, Vite, TypeScript, Lucide React, Supabase Client (Auth).
- **Backend**: FastAPI, Google Generative AI (Gemini), Supabase Admin SDK.
- **Database/Storage**: Supabase.

## License

MIT
