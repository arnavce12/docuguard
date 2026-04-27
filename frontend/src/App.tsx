import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Scanner from './pages/Scanner';
import KydPage from './pages/KydPage';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Disclaimer from './pages/Disclaimer';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import HealthScore from './pages/HealthScore';
import { AuthProvider } from './lib/AuthContext.tsx';
import { ThemeProvider } from './lib/ThemeContext.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import './App.css';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
            <Route path="/kyd" element={<ProtectedRoute><KydPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/results/health-score" element={<ProtectedRoute><HealthScore /></ProtectedRoute>} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  </Router>
  );
}

export default App;
