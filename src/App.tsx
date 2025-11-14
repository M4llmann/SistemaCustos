import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { useStore } from './store/useStore';
import { useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Ingredientes from './pages/Ingredientes';
import Receitas from './pages/Receitas';
import Dashboard from './pages/Dashboard';

function App() {
  const [user, loading] = useAuthState(auth);
  const setUserId = useStore((state) => state.setUserId);

  useEffect(() => {
    if (user) {
      setUserId(user.uid);
    } else {
      setUserId(null);
    }
  }, [user, setUserId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ingredientes" element={<Ingredientes />} />
          <Route path="/receitas" element={<Receitas />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

