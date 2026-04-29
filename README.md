<div align="center">
  <!-- PLACEHOLDER FOR LOGO/BANNER -->
  <img src="[INSERT_LOGO_IMAGE_URL]" alt="DocuGuard Logo" width="200" />

  # 🛡️ DocuGuard
  
  **AI-Powered Document Forensic Engine & Identity Profiler**

  [![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](#)
  [![React](https://img.shields.io/badge/Frontend-React_18-blue?logo=react)](#)
  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](#)
  [![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](#)
  [![Gemini API](https://img.shields.io/badge/AI-Google_Gemini-4285F4?logo=google)](#)

  [Live Demo](https://docuguard-five.vercel.app/) | [GitHub Repository](https://github.com/arnavce12/docuguard.git)
</div>

<br />

<!-- PLACEHOLDER FOR HERO SCREENSHOT -->
<div align="center">
  <img src="[INSERT_HERO_SCREENSHOT_URL]" alt="DocuGuard Dashboard Preview" width="800" />
</div>

<br />

## ✨ Overview

**DocuGuard** is an advanced, deployment-ready financial document forensics platform. It leverages state-of-the-art AI (Google Gemini Pro Vision) to instantly analyze documents, detect subtle signs of forgery, verify authenticity, and generate comprehensive "Know Your Document" (KYD) profiles.

Designed with a modern, high-performance architecture, DocuGuard features a premium React frontend and a robust FastAPI serverless backend, seamlessly deployed for global access and instant threat detection.

---

## 🚀 Live Deployment

DocuGuard is fully optimized for production environments and serverless architectures. 

- 🌍 **Live Platform:** [DocuGuard Web App](https://docuguard-five.vercel.app/)
- ⚡ **Hosting:** Deployed seamlessly on **Vercel**.
- 🛠 **Backend:** FastAPI routes deployed as **Vercel Serverless Functions** (`/api/*`).
- 🗄 **Storage/Auth:** Powered by live **Supabase** instances for secure document storage and user authentication.

---

## 🛠️ Technology Stack

Our architecture is built for speed, security, and scalability.

### **Frontend**
- **Framework:** React + Vite (TypeScript)
- **Styling:** Tailwind CSS (Premium Glassmorphism & Micro-animations)
- **Icons:** Lucide React
- **State/Auth:** Supabase Auth Client

### **Backend (Serverless)**
- **Framework:** FastAPI (Python)
- **AI Engine:** Google Generative AI (Gemini 1.5 Pro)
- **Deployment:** Vercel Serverless Functions (`api/index.py`)
- **Integration:** Supabase Admin SDK for backend secure operations

### **Database & Infrastructure**
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Supabase Storage (Secure bucket policies)

---

## 🎯 Key Features

- 🕵️‍♂️ **Fraud Detection Engine:** Pixel-level tampering analysis, anomaly detection, and authenticity verification.
- 🪪 **Know Your Document (KYD):** Instantly extract data categories, document purpose, issuing authority, and key identifiers.
- 📊 **Dynamic Analytics Dashboard:** Real-time posture tracking, risk distribution charts, and unified forensic history.
- ⚡ **Serverless Performance:** Highly optimized FastAPI endpoints running on Vercel edge/serverless infrastructure.
- 🎨 **Premium UI/UX:** Responsive, dark-mode-first aesthetic with smooth interactions and real-time feedback.

<!-- PLACEHOLDER FOR FEATURES SCREENSHOT -->
<div align="center">
  <img src="[INSERT_FEATURES_SCREENSHOT_URL]" alt="DocuGuard Features" width="800" />
</div>

---

## 💻 Local Development Setup

Want to run DocuGuard locally? Follow these steps:

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **Supabase** Account & Project
- **Google Gemini** API Key

### 2. Clone the Repository
```bash
git clone https://github.com/arnavce12/docuguard.git
cd docuguard
```

### 3. Environment Configuration
Create a `.env` file in the root directory (for backend/Vercel) and `frontend/.env` based on your credentials:

**Backend (`.env`):**
```env
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

**Frontend (`frontend/.env`):**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=/api  # Handled automatically in production via rewrites
```

### 4. Running the Project (Vercel Dev)
The easiest way to run the full stack (Frontend + FastAPI Serverless Backend) locally, without dealing with CORS or routing issues, is using the Vercel CLI.

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
pip install -r requirements.txt

# Start the unified local development environment
vercel dev
```
*Your application will typically be available at `localhost:3000` with API requests automatically routed to your Python functions.*

---

## 📖 How to Use

1. **Sign Up / Login:** Create an account to securely save your scan history and analytics. (Public, unauthenticated demos are available but restricted to non-sensitive testing).
2. **KYD Profiling:** Navigate to the **Verify Identity** page. Upload a document (e.g., ID, Bank Statement) to instantly extract its profile, data capabilities, and intended use case.
3. **Fraud Scanning:** Move to the **Fraud Scan** tool to run a deep forensic check. The AI will output a confidence score, risk level, and flag specific tampering signs.
4. **Dashboard & Analytics:** Review your unified timeline in the **History** tab or check global platform statistics and your security posture on the **Dashboard** and **Analytics** pages.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/arnavce12/docuguard/issues).

## 📄 License
This project is licensed under the **MIT License**.

<div align="center">
  <p>Built with Enthusiasm for advanced document security.</p>
</div>
