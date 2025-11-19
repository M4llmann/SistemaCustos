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
      ? 'bg-gradient-to-r from-rose-400 to-pink-400 text-white shadow-lg shadow-rose-200/50'
      : 'text-gray-600 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:text-rose-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-sm shadow-xl fixed h-full border-r border-rose-200/50">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-rose-100 bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100">
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Sistema de Custos
            </h1>
            <p className="text-xs text-rose-500 mt-1 font-medium">Gestão Inteligente</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive('/dashboard')}`}
            >
              <span className="mr-3 text-lg">📊</span>
              Dashboard
            </Link>
            <Link
              to="/ingredientes"
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive('/ingredientes')}`}
            >
              <span className="mr-3 text-lg">📦</span>
              Ingredientes
            </Link>
            <Link
              to="/receitas"
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive('/receitas')}`}
            >
              <span className="mr-3 text-lg">🍰</span>
              Receitas
            </Link>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-rose-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:text-rose-600 transition-all duration-200"
            >
              <span className="mr-3 text-lg">🚪</span>
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

