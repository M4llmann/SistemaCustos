import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Sistema de Custos
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/dashboard')}`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </Link>
            <Link
              to="/ingredientes"
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/ingredientes')}`}
            >
              <span className="mr-3">📦</span>
              Ingredientes
            </Link>
            <Link
              to="/receitas"
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/receitas')}`}
            >
              <span className="mr-3">🍰</span>
              Receitas
            </Link>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span className="mr-3">🚪</span>
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

