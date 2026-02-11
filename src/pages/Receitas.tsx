import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, NavLink, Navigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useStore } from '../store/useStore';
import { UnidadeMedida, IngredienteReceita, RecheioReceita, HistoricoReceita, TipoReceita } from '../types';
import { formatarMoeda, calcularCustoIngrediente, converterUnidade } from '../utils/calculos';
import { uploadImagemReceita, deletarImagemReceita } from '../utils/storage';
import { auth } from '../config/firebase';
import ModalHistorico from '../components/ModalHistorico';
import AutocompleteIngrediente from '../components/AutocompleteIngrediente';
import AutocompleteRecheio from '../components/AutocompleteRecheio';

interface FormData {
  nome: string;
  ingredientes: IngredienteReceita[];
  recheios: RecheioReceita[];
  descricao?: string;
  porcoes?: number;
  margemLucro?: number;
  unidadePadrao?: UnidadeMedida;
  rendimentoGramas?: number;
}

const TIPO_PARA_ROTA: Record<string, TipoReceita> = {
  recheios: 'recheio',
  bolos: 'bolo',
  sobremesas: 'sobremesa',
};

const ROTA_PARA_TIPO: Record<TipoReceita, string> = {
  recheio: 'recheios',
  bolo: 'bolos',
  sobremesa: 'sobremesas',
};

const LABELS: Record<TipoReceita, { titulo: string; subtitulo: string; novo: string; editar: string }> = {
  recheio: { titulo: 'Recheios', subtitulo: 'Cadastre recheios para usar em bolos e sobremesas', novo: 'Novo Recheio', editar: 'Editar Recheio' },
  bolo: { titulo: 'Bolos', subtitulo: 'Cadastre e gerencie seus bolos', novo: 'Novo Bolo', editar: 'Editar Bolo' },
  sobremesa: { titulo: 'Sobremesas', subtitulo: 'Cadastre e gerencie suas sobremesas', novo: 'Nova Sobremesa', editar: 'Editar Sobremesa' },
};

