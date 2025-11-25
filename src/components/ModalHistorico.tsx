import { useEffect } from 'react';
import { HistoricoIngrediente, HistoricoReceita } from '../types';
import { formatarMoeda } from '../utils/calculos';

interface ModalHistoricoProps {
  isOpen: boolean;
  onClose: () => void;
  historico: HistoricoIngrediente[] | HistoricoReceita[];
  tipo: 'ingrediente' | 'receita';
  nome: string;
}

export default function ModalHistorico({ isOpen, onClose, historico, tipo, nome }: ModalHistoricoProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Histórico</h2>
              <p className="text-rose-100 text-sm mt-1">{nome}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-rose-100 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {historico.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">Nenhum histórico encontrado.</p>
              <p className="text-xs text-gray-400 mt-2">
                O histórico será criado automaticamente quando você atualizar o preço.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  {tipo === 'ingrediente' ? (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-800">{(item as HistoricoIngrediente).nome}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatarMoeda((item as HistoricoIngrediente).precoTotal)} / {(item as HistoricoIngrediente).medidaTotal} {(item as HistoricoIngrediente).unidadeBase}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent text-lg">
                            {formatarMoeda((item as HistoricoIngrediente).precoPorUnidade)} / {(item as HistoricoIngrediente).unidadeBase}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatarData(item.data)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-800">{(item as HistoricoReceita).nome}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Custo: <span className="font-semibold">{formatarMoeda((item as HistoricoReceita).custoTotal)}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-lg">
                            {formatarMoeda((item as HistoricoReceita).precoSugerido)}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            ({(item as HistoricoReceita).margemLucro || 250}% margem)
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatarData(item.data)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-rose-200 p-4 bg-rose-50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-rose-600 hover:to-pink-600 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

