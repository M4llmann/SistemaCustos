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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col mx-0 sm:mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-4 sm:p-6">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">Histórico</h2>
              <p className="text-rose-100 text-sm mt-1 truncate">{nome}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-rose-100 text-2xl font-bold rounded-full hover:bg-white/20"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
        <div className="border-t border-rose-200 p-3 sm:p-4 bg-rose-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-rose-600 hover:to-pink-600 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

