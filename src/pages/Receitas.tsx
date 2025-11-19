import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useStore } from '../store/useStore';
import { UnidadeMedida, IngredienteReceita } from '../types';
import { formatarMoeda, calcularCustoIngrediente } from '../utils/calculos';
import { uploadImagemReceita, deletarImagemReceita } from '../utils/storage';
import { auth } from '../config/firebase';

interface FormData {
  nome: string;
  ingredientes: IngredienteReceita[];
  descricao?: string;
  porcoes?: number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    });
    setImagemSelecionada(null);
    setPreviewImagem(null);
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
          <h2 className="text-2xl font-bold text-lime-800">Receitas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Cadastre e gerencie suas receitas
          </p>
        </div>
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-lime-600 text-white px-4 py-2 rounded-md hover:bg-lime-700 font-semibold shadow-md transition-colors"
          >
            + Nova Receita
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border-l-4 border-lime-400">
          <h3 className="text-lg font-bold text-lime-800 mb-4">
            {editandoId ? 'Editar Receita' : 'Nova Receita'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Receita
              </label>
              <input
                {...register('nome', { required: 'Nome é obrigatório' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
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
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                  <select
                    {...register(`ingredientes.${index}.unidade`)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
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
                className="mt-2 text-sm text-lime-700 hover:text-lime-900 font-semibold"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
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
                      className="h-32 w-32 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removerImagem}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
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
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-lime-50 file:text-lime-700 hover:file:bg-lime-100"
                />
                <p className="text-xs text-gray-500">
                  Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-amber-50 font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || uploadingImagem}
                      className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 disabled:opacity-50 font-semibold shadow-md transition-colors"
                    >
                      {uploadingImagem ? 'Enviando imagem...' : loading ? 'Salvando...' : editandoId ? 'Atualizar' : 'Salvar'}
                    </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-lg overflow-hidden sm:rounded-md border border-lime-200">
        {receitas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma receita cadastrada ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {receitas.map((receita) => (
              <li key={receita.id} id={`receita-${receita.id}`} className="px-4 py-4 hover:bg-green-50/30 transition-colors border-l-4 border-lime-300">
                <div className="grid grid-cols-[144px_2fr_1fr_0.5fr] gap-4 items-start">
                  {/* Coluna 1: Imagem */}
                  <div className="flex items-center justify-center h-full">
                    {receita.imagemUrl ? (
                      <img
                        src={receita.imagemUrl}
                        alt={receita.nome}
                        className="w-36 h-36 object-cover rounded-md border-2 border-lime-300 shadow-sm"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-lime-100 rounded-md border-2 border-lime-300 flex items-center justify-center">
                        <span className="text-lime-600 text-4xl">🍰</span>
                      </div>
                    )}
                  </div>

                  {/* Coluna 2: Nome e Descrição */}
                  <div className="flex flex-col h-36 bg-amber-50/50 rounded-md p-3">
                    <p className="text-lg font-bold text-gray-900 mb-1.5 text-amber-700">
                      {receita.nome}
                    </p>
                    <p className="text-xs font-semibold text-amber-600 mb-1.5">Descrição:</p>
                    {receita.descricao ? (
                      <p className="text-sm text-gray-700 leading-relaxed break-words overflow-y-auto">
                        {receita.descricao}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Sem descrição</p>
                    )}
                  </div>

                  {/* Coluna 3: Ingredientes */}
                  <div className="flex flex-col bg-lime-50/50 rounded-md p-3">
                    <p className="text-xs font-semibold text-lime-700 mb-2">
                      Ingredientes (<span className="font-bold text-lime-800">{receita.ingredientes.length}</span>):
                    </p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {receita.ingredientes.map((ing, idx) => {
                        const ingrediente = ingredientes.find((i) => i.id === ing.ingredienteId);
                        return (
                          <li key={idx} className="text-sm text-gray-700">
                            <span className="font-medium text-lime-800">{ingrediente?.nome || 'Ingrediente não encontrado'}</span>: <span className="font-bold text-lime-900">{ing.quantidade}</span> <span className="text-gray-600">{ing.unidade}</span>
                          </li>
                        );
                      })}
                    </ul>
                    {receita.porcoes && receita.porcoes > 0 && (
                      <p className="text-xs text-lime-700 mt-2">
                        <span className="font-bold text-lime-800">{receita.porcoes}</span> porção(ões)
                      </p>
                    )}
                  </div>

                  {/* Coluna 4: Custo, Preço Sugerido e Botões */}
                  <div className="flex flex-col">
                    {/* Custo e Preço Sugerido */}
                    <div className="flex justify-between items-start mb-4 gap-2">
                      {/* Custo à esquerda */}
                      <div className="bg-lime-100 rounded-md p-2 flex-1">
                        <p className="text-xs font-semibold text-lime-700 mb-1">Custo:</p>
                        <p className="text-xl font-bold text-lime-900">
                          {formatarMoeda(receita.custoTotal)}
                        </p>
                        {receita.porcoes && receita.porcoes > 0 && (
                          <p className="text-xs text-lime-700 mt-1">
                            <span className="font-bold">{formatarMoeda(receita.custoTotal / receita.porcoes)}</span>/porção
                          </p>
                        )}
                      </div>

                      {/* Preço Sugerido à direita */}
                      <div className="bg-amber-100 rounded-md p-2 flex-1 text-right">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Preço Sugerido:</p>
                        <p className="text-xl font-bold text-amber-900">
                          {formatarMoeda(receita.custoTotal * 2)}
                        </p>
                      </div>
                    </div>

                    {/* Botões */}
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => handleEdit(receita)}
                        className="text-white bg-lime-600 hover:bg-lime-700 text-sm font-semibold px-3 py-2 rounded-md transition-colors shadow-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja deletar esta receita?')) {
                            deletarReceita(receita.id);
                          }
                        }}
                        className="text-white bg-amber-500 hover:bg-amber-600 text-sm font-semibold px-3 py-2 rounded-md transition-colors shadow-sm"
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