export default function Receitas() {
  const location = useLocation();
  const { tipo: tipoParam } = useParams<{ tipo: string }>();
  const tipoValido = tipoParam && TIPO_PARA_ROTA[tipoParam];
  const tipoReceita: TipoReceita = tipoValido ? TIPO_PARA_ROTA[tipoParam] : 'bolo';

  if (tipoParam && !tipoValido) {
    return <Navigate to="/receitas/bolos" replace />;
  }

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
  const [migrandoRecheios, setMigrandoRecheios] = useState(false);
  const [migracaoRecheiosFeita, setMigracaoRecheiosFeita] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const buscarHistoricoReceita = useStore((state) => state.buscarHistoricoReceita);

  // Receitas que têm "recheio" no nome mas ainda não estão como tipo recheio (ex.: estão em Bolos)
  const receitasParaMigrarRecheio = receitas.filter(
    (r) =>
      r.nome.toLowerCase().includes('recheio') &&
      (r.tipo ?? 'bolo') !== 'recheio'
  );

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

  // Quando o formulário abre (nova receita ou editar), centraliza na tela
  useEffect(() => {
    if (mostrarForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [mostrarForm]);

  // Ao trocar de aba (Recheios / Bolos / Sobremesas), garante que o formulário feche
  // e o estado de edição seja limpo, evitando ficar com o form aberto em outra seção
  useEffect(() => {
    if (mostrarForm) {
      setEditandoId(null);
      reset({
        ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
        recheios: [],
        margemLucro: 250,
        unidadePadrao: undefined,
        rendimentoGramas: undefined,
      });
      setImagemSelecionada(null);
      setPreviewImagem(null);
      setMostrarForm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoReceita]);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
      recheios: [],
      margemLucro: 250,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredientes',
  });

  const { fields: fieldsRecheios, append: appendRecheio, remove: removeRecheio } = useFieldArray({
    control,
    name: 'recheios',
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

      // Prepara os dados da receita (normaliza tipos para o Firestore e evita undefined)
      const dadosReceita = {
        nome: data.nome,
        tipo: editandoId
          ? receitas.find((r) => r.id === editandoId)?.tipo ?? tipoReceita
          : tipoReceita,
        ingredientes: data.ingredientes.map((ing) => ({
          ingredienteId: ing.ingredienteId,
          quantidade: typeof ing.quantidade === 'number' ? ing.quantidade : Number(ing.quantidade) || 0,
          unidade: ing.unidade || 'g',
        })),
        ...(tipoReceita === 'bolo' && {
          recheios: (data.recheios ?? [])
            .filter((r) => r.recheioId)
            .map((r) => ({
              recheioId: r.recheioId,
              quantidade: typeof r.quantidade === 'number' ? r.quantidade : Number(r.quantidade) || 0,
              unidade: (r.unidade || 'g') as UnidadeMedida,
            })),
        }),
        descricao: data.descricao ?? '',
        porcoes: data.porcoes != null && Number(data.porcoes) > 0 ? Number(data.porcoes) : undefined,
        margemLucro: data.margemLucro != null ? Number(data.margemLucro) : 250,
        ...(imagemUrl && { imagemUrl }),
        ...(editandoId && !imagemSelecionada && { imagemUrl: receitas.find((r) => r.id === editandoId)?.imagemUrl }),
        ...(tipoReceita === 'recheio' && {
          unidadePadrao: data.unidadePadrao || undefined,
          rendimentoGramas: data.rendimentoGramas != null && Number(data.rendimentoGramas) > 0 ? Number(data.rendimentoGramas) : undefined,
        }),
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
        recheios: [],
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
      recheios: receita.recheios ?? [],
      descricao: receita.descricao,
      porcoes: receita.porcoes,
      margemLucro: receita.margemLucro || 250,
      unidadePadrao: receita.unidadePadrao,
      rendimentoGramas: receita.rendimentoGramas,
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
      recheios: [],
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

  const escapeHtml = (text: string) =>
    String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const handleGerarRelatorioTodasReceitas = () => {
    if (receitas.length === 0) {
      alert('Não há receitas cadastradas para gerar o relatório.');
      return;
    }

    const blocosReceitas = receitas.map((receita) => {
      const precoSugerido = receita.custoTotal * ((receita.margemLucro || 250) / 100);
      const linhasIngredientes = receita.ingredientes
        .map((ing) => {
          const ingrediente = ingredientes.find((i) => i.id === ing.ingredienteId);
          const nome = ingrediente?.nome ?? 'Ingrediente não encontrado';
          return `${escapeHtml(nome)}: ${ing.quantidade} ${ing.unidade}`;
        })
        .join('\n');
      return `
        <section class="receita">
          <h2>${escapeHtml(receita.nome)}</h2>
          <div class="campo"><strong>Ingredientes:</strong></div>
          <pre>${escapeHtml(linhasIngredientes)}</pre>
          <div class="totais">
            <span><strong>Custo:</strong> ${formatarMoeda(receita.custoTotal)}</span>
            <span><strong>Preço sugerido:</strong> ${formatarMoeda(precoSugerido)}</span>
          </div>
        </section>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Receitas</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; padding: 20px; max-width: 500px; margin: 0 auto; }
    h1 { font-size: 18px; margin: 0 0 20px 0; border-bottom: 2px solid #333; padding-bottom: 8px; }
    .receita { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #ccc; break-inside: avoid; }
    .receita:last-child { border-bottom: none; }
    .receita h2 { font-size: 15px; margin: 0 0 8px 0; }
    .campo { margin-bottom: 4px; }
    pre { white-space: pre-wrap; margin: 0 0 8px 0; font-family: inherit; line-height: 1.4; font-size: 12px; }
    .totais { display: flex; gap: 16px; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>Relatório de Receitas</h1>
  ${blocosReceitas}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const janela = window.open(url, '_blank', 'noopener,noreferrer');

    if (janela) {
      janela.focus();
      const revoke = () => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      };
      setTimeout(() => {
        janela.print();
        janela.onafterprint = () => {
          revoke();
          janela.close();
        };
        setTimeout(revoke, 60000);
      }, 800);
    } else {
      URL.revokeObjectURL(url);
      alert('Permita pop-ups para abrir a janela de impressão.');
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
    if (tipoReceita === 'bolo' && formData.recheios?.length) {
      formData.recheios.forEach((item) => {
        const recheio = receitas.find((r) => r.id === item.recheioId);
        if (!recheio) return;
        const qty = Number(item.quantidade) || 0;
        if (item.unidade === 'un') {
          custoTotal += recheio.custoTotal * qty;
          return;
        }
        const qtyG = converterUnidade(qty, item.unidade, 'g');
        if (recheio.rendimentoGramas && recheio.rendimentoGramas > 0) {
          custoTotal += (qtyG / recheio.rendimentoGramas) * recheio.custoTotal;
        } else {
          custoTotal += recheio.custoTotal;
        }
      });
    }
    return custoTotal;
  };

  const formData = watch();
  const custoEstimado = mostrarForm ? calcularCustoReceitaForm(formData) : 0;

  const receitasRecheio = receitas.filter((r) => (r.tipo ?? 'bolo') === 'recheio');

  // Filtrar por tipo da seção (recheio/bolo/sobremesa) e depois por termo de busca
  const receitasDesteTipo = receitas.filter(
    (receita) => (receita.tipo ?? 'bolo') === tipoReceita
  );
  const receitasFiltradas = receitasDesteTipo.filter((receita) =>
    receita.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    (receita.descricao && receita.descricao.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  const handleMigrarRecheios = async () => {
    if (receitasParaMigrarRecheio.length === 0) return;
    setMigrandoRecheios(true);
    try {
      for (const receita of receitasParaMigrarRecheio) {
        await atualizarReceita(receita.id, { tipo: 'recheio' });
      }
      setMigracaoRecheiosFeita(true);
      alert(`${receitasParaMigrarRecheio.length} receita(s) migrada(s) para Recheios. Elas deixaram de aparecer na aba Bolos.`);
    } catch (err) {
      console.error(err);
      alert('Erro ao migrar. Tente novamente.');
    } finally {
      setMigrandoRecheios(false);
    }
  };

  const labels = LABELS[tipoReceita];

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Submenu Recheios | Bolos | Sobremesas */}
      <div className="flex gap-2 mb-6">
        <NavLink
          to="/receitas/recheios"
          className={({ isActive }) =>
            `px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md' : 'bg-white/80 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border border-rose-200'
            }`
          }
        >
          🥄 Recheios
        </NavLink>
        <NavLink
          to="/receitas/bolos"
          className={({ isActive }) =>
            `px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md' : 'bg-white/80 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border border-rose-200'
            }`
          }
        >
          🍰 Bolos
        </NavLink>
        <NavLink
          to="/receitas/sobremesas"
          className={({ isActive }) =>
            `px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md' : 'bg-white/80 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border border-rose-200'
            }`
          }
        >
          🍨 Sobremesas
        </NavLink>
      </div>

      {/* Aviso de migração: só na aba Recheios, quando existem receitas com "recheio" no nome em outras abas */}
      {tipoReceita === 'recheio' && receitasParaMigrarRecheio.length > 0 && !migracaoRecheiosFeita && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 font-medium mb-2">
            Encontradas <strong>{receitasParaMigrarRecheio.length}</strong> receita(s) com &quot;recheio&quot; no nome na aba Bolos.
          </p>
          <p className="text-xs text-amber-700 mb-3">
            Migrar para Recheios? Elas passarão a aparecer só aqui e sairão da aba Bolos.
          </p>
          <ul className="text-xs text-amber-800 mb-3 list-disc list-inside">
            {receitasParaMigrarRecheio.map((r) => (
              <li key={r.id}>{r.nome}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleMigrarRecheios}
            disabled={migrandoRecheios}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50"
          >
            {migrandoRecheios ? 'Migrando...' : `Migrar ${receitasParaMigrarRecheio.length} para Recheios`}
          </button>
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {labels.titulo}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {labels.subtitulo}
            </p>
          </div>
          {!mostrarForm && (
            <div className="flex items-center gap-3">
              <div className="w-64">
                <input
                  type="text"
                  placeholder={`🔍 Buscar ${labels.titulo.toLowerCase()}...`}
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
                onClick={handleGerarRelatorioTodasReceitas}
                disabled={receitas.length === 0}
                className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-5 py-2.5 rounded-xl hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-200 whitespace-nowrap"
              >
                📄 Gerar relatório
              </button>
              <button
                onClick={() => {
                  setEditandoId(null);
                  reset({
                    ingredientes: [{ ingredienteId: '', quantidade: 0, unidade: 'g' }],
                    recheios: [],
                    margemLucro: 250,
                  });
                  setImagemSelecionada(null);
                  setPreviewImagem(null);
                  setMostrarForm(true);
                }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2.5 rounded-xl hover:from-rose-600 hover:to-pink-600 font-semibold shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all duration-200 whitespace-nowrap"
              >
                + {labels.novo}
              </button>
            </div>
          )}
        </div>
      </div>

      {mostrarForm && (
        <div ref={formRef} className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-8 mb-8 border border-rose-100">
          <h3 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-6">
            {editandoId ? labels.editar : labels.novo}
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
                      const ing = ingredientes.find((i) => i.id === ingredienteId);
                      if (ing) setValue(`ingredientes.${index}.unidade`, ing.unidadeBase, { shouldDirty: true });
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

            {tipoReceita === 'bolo' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recheios / Caldas (opcional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Busque, selecione o recheio e informe o peso. A unidade é preenchida automaticamente. O custo será somado ao custo total.
                </p>
                {receitasRecheio.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200">
                    Nenhum recheio cadastrado. Cadastre em Receitas → Recheios para usar aqui.
                  </p>
                ) : (
                  <>
                    {fieldsRecheios.map((field, index) => (
                      <div key={field.id} className="flex gap-2 mb-2 items-center">
                        <AutocompleteRecheio
                          recheios={receitasRecheio}
                          value={watch(`recheios.${index}.recheioId`) || ''}
                          onChange={(recheioId) => {
                            setValue(`recheios.${index}.recheioId`, recheioId, { shouldDirty: true });
                            const recheio = receitasRecheio.find((r) => r.id === recheioId);
                            if (recheio) setValue(`recheios.${index}.unidade`, recheio.unidadePadrao ?? 'g', { shouldDirty: true });
                          }}
                        />
                        <input
                          type="number"
                          step="0.01"
                          {...register(`recheios.${index}.quantidade`, { min: 0 })}
                          placeholder="Peso"
                          className="w-24 px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                        />
                        <select
                          {...register(`recheios.${index}.unidade`)}
                          className="w-20 px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                        >
                          {unidades.map((unidade) => (
                            <option key={unidade} value={unidade}>{unidade}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeRecheio(index)}
                          className="px-3 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:from-red-500 hover:to-red-600 shadow-sm transition-all"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => appendRecheio({ recheioId: '', quantidade: 0, unidade: 'g' })}
                      className="mt-2 text-sm text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                    >
                      + Adicionar Recheio
                    </button>
                  </>
                )}
              </div>
            )}

            {tipoReceita === 'recheio' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade padrão (ao usar em bolos)
                  </label>
                  <select
                    {...register('unidadePadrao')}
                    className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                  >
                    {unidades.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Será sugerida ao adicionar este recheio em um bolo.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rendimento (gramas)
                  </label>
                  <input
                    type="number"
                    step="1"
                    {...register('rendimentoGramas', { min: 0 })}
                    placeholder="Ex: 1000"
                    className="w-full px-4 py-2.5 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 shadow-sm transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rendimento total da receita em gramas (custo será proporcional ao peso usado).</p>
                </div>
              </div>
            )}

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
        {receitasDesteTipo.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-medium">Nenhum(a) {labels.titulo.toLowerCase().replace(/s$/, '')} cadastrado(a) ainda.</p>
          </div>
        ) : receitasFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-medium">Nenhum resultado encontrado com "{termoBusca}".</p>
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
                  {receitaDetalhes.recheios?.length ? (
                    <div className="mt-4 w-full">
                      <p className="text-sm font-semibold text-rose-600 mb-2">
                        Recheios / Caldas:
                      </p>
                      <div className="bg-rose-50 rounded-lg p-3 border border-rose-100 space-y-2">
                        {receitaDetalhes.recheios.map((item, idx) => {
                          const recheio = receitas.find((r) => r.id === item.recheioId);
                          return recheio ? (
                            <div key={idx} className="text-sm text-gray-700 flex justify-between items-center">
                              <span className="font-medium text-rose-700">{recheio.nome}</span>
                              <span className="text-gray-600">{item.quantidade} {item.unidade}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Footer com Botões de Ação */}
            <div className="border-t border-rose-200 p-4 bg-rose-50 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  handleEdit(receitaDetalhes);
                  setReceitaDetalhes(null);
                }}
                className="flex-1 min-w-[100px] bg-gradient-to-r from-rose-500 to-pink-500 text-white py-2.5 rounded-xl hover:from-rose-600 hover:to-pink-600 font-semibold shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-200"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  handleAbrirHistorico(receitaDetalhes);
                  setReceitaDetalhes(null);
                }}
                className="flex-1 min-w-[100px] bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl hover:from-purple-600 hover:to-pink-600 font-semibold shadow-md shadow-purple-200/50 hover:shadow-lg transition-all duration-200"
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
                className="flex-1 min-w-[100px] bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 rounded-xl hover:from-red-600 hover:to-red-700 font-semibold shadow-md shadow-red-200/50 hover:shadow-lg transition-all duration-200"
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

