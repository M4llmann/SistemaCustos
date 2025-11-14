import { useStore } from '../store/useStore';
import { formatarMoeda } from '../utils/calculos';

export default function Dashboard() {
  const ingredientes = useStore((state) => state.ingredientes);
  const receitas = useStore((state) => state.receitas);

  const totalIngredientes = ingredientes.length;
  const totalReceitas = receitas.length;
  const custoTotalReceitas = receitas.reduce((acc, r) => acc + r.custoTotal, 0);
  const custoMedioReceita = totalReceitas > 0 ? custoTotalReceitas / totalReceitas : 0;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Visão geral do seu sistema de custos
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📦</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Ingredientes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalIngredientes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🍰</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Receitas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalReceitas}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">💰</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Custo Total Receitas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatarMoeda(custoTotalReceitas)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📊</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Custo Médio por Receita
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatarMoeda(custoMedioReceita)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {receitas.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Receitas Recentes
          </h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {receitas.slice(0, 5).map((receita) => (
                <li key={receita.id}>
                  <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {receita.nome}
                      </p>
                      <p className="text-sm text-gray-500">
                        {receita.ingredientes.length} ingrediente(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatarMoeda(receita.custoTotal)}
                      </p>
                      {receita.porcoes && receita.porcoes > 0 && (
                        <p className="text-xs text-gray-500">
                          {formatarMoeda(receita.custoTotal / receita.porcoes)}/porção
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

