import { useState, useRef, useEffect } from 'react';
import { Receita } from '../types';
import { formatarMoeda } from '../utils/calculos';

interface AutocompleteRecheioProps {
  recheios: Receita[];
  value: string;
  onChange: (recheioId: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
}

export default function AutocompleteRecheio({
  recheios,
  value,
  onChange,
  onBlur,
  error,
  required = false,
}: AutocompleteRecheioProps) {
  const [busca, setBusca] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const recheio = recheios.find((r) => r.id === value);
      if (recheio) {
        setBusca(recheio.nome);
      }
    } else {
      setBusca('');
    }
  }, [value, recheios]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMostrarSugestoes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recheiosFiltrados = recheios.filter((r) =>
    r.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    setBusca(texto);
    setMostrarSugestoes(true);
    if (!texto) onChange('');
  };

  const handleSelectRecheio = (recheio: Receita) => {
    setBusca(recheio.nome);
    onChange(recheio.id);
    setMostrarSugestoes(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => setMostrarSugestoes(true);

  const handleInputBlur = () => {
    setTimeout(() => {
      setMostrarSugestoes(false);
      onBlur?.();
    }, 200);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={busca}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="Digite para buscar recheio..."
        className={`w-full px-4 py-2.5 border ${
          error ? 'border-red-300' : 'border-rose-200'
        } rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all`}
        required={required}
      />
      {mostrarSugestoes && busca && recheiosFiltrados.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-rose-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {recheiosFiltrados.map((recheio) => (
              <li
                key={recheio.id}
                onClick={() => handleSelectRecheio(recheio)}
                className="px-4 py-2 hover:bg-rose-50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <span className="text-sm text-gray-700 font-medium">{recheio.nome}</span>
                <span className="text-xs text-rose-600 font-semibold">{formatarMoeda(recheio.custoTotal)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {mostrarSugestoes && busca && recheiosFiltrados.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-rose-200 rounded-xl shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">Nenhum recheio encontrado</p>
        </div>
      )}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
