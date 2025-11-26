import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useStore } from '../store/useStore';
import { UnidadeMedida, IngredienteReceita, HistoricoReceita } from '../types';
import { formatarMoeda, calcularCustoIngrediente } from '../utils/calculos';
import { uploadImagemReceita, deletarImagemReceita } from '../utils/storage';
import { auth } from '../config/firebase';
import ModalHistorico from '../components/ModalHistorico';
import AutocompleteIngrediente from '../components/AutocompleteIngrediente';

interface FormData {
  nome: string;
  ingredientes: IngredienteReceita[];
  descricao?: string;
  porcoes?: number;
  margemLucro?: number;
}

export default function Receitas() {
  const location = useLocation();
  const receitas = useStore((state) => state.receitas);
  const ingredientes = useStore((state) => state.ingredientes);
  const adicionarReceita = useStore((state) => state.adicionarReceita);
  const atualizarReceita = useStore((state) => state.atualizarReceita);
  const deletarReceita = useStore((state) => state.deletarReceita);
  const loading = useStore((state) => state.loading);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historicoReceita, setHistoricoReceita] = useState<HistoricoReceita[]>([]);
  const [receitaHistorico, setReceitaHistorico] = useState<{ id: string; nome: string } | null>(null);
  const [receitaDetalhes, setReceitaDetalhes] = useState<typeof receitas[0] | null>(null); // Receita com detalhes abertos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const buscarHistoricoReceita = useStore((state) => state.buscarHistoricoReceita);

  // Verifica se há uma receitaId no state da navegação e faz scroll para ela
  useEffect(() => {
    const state = location.state as { receitaId?: string } | null;
    if (state?.receitaId) {
      // Scroll para a receita após um pequeno delay para garantir que o DOM foi renderizado
      setTimeout(() => {
        const element = document.getElementById(`receita-${state.receitaId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [location.state]);

  // Bloqueia scroll quando modal de detalhes está aberto
  useEffect(() => {
    if (receitaDetalhes) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [receitaDetalhes]);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
      margemLucro: 250,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredientes',
  });

  const unidades: UnidadeMedida[] = ['g', 'kg', 'ml', 'L', 'un'];

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagemSelecionada(file);
      // Cria preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImagem(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerImagem = () => {
    setImagemSelecionada(null);
    setPreviewImagem(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: FormData) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setUploadingImagem(true);
    let imagemUrl: string | undefined = undefined;
    let imagemAntigaUrl: string | undefined = undefined;

    try {
      // Se está editando, guarda a URL da imagem antiga antes de fazer upload da nova
      if (editandoId && imagemSelecionada) {
        const receitaAtual = receitas.find((r) => r.id === editandoId);
        imagemAntigaUrl = receitaAtual?.imagemUrl;
      }

      // Se há uma nova imagem selecionada, faz upload
      if (imagemSelecionada) {
        try {
          imagemUrl = await uploadImagemReceita(imagemSelecionada, userId, editandoId || undefined);
        } catch (uploadError: any) {
          console.error('Erro ao fazer upload da imagem:', uploadError);
          setUploadingImagem(false);
          alert(uploadError?.message || 'Erro ao fazer upload da imagem. Tente novamente.');
          return;
        }
      }

      // Prepara os dados da receita
      const dadosReceita = {
        ...data,
        ...(imagemUrl && { imagemUrl }),
        // Se está editando e não há nova imagem, mantém a imagemUrl existente
        ...(editandoId && !imagemSelecionada && { imagemUrl: receitas.find((r) => r.id === editandoId)?.imagemUrl }),
      };

      if (editandoId) {
        await atualizarReceita(editandoId, dadosReceita);
        setEditandoId(null);
      } else {
        await adicionarReceita(dadosReceita);
      }

      // Se tudo deu certo e há uma imagem antiga, deleta ela
      if (editandoId && imagemSelecionada && imagemAntigaUrl) {
        try {
          await deletarImagemReceita(imagemAntigaUrl);
        } catch (deleteError) {
          console.error('Erro ao deletar imagem antiga:', deleteError);
        }
      }

      reset({
        ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
        margemLucro: 250,
      });
      setImagemSelecionada(null);
      setPreviewImagem(null);
      setMostrarForm(false);
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      alert('Erro ao salvar receita. Tente novamente.');
    } finally {
      setUploadingImagem(false);
    }
  };

  const handleEdit = (receita: typeof receitas[0]) => {
    setEditandoId(receita.id);
    reset({
      nome: receita.nome,
      ingredientes: receita.ingredientes,
      descricao: receita.descricao,
      porcoes: receita.porcoes,
      margemLucro: receita.margemLucro || 250,
    });
    // Define preview da imagem existente se houver
    if (receita.imagemUrl) {
      setPreviewImagem(receita.imagemUrl);
    } else {
      setPreviewImagem(null);
    }
    setImagemSelecionada(null);
    setMostrarForm(true);
  };

  const handleCancel = () => {
    setEditandoId(null);
    reset({
      ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
      margemLucro: 250,
    });
    setImagemSelecionada(null);
    setPreviewImagem(null);
    setMostrarForm(false);
  };

  const handleAbrirHistorico = async (receita: typeof receitas[0]) => {
    setReceitaHistorico({ id: receita.id, nome: receita.nome });
    setMostrarHistorico(true);
    try {
      console.log('Buscando histórico para receita:', receita.id);
      const historico = await buscarHistoricoReceita(receita.id);
      console.log('Histórico encontrado:', historico);
      setHistoricoReceita(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setHistoricoReceita([]);
    }
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

  // Filtrar receitas baseado no termo de busca
  const receitasFiltradas = receitas.filter((receita) =>
    receita.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    (receita.descricao && receita.descricao.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Receitas
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Cadastre e gerencie suas receitas
            </p>
          </div>
          {!mostrarForm && (
            <div className="flex items-center gap-3">
              <div className="w-64">
                <input
                  type="text"
                  placeholder="🔍 Buscar receitas..."
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
                  reset({
                    ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
                    margemLucro: 250,
                  });
                  setImagemSelecionada(null);
                  setPreviewImagem(null);
                  setMostrarForm(true);
                }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2.5 rounded-xl hover:from-rose-600 hover:to-pink-600 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all duration-200 whitespace-nowrap"
              >
                + Nova Receita
              </button>
            </div>
          )}
        </div>
      </div>

      {mostrarForm && (
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 mb-8 border border-rose-100">
          <h3 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-6">
            {editandoId ? 'Editar Receita' : 'Nova Receita'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Receita
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
                Ingredientes
              </label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 mb-2">
                  <AutocompleteIngrediente
                    ingredientes={ingredientes}
                    value={watch(`ingredientes.${index}.ingredienteId`) || ''}
                    onChange={(ingredienteId) => {
                      setValue(`ingredientes.${index}.ingredienteId`, ingredienteId, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                    onBlur={() => {
                      // Validation será feita automaticamente pelo react-hook-form
                    }}
                    error={errors.ingredientes?.[index]?.ingredienteId?.message}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    {...register(`ingredientes.${index}.quantidade`, {
                      required: 'Quantidade é obrigatória',
                      min: { value: 0.01, message: 'Quantidade deve ser maior que zero' },
                    })}
                    placeholder="Qtd"
                    className="w-24 px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                  />
                  <select
                    {...register(`ingredientes.${index}.unidade`)}
                    className="w-20 px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
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
                      className="px-3 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-600 shadow-sm transition-all"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ ingredienteId: '', quantidade: 0, unidade: 'g' })}
                className="mt-2 text-sm text-rose-600 hover:text-rose-700 font-semibold transition-colors"
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
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margem de Lucro (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('margemLucro', { 
                    required: 'Margem de lucro é obrigatória',
                    min: { value: 0.1, message: 'Margem deve ser maior que zero' },
                  })}
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                />
                {errors.margemLucro && (
                  <p className="text-red-600 text-sm mt-1">{errors.margemLucro.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custo Estimado
                </label>
                <div className="px-4 py-2.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Sugerido
                </label>
                <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                  <span className="font-medium text-gray-900">
                    {formatarMoeda(custoEstimado * ((formData.margemLucro || 250) / 100))}
                  </span>
                  {formData.porcoes && formData.porcoes > 0 && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({formatarMoeda((custoEstimado * ((formData.margemLucro || 250) / 100)) / formData.porcoes)}/porção)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (opcional)
              </label>
              <textarea
                {...register('descricao')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                placeholder="Descreva a receita, modo de preparo, dicas, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem da Receita (opcional)
              </label>
              <div className="space-y-2">
                {previewImagem && (
                  <div className="relative inline-block">
                    <img
                      src={previewImagem}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-xl border-2 border-rose-200 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removerImagem}
                      className="absolute -top-2 -right-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:from-red-500 hover:to-red-600 shadow-lg transition-all"
                    >
                      ×
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagemChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-rose-50 file:to-pink-50 file:text-rose-600 hover:file:from-rose-100 hover:file:to-pink-100"
                />
                <p className="text-xs text-gray-500">
                  Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
                </p>
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
                      disabled={loading || uploadingImagem}
                      className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all duration-200"
                    >
                      {uploadingImagem ? 'Enviando imagem...' : loading ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
                    </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Cards Quadrados */}
      <div className="bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden rounded-2xl border border-rose-100 p-6">
        {receitas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-medium">Nenhuma receita cadastrada ainda.</p>
          </div>
        ) : receitasFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-medium">Nenhuma receita encontrada com "{termoBusca}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {receitasFiltradas.map((receita) => (
              <div
                key={receita.id}
                id={`receita-${receita.id}`}
                className="bg-white rounded-xl shadow-md border border-rose-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 flex flex-col"
              >
                {/* Imagem - Menor */}
                <div className="w-full h-32 relative overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100">
                  {receita.imagemUrl ? (
                    <img
                      src={receita.imagemUrl}
                      alt={receita.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-rose-400 text-3xl">🍰</span>
                    </div>
                  )}
                </div>

                {/* Conteúdo do Card */}
                <div className="p-2.5 flex-1 flex flex-col">
                  {/* Nome - Menor */}
                  <h3 className="text-sm font-bold text-rose-700 mb-2 text-center line-clamp-2 min-h-[2.5rem]">
                    {receita.nome}
                  </h3>

                  {/* Custo e Preço Sugerido - Compactos */}
                  <div className="flex gap-2 mb-2.5">
                    {/* Bloco Custo - Menor */}
                    <div className="flex-1 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-2 border border-rose-200 min-h-[60px] flex flex-col justify-between">
                      <p className="text-[10px] text-rose-600 font-semibold mb-0.5">Custo:</p>
                      <p className="text-sm font-bold text-rose-700 leading-tight">
                        {formatarMoeda(receita.custoTotal)}
                      </p>
                      <div className="h-2"></div>
                    </div>
                    
                    {/* Bloco Preço Sugerido - Menor */}
                    <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-200 min-h-[60px] flex flex-col justify-between">
                      <p className="text-[10px] text-purple-600 font-semibold mb-0.5">Preço:</p>
                      <p className="text-sm font-bold text-purple-700 leading-tight">
                        {formatarMoeda(receita.custoTotal * ((receita.margemLucro || 250) / 100))}
                      </p>
                      <div className="h-2"></div>
                    </div>
                  </div>

                  {/* Botão Ver Detalhes - Menor */}
                  <button
                    onClick={() => setReceitaDetalhes(receita)}
                    className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white py-1.5 rounded-lg hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 font-semibold shadow-sm hover:shadow-md transition-all duration-200 text-xs"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Receita */}
      {receitaDetalhes && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReceitaDetalhes(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[50%] max-h-[90vh] overflow-hidden flex flex-col mx-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 relative">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-8">
                  <h2 className="text-2xl font-bold mb-1">{receitaDetalhes.nome}</h2>
                  <div className="flex gap-4 mt-3">
                    <div>
                      <p className="text-xs text-rose-100 mb-1">Custo:</p>
                      <p className="text-lg font-bold">
                        {formatarMoeda(receitaDetalhes.custoTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-rose-100 mb-1">Preço Sugerido:</p>
                      <p className="text-lg font-bold">
                        {formatarMoeda(receitaDetalhes.custoTotal * ((receitaDetalhes.margemLucro || 250) / 100))}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setReceitaDetalhes(null)}
                  className="text-white hover:text-rose-100 transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Layout: Imagem/Descrição à esquerda, Ingredientes à direita */}
              <div className="flex gap-4 items-start">
                {/* Lado Esquerdo: Imagem e Descrição */}
                <div className="w-1/4 flex-shrink-0 flex flex-col gap-4">
                  {/* Imagem */}
                  {receitaDetalhes.imagemUrl && (
                    <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-rose-200 bg-gradient-to-br from-rose-100 to-pink-100">
                      <img
                        src={receitaDetalhes.imagemUrl}
                        alt={receitaDetalhes.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Descrição abaixo da imagem */}
                  <div>
                    <p className="text-sm font-semibold text-rose-600 mb-2">Descrição:</p>
                    {receitaDetalhes.descricao ? (
                      <p className="text-sm text-gray-700 leading-relaxed bg-rose-50 rounded-lg p-3 border border-rose-100">
                        {receitaDetalhes.descricao}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic bg-rose-50 rounded-lg p-3 border border-rose-100">
                        Sem descrição
                      </p>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Ingredientes - Centralizados */}
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-sm font-semibold text-purple-600 mb-2">
                    Ingredientes ({receitaDetalhes.ingredientes.length}):
                  </p>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 max-h-[calc(90vh-300px)] overflow-y-auto w-full">
                    <ul className="space-y-2">
                      {receitaDetalhes.ingredientes.map((ing, idx) => {
                        const ingrediente = ingredientes.find((i) => i.id === ing.ingredienteId);
                        return (
                          <li key={idx} className="text-sm text-gray-700 flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            <span className="font-medium text-purple-700">
                              {ingrediente?.nome || 'Ingrediente não encontrado'}
                            </span>
                            <span className="text-gray-500">:</span>
                            <span className="font-bold text-purple-800">{ing.quantidade}</span>
                            <span className="text-gray-600">{ing.unidade}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer com Botões de Ação */}
            <div className="border-t border-rose-200 p-4 bg-rose-50 flex gap-3">
              <button
                onClick={() => {
                  handleEdit(receitaDetalhes);
                  setReceitaDetalhes(null);
                }}
                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-2.5 rounded-xl hover:from-rose-600 hover:to-pink-600 font-semibold shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-200"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  handleAbrirHistorico(receitaDetalhes);
                  setReceitaDetalhes(null);
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl hover:from-purple-600 hover:to-pink-600 font-semibold shadow-md shadow-purple-200/50 hover:shadow-lg transition-all duration-200"
              >
                Histórico
              </button>
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja deletar esta receita?')) {
                    deletarReceita(receitaDetalhes.id);
                    setReceitaDetalhes(null);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 rounded-xl hover:from-red-600 hover:to-red-700 font-semibold shadow-md shadow-red-200/50 hover:shadow-lg transition-all duration-200"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarHistorico && receitaHistorico && (
        <ModalHistorico
          isOpen={mostrarHistorico}
          onClose={() => {
            setMostrarHistorico(false);
            setReceitaHistorico(null);
            setHistoricoReceita([]);
          }}
          historico={historicoReceita}
          tipo="receita"
          nome={receitaHistorico.nome}
        />
      )}
    </div>
  );
}

