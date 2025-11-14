import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useStore } from '../store/useStore';
import { UnidadeMedida, IngredienteReceita } from '../types';
import { formatarMoeda, calcularCustoIngrediente } from '../utils/calculos';

interface FormData {
  nome: string;
  ingredientes: IngredienteReceita[];
  observacoes?: string;
  porcoes?: number;
}

export default function Receitas() {
  const receitas = useStore((state) => state.receitas);
  const ingredientes = useStore((state) => state.ingredientes);
  const adicionarReceita = useStore((state) => state.adicionarReceita);
  const atualizarReceita = useStore((state) => state.atualizarReceita);
  const deletarReceita = useStore((state) => state.deletarReceita);
  const loading = useStore((state) => state.loading);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [receitaDetalhes, setReceitaDetalhes] = useState<string | null>(null);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredientes',
  });

  const unidades: UnidadeMedida[] = ['g', 'kg', 'ml', 'L', 'un'];

  const onSubmit = async (data: FormData) => {
    if (editandoId) {
      await atualizarReceita(editandoId, data);
      setEditandoId(null);
    } else {
      await adicionarReceita(data);
    }
    reset({
      ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
    });
    setMostrarForm(false);
  };

  const handleEdit = (receita: typeof receitas[0]) => {
    setEditandoId(receita.id);
    reset({
      nome: receita.nome,
      ingredientes: receita.ingredientes,
      observacoes: receita.observacoes,
      porcoes: receita.porcoes,
    });
    setMostrarForm(true);
  };

  const handleCancel = () => {
    setEditandoId(null);
    reset({
      ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
    });
    setMostrarForm(false);
  };

  const calcularCustoReceitaForm = (formData: FormData): number => {
    let custoTotal = 0;
    formData.ingredientes.forEach((ingReceita) => {
      const ingrediente = ingredientes.find((ing) => ing.id === ingReceita.ingredienteId);
      if (ingrediente) {
        const custo = calcularCustoIngrediente(
          ingrediente,
          ingReceita.quantidade,
          ingReceita.unidade
        );
        custoTotal += custo;
      }
    });
    return custoTotal;
  };

  const formData = watch();
  const custoEstimado = mostrarForm ? calcularCustoReceitaForm(formData) : 0;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Receitas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Cadastre e gerencie suas receitas
          </p>
        </div>
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Nova Receita
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editandoId ? 'Editar Receita' : 'Nova Receita'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Receita
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
                Ingredientes
              </label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2">
                  <select
                    {...register(`ingredientes.${index}.ingredienteId`, {
                      required: 'Selecione um ingrediente',
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {ingredientes.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.nome}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`ingredientes.${index}.quantidade`, {
                      required: 'Quantidade é obrigatória',
                      min: { value: 0.01, message: 'Quantidade deve ser maior que zero' },
                    })}
                    placeholder="Qtd"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    {...register(`ingredientes.${index}.unidade`)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {unidades.map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {unidade}
                      </option>
                    ))}
                  </select>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ ingredienteId: '', quantidade: 0, unidade: 'g' })}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                + Adicionar Ingrediente
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porções (opcional)
                </label>
                <input
                  type="number"
                  step="1"
                  {...register('porcoes', { min: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custo Estimado
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  <span className="font-medium text-gray-900">
                    {formatarMoeda(custoEstimado)}
                  </span>
                  {formData.porcoes && formData.porcoes > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({formatarMoeda(custoEstimado / formData.porcoes)}/porção)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações (opcional)
              </label>
              <textarea
                {...register('observacoes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
        {receitas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma receita cadastrada ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {receitas.map((receita) => (
              <li key={receita.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {receita.nome}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>
                        {receita.ingredientes.length} ingrediente(s)
                      </span>
                      {receita.porcoes && receita.porcoes > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{receita.porcoes} porção(ões)</span>
                        </>
                      )}
                    </div>
                    {receitaDetalhes === receita.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Ingredientes:
                        </p>
                        <ul className="space-y-1">
                          {receita.ingredientes.map((ing, idx) => {
                            const ingrediente = ingredientes.find((i) => i.id === ing.ingredienteId);
                            return (
                              <li key={idx} className="text-sm text-gray-600">
                                {ingrediente?.nome || 'Ingrediente não encontrado'}: {ing.quantidade} {ing.unidade}
                              </li>
                            );
                          })}
                        </ul>
                        {receita.observacoes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Observações:</span> {receita.observacoes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setReceitaDetalhes(receitaDetalhes === receita.id ? null : receita.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        {receitaDetalhes === receita.id ? 'Ocultar' : 'Detalhes'}
                      </button>
                      <button
                        onClick={() => handleEdit(receita)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja deletar esta receita?')) {
                            deletarReceita(receita.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Deletar
                      </button>
                    </div>
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

