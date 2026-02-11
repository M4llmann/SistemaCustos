import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        await createUserWithEmailAndPassword(auth, email, senha);
      }
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
      <div className="bg-white p-5 sm:p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-5 sm:mb-6">
          Sistema de Custos
        </h1>
        <p className="text-center text-gray-500 text-sm mb-4">Confeitaria</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
            />
          </div>

          {erro && (
            <div className="text-red-600 text-sm">{erro}</div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full min-h-[48px] bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 px-4 rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
          >
            {carregando ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErro('');
            }}
            className="min-h-[44px] px-4 text-rose-600 hover:text-rose-800 text-sm font-medium"
          >
            {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Fazer login'}
          </button>
        </div>
      </div>
    </div>
  );
}

