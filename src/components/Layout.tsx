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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Sistema de Custos
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium ${isActive('/dashboard')}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/ingredientes"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium ${isActive('/ingredientes')}`}
                >
                  Ingredientes
                </Link>
                <Link
                  to="/receitas"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium ${isActive('/receitas')}`}
                >
                  Receitas
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

