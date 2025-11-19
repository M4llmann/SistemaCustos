import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStore } from '../store/useStore';
import { UnidadeMedida, HistoricoIngrediente } from '../types';
import { formatarMoeda } from '../utils/calculos';
import ModalHistorico from '../components/ModalHistorico';

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
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historicoIngrediente, setHistoricoIngrediente] = useState<HistoricoIngrediente[]>([]);
  const [ingredienteHistorico, setIngredienteHistorico] = useState<{ id: string; nome: string } | null>(null);
  const buscarHistoricoIngrediente = useStore((state) => state.buscarHistoricoIngrediente);

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

  const handleAbrirHistorico = async (ingrediente: typeof ingredientes[0]) => {
    setIngredienteHistorico({ id: ingrediente.id, nome: ingrediente.nome });
    setMostrarHistorico(true);
    try {
      console.log('Buscando histórico para ingrediente:', ingrediente.id);
      const historico = await buscarHistoricoIngrediente(ingrediente.id);
      console.log('Histórico encontrado:', historico);
      setHistoricoIngrediente(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setHistoricoIngrediente([]);
    }
  };

  const unidades: UnidadeMedida[] = ['g', 'kg', 'ml', 'L', 'un'];

  // Filtrar ingredientes baseado no termo de busca
  const ingredientesFiltrados = ingredientes.filter((ingrediente) =>
    ingrediente.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Ingredientes
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Cadastre e gerencie seus ingredientes
            </p>
          </div>
          {!mostrarForm && (
            <div className="flex items-center gap-3">
              <div className="w-64">
                <input
                  type="text"
                  placeholder="🔍 Buscar ingredientes..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                />
              </div>
              {termoBusca && (
                <button
                  onClick={() => setTermoBusca('')}
                  className="text-rose-400 hover:text-rose-600 transition-colors"
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
              <button
                onClick={() => {
                  setEditandoId(null);
                  reset();
                  setMostrarForm(true);
                }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2.5 rounded-xl hover:from-rose-600 hover:to-pink-600 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all duration-200 whitespace-nowrap"
              >
                + Novo Ingrediente
              </button>
            </div>
          )}
        </div>
      </div>

      {mostrarForm && (
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 mb-8 border border-rose-100">
          <h3 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-6">
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
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
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
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
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
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
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
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                />
                {errors.medidaTotal && (
                  <p className="text-red-600 text-sm mt-1">{errors.medidaTotal.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 border border-rose-200 rounded-xl text-gray-600 hover:bg-rose-50 hover:border-rose-300 font-semibold transition-all duration-200 shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all duration-200"
              >
                {loading ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden rounded-2xl border border-rose-100">
        {ingredientes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-medium">Nenhum ingrediente cadastrado ainda.</p>
          </div>
        ) : ingredientesFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-medium">Nenhum ingrediente encontrado com "{termoBusca}".</p>
          </div>
        ) : (
          <ul className="p-5 space-y-3">
            {ingredientesFiltrados.map((ingrediente) => (
              <li key={ingrediente.id} className="bg-white border border-rose-100 rounded-xl px-5 py-4 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:border-rose-200 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-base font-bold text-gray-800">
                        {ingrediente.nome}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-rose-600 font-medium">
                        <span className="font-semibold">{formatarMoeda(ingrediente.precoTotal)}</span> / {ingrediente.medidaTotal} {ingrediente.unidadeBase}
                      </span>
                      <span className="mx-2 text-rose-300">•</span>
                      <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {formatarMoeda(ingrediente.precoPorUnidade)} / {ingrediente.unidadeBase}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => handleAbrirHistorico(ingrediente)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-semibold bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm"
                    >
                      Histórico
                    </button>
                    <button
                      onClick={() => handleEdit(ingrediente)}
                      className="text-rose-600 hover:text-rose-700 text-sm font-semibold bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja deletar este ingrediente?')) {
                          deletarIngrediente(ingrediente.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm"
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

      {mostrarHistorico && ingredienteHistorico && (
        <ModalHistorico
          isOpen={mostrarHistorico}
          onClose={() => {
            setMostrarHistorico(false);
            setIngredienteHistorico(null);
            setHistoricoIngrediente([]);
          }}
          historico={historicoIngrediente}
          tipo="ingrediente"
          nome={ingredienteHistorico.nome}
        />
      )}
    </div>
  );
}

