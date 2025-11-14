import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '../store/useStore';
import { UnidadeMedida } from '../types';
import { formatarMoeda } from '../utils/calculos';

interface FormData {
  nome: string;
  precoTotal: number;
  medidaTotal: number;
  unidadeBase: UnidadeMedida;
}

export default function Ingredientes() {
  const ingredientes = useStore((state) => state.ingredientes);
  const adicionarIngrediente = useStore((state) => state.adicionarIngrediente);
  const atualizarIngrediente = useStore((state) => state.atualizarIngrediente);
  const deletarIngrediente = useStore((state) => state.deletarIngrediente);
  const loading = useStore((state) => state.loading);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (editandoId) {
      await atualizarIngrediente(editandoId, data);
      setEditandoId(null);
    } else {
      await adicionarIngrediente(data);
    }
    reset();
    setMostrarForm(false);
  };

  const handleEdit = (ingrediente: typeof ingredientes[0]) => {
    setEditandoId(ingrediente.id);
    reset({
      nome: ingrediente.nome,
      precoTotal: ingrediente.precoTotal,
      medidaTotal: ingrediente.medidaTotal,
      unidadeBase: ingrediente.unidadeBase,
    });
    setMostrarForm(true);
  };

  const handleCancel = () => {
    setEditandoId(null);
    reset();
    setMostrarForm(false);
  };

  const unidades: UnidadeMedida[] = ['g', 'kg', 'ml', 'L', 'un'];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ingredientes</h2>
          <p className="mt-1 text-sm text-gray-600">
            Cadastre e gerencie seus ingredientes
          </p>
        </div>
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Novo Ingrediente
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editandoId ? 'Editar Ingrediente' : 'Novo Ingrediente'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  {...register('nome', { required: 'Nome é obrigatório' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.nome && (
                  <p className="text-red-600 text-sm mt-1">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade Base
                </label>
                <select
                  {...register('unidadeBase', { required: 'Unidade é obrigatória' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {unidades.map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {unidade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('precoTotal', {
                    required: 'Preço é obrigatório',
                    min: { value: 0.01, message: 'Preço deve ser maior que zero' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.precoTotal && (
                  <p className="text-red-600 text-sm mt-1">{errors.precoTotal.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medida Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('medidaTotal', {
                    required: 'Medida é obrigatória',
                    min: { value: 0.01, message: 'Medida deve ser maior que zero' },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.medidaTotal && (
                  <p className="text-red-600 text-sm mt-1">{errors.medidaTotal.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {ingredientes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum ingrediente cadastrado ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {ingredientes.map((ingrediente) => (
              <li key={ingrediente.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {ingrediente.nome}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>
                        {formatarMoeda(ingrediente.precoTotal)} / {ingrediente.medidaTotal} {ingrediente.unidadeBase}
                      </span>
                      <span className="mx-2">•</span>
                      <span className="font-medium text-gray-900">
                        {formatarMoeda(ingrediente.precoPorUnidade)} / {ingrediente.unidadeBase}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(ingrediente)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja deletar este ingrediente?')) {
                          deletarIngrediente(ingrediente.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

