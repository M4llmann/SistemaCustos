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
      ? 'bg-lime-600 text-white shadow-md'
      : 'text-gray-700 hover:bg-lime-50';
  };

  return (
    <div className="min-h-screen bg-rose-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full border-r-2 border-lime-200">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-lime-200 bg-gradient-to-r from-lime-50 to-amber-50">
            <h1 className="text-xl font-bold text-lime-800">
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
          <div className="p-4 border-t border-lime-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors"
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

