import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatarMoeda } from '../utils/calculos';

export default function Dashboard() {
  const navigate = useNavigate();
  const ingredientes = useStore((state) => state.ingredientes);
  const receitas = useStore((state) => state.receitas);

  const totalIngredientes = ingredientes.length;
  const totalReceitas = receitas.length;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-lime-800">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Visão geral do seu sistema de custos
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-lime-400 hover:shadow-xl transition-shadow">
          <div className="p-5 bg-gradient-to-r from-lime-50 to-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-lime-700 truncate">
                    Total de Ingredientes
                  </dt>
                  <dd className="text-2xl font-bold text-lime-900 mt-1">
                    {totalIngredientes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg border-l-4 border-amber-400 hover:shadow-xl transition-shadow">
          <div className="p-5 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🍰</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-semibold text-amber-700 truncate">
                    Total de Receitas
                  </dt>
                  <dd className="text-2xl font-bold text-amber-900 mt-1">
                    {totalReceitas}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {receitas.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-lime-800 mb-4">
            Receitas Recentes
          </h3>
          <div className="bg-white shadow-lg overflow-hidden sm:rounded-md border border-lime-200">
            <ul className="divide-y divide-lime-100">
              {receitas.slice(0, 5).map((receita) => (
                <li 
                  key={receita.id}
                  onClick={() => navigate('/receitas', { state: { receitaId: receita.id } })}
                  className="cursor-pointer hover:bg-lime-50 transition-colors border-l-4 border-transparent hover:border-lime-400"
                >
                  <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 flex-1">
                      {receita.imagemUrl && (
                        <img
                          src={receita.imagemUrl}
                          alt={receita.nome}
                          className="h-12 w-12 object-cover rounded-md border-2 border-lime-300 flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-sm font-bold text-lime-900">
                          {receita.nome}
                        </p>
                        <p className="text-sm text-lime-700">
                          <span className="font-semibold">{receita.ingredientes.length}</span> ingrediente(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-900">
                        {formatarMoeda(receita.custoTotal)}
                      </p>
                      {receita.porcoes && receita.porcoes > 0 && (
                        <p className="text-xs text-amber-700">
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

