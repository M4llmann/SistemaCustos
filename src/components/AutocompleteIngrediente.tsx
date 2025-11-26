import { useState, useRef, useEffect } from 'react';
import { Ingrediente } from '../types';

interface AutocompleteIngredienteProps {
  ingredientes: Ingrediente[];
  value: string;
  onChange: (ingredienteId: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
}

export default function AutocompleteIngrediente({
  ingredientes,
  value,
  onChange,
  onBlur,
  error,
  required = false,
}: AutocompleteIngredienteProps) {
  const [busca, setBusca] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualiza o campo de busca quando o value muda
  useEffect(() => {
    if (value) {
      const ingrediente = ingredientes.find((ing) => ing.id === value);
      if (ingrediente) {
        setBusca(ingrediente.nome);
      }
    } else {
      setBusca('');
    }
  }, [value, ingredientes]);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMostrarSugestoes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtra ingredientes baseado na busca
  const ingredientesFiltrados = ingredientes.filter((ing) =>
    ing.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    setBusca(texto);
    setMostrarSugestoes(true);
    
    // Se limpar o campo, limpa a seleção
    if (!texto) {
      onChange('');
    }
  };

  const handleSelectIngrediente = (ingrediente: Ingrediente) => {
    setBusca(ingrediente.nome);
    onChange(ingrediente.id);
    setMostrarSugestoes(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setMostrarSugestoes(true);
  };

  const handleInputBlur = () => {
    // Delay para permitir clique na sugestão
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
        placeholder="Digite para buscar ingrediente..."
        className={`w-full px-4 py-2.5 border ${
          error ? 'border-red-300' : 'border-rose-200'
        } rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all`}
        required={required}
      />
      
      {mostrarSugestoes && busca && ingredientesFiltrados.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-rose-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {ingredientesFiltrados.map((ingrediente) => (
              <li
                key={ingrediente.id}
                onClick={() => handleSelectIngrediente(ingrediente)}
                className="px-4 py-2 hover:bg-rose-50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <span className="text-sm text-gray-700 font-medium">{ingrediente.nome}</span>
                <span className="text-xs text-gray-500">
                  {ingrediente.unidadeBase}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mostrarSugestoes && busca && ingredientesFiltrados.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-rose-200 rounded-xl shadow-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            Nenhum ingrediente encontrado
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}

