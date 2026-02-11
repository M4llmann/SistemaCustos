import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatarMoeda } from '../utils/calculos';
import { ROTA_PARA_TIPO_RECEITA } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const ingredientes = useStore((state) => state.ingredientes);
  const receitas = useStore((state) => state.receitas);

  const totalIngredientes = ingredientes.length;
  const totalReceitas = receitas.length;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h2>
        <p className="text-sm text-gray-500 font-medium">
          Visão geral do seu sistema de custos
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-rose-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="p-6 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-rose-400 to-pink-400 rounded-2xl p-4 shadow-lg shadow-rose-200/50">
                <div className="text-3xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-rose-600 truncate mb-1">
                    Total de Ingredientes
                  </dt>
                  <dd className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                    {totalIngredientes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-purple-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl p-4 shadow-lg shadow-purple-200/50">
                <div className="text-3xl">🍰</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-purple-600 truncate mb-1">
                    Total de Receitas
                  </dt>
                  <dd className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {totalReceitas}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {receitas.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Receitas Recentes
          </h3>
          <div className="bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden rounded-2xl border border-rose-100">
            <ul className="divide-y divide-rose-50">
              {receitas.slice(0, 5).map((receita) => (
                <li 
                  key={receita.id}
                  onClick={() => navigate(`/receitas/${ROTA_PARA_TIPO_RECEITA[receita.tipo ?? 'bolo']}`, { state: { receitaId: receita.id } })}
                  className="cursor-pointer hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 transition-all duration-200 border-l-4 border-transparent hover:border-rose-400 hover:shadow-md"
                >
                  <div className="px-6 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4 flex-1">
                      {receita.imagemUrl && (
                        <img
                          src={receita.imagemUrl}
                          alt={receita.nome}
                          className="h-14 w-14 object-cover rounded-xl border-2 border-rose-200 shadow-md flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-800 mb-1">
                          {receita.nome}
                        </p>
                        <p className="text-xs text-rose-500 font-medium">
                          <span className="font-semibold">{receita.ingredientes.length}</span> ingrediente(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {formatarMoeda(receita.custoTotal)}
                      </p>
                      {receita.porcoes && receita.porcoes > 0 && (
                        <p className="text-xs text-purple-500 font-medium mt-1">
                          <span className="font-semibold">{formatarMoeda(receita.custoTotal / receita.porcoes)}</span>/porção
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

