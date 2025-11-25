import { create } from 'zustand';
import { Ingrediente, Receita, HistoricoIngrediente, HistoricoReceita } from '../types';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { calcularPrecoPorUnidade } from '../utils/calculos';
import { calcularCustoReceita } from '../services/receitasService';

interface StoreState {
  ingredientes: Ingrediente[];
  receitas: Receita[];
  userId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setUserId: (userId: string | null) => void;
  carregarIngredientes: () => Promise<void>;
  carregarReceitas: () => Promise<void>;
  adicionarIngrediente: (ingrediente: Omit<Ingrediente, 'id' | 'precoPorUnidade' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  atualizarIngrediente: (id: string, dados: Partial<Ingrediente>) => Promise<void>;
  deletarIngrediente: (id: string) => Promise<void>;
  adicionarReceita: (receita: Omit<Receita, 'id' | 'custoTotal' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  atualizarReceita: (id: string, dados: Partial<Receita>) => Promise<void>;
  deletarReceita: (id: string) => Promise<void>;
  recalculcarReceitasComIngrediente: (ingredienteId: string) => Promise<void>;
  salvarHistoricoIngrediente: (ingredienteId: string, ingrediente: Ingrediente) => Promise<void>;
  buscarHistoricoIngrediente: (ingredienteId: string) => Promise<HistoricoIngrediente[]>;
  salvarHistoricoReceita: (receitaId: string, receita: Receita) => Promise<void>;
  buscarHistoricoReceita: (receitaId: string) => Promise<HistoricoReceita[]>;
}

export const useStore = create<StoreState>((set, get) => ({
  ingredientes: [],
  receitas: [],
  userId: null,
  loading: false,
  error: null,

  setUserId: (userId) => {
    set({ userId });
    if (userId) {
      get().carregarIngredientes();
      get().carregarReceitas();
    }
  },

  carregarIngredientes: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'ingredientes'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const ingredientes: Ingrediente[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ingredientes.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Ingrediente);
      });

      set({ ingredientes, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  carregarReceitas: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'receitas'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const receitas: Receita[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Migração: converte observacoes antigas para descricao
        const receitaData: any = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        // Se tem observacoes antigas mas não tem descricao, migra
        if (data.observacoes && !data.descricao) {
          receitaData.descricao = data.observacoes;
          delete receitaData.observacoes;
        }
        
        receitas.push(receitaData as Receita);
      });

      // Recalcula custos das receitas
      const ingredientes = get().ingredientes;
      const receitasComCusto = receitas.map((receita) => {
        const custoTotal = calcularCustoReceita(receita, ingredientes);
        return { ...receita, custoTotal };
      });

      set({ receitas: receitasComCusto, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  adicionarIngrediente: async (dados) => {
    const { userId } = get();
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const precoPorUnidade = calcularPrecoPorUnidade(
        dados.precoTotal,
        dados.medidaTotal,
        dados.unidadeBase
      );

      const novoIngrediente = {
        ...dados,
        precoPorUnidade,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'ingredientes'), novoIngrediente);
      await get().carregarIngredientes();
      
      // Salva histórico inicial do ingrediente
      const ingredienteSalvo = get().ingredientes.find((i) => i.id === docRef.id);
      if (ingredienteSalvo) {
        try {
          await get().salvarHistoricoIngrediente(docRef.id, ingredienteSalvo);
          console.log('Histórico inicial salvo para ingrediente:', ingredienteSalvo.nome);
        } catch (historicoError) {
          console.error('Erro ao salvar histórico inicial:', historicoError);
          // Não bloqueia a criação do ingrediente se o histórico falhar
        }
      }
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  atualizarIngrediente: async (id, dados) => {
    set({ loading: true, error: null });
    try {
      const ingredienteRef = doc(db, 'ingredientes', id);
      const ingredienteAtual = get().ingredientes.find((i) => i.id === id);

      if (!ingredienteAtual) throw new Error('Ingrediente não encontrado');

      const precoTotal = dados.precoTotal ?? ingredienteAtual.precoTotal;
      const medidaTotal = dados.medidaTotal ?? ingredienteAtual.medidaTotal;
      const unidadeBase = dados.unidadeBase ?? ingredienteAtual.unidadeBase;

      // Verifica se o preço ou medida mudou antes de atualizar
      const precoAtualNum = Number(ingredienteAtual.precoTotal);
      const precoNovoNum = dados.precoTotal !== undefined ? Number(dados.precoTotal) : precoAtualNum;
      const medidaAtualNum = Number(ingredienteAtual.medidaTotal);
      const medidaNovaNum = dados.medidaTotal !== undefined ? Number(dados.medidaTotal) : medidaAtualNum;
      
      // Verifica mudança considerando que dados pode ter precoTotal mesmo que seja o mesmo valor
      const precoMudou = dados.precoTotal !== undefined && 
                        Math.abs(precoNovoNum - precoAtualNum) > 0.0001;
      const medidaMudou = dados.medidaTotal !== undefined && 
                          Math.abs(medidaNovaNum - medidaAtualNum) > 0.0001;
      const deveSalvarHistorico = precoMudou || medidaMudou;
      
      console.log('Verificação de mudança:', {
        precoAtual: precoAtualNum,
        precoNovo: precoNovoNum,
        precoMudou,
        medidaAtual: medidaAtualNum,
        medidaNova: medidaNovaNum,
        medidaMudou,
        deveSalvarHistorico,
        dadosRecebidos: dados
      });

      const precoPorUnidade = calcularPrecoPorUnidade(
        precoTotal,
        medidaTotal,
        unidadeBase
      );

      await updateDoc(ingredienteRef, {
        ...dados,
        precoPorUnidade,
        updatedAt: Timestamp.now(),
      });

      // Recarrega ingredientes primeiro para garantir dados atualizados
      await get().carregarIngredientes();
      
      // Aguarda um momento para garantir que o estado foi atualizado
      // e então recalcula todas as receitas que usam este ingrediente
      await get().recalculcarReceitasComIngrediente(id);
      
      // Salva histórico se o preço ou medida mudou (depois de recarregar)
      if (deveSalvarHistorico) {
        const ingredienteAtualizado = get().ingredientes.find((i) => i.id === id);
        if (ingredienteAtualizado) {
          try {
            console.log('Tentando salvar histórico para:', ingredienteAtualizado.nome);
            await get().salvarHistoricoIngrediente(id, ingredienteAtualizado);
            console.log('✅ Histórico salvo com sucesso para:', ingredienteAtualizado.nome);
          } catch (historicoError: any) {
            console.error('❌ Erro ao salvar histórico:', historicoError);
            console.error('Detalhes do erro:', {
              code: historicoError?.code,
              message: historicoError?.message,
              stack: historicoError?.stack
            });
            // Não bloqueia a atualização se o histórico falhar
          }
        } else {
          console.error('Ingrediente atualizado não encontrado após recarregar');
        }
      } else {
        console.log('ℹ️ Histórico não salvo - preço/medida não mudou significativamente', {
          precoAtual: ingredienteAtual.precoTotal,
          precoNovo: dados.precoTotal,
          medidaAtual: ingredienteAtual.medidaTotal,
          medidaNova: dados.medidaTotal,
        });
      }
      
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deletarIngrediente: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'ingredientes', id));
      await get().carregarIngredientes();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  adicionarReceita: async (dados) => {
    const { userId } = get();
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const ingredientes = get().ingredientes;
      const custoTotal = calcularCustoReceita(
        { ...dados, id: '', custoTotal: 0, userId: '', createdAt: new Date(), updatedAt: new Date() },
        ingredientes
      );

      const novaReceita = {
        ...dados,
        custoTotal,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'receitas'), novaReceita);
      await get().carregarReceitas();
      
      // Salva histórico inicial da receita
      const receitaSalva = get().receitas.find((r) => r.id === docRef.id);
      if (receitaSalva) {
        await get().salvarHistoricoReceita(docRef.id, receitaSalva);
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  atualizarReceita: async (id, dados) => {
    set({ loading: true, error: null });
    try {
      const receitaRef = doc(db, 'receitas', id);
      const ingredientes = get().ingredientes;
      const receitaAtual = get().receitas.find((r) => r.id === id);

      if (!receitaAtual) throw new Error('Receita não encontrada');

      const receitaAtualizada = { ...receitaAtual, ...dados };
      const custoTotal = calcularCustoReceita(receitaAtualizada, ingredientes);

      // Prepara dados para atualização, removendo observacoes antigas se existir
      const dadosAtualizacao: any = {
        ...dados,
        custoTotal,
        updatedAt: Timestamp.now(),
      };
      
      // Remove campo observacoes antigo se estiver presente
      if ('observacoes' in dadosAtualizacao) {
        delete dadosAtualizacao.observacoes;
      }

      await updateDoc(receitaRef, dadosAtualizacao);

      // Salva histórico quando receita é atualizada
      await get().carregarReceitas();
      const receitaAtualizadaCompleta = get().receitas.find((r) => r.id === id);
      if (receitaAtualizadaCompleta) {
        await get().salvarHistoricoReceita(id, receitaAtualizadaCompleta);
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deletarReceita: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'receitas', id));
      await get().carregarReceitas();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  recalculcarReceitasComIngrediente: async (ingredienteId) => {
    // Busca os dados mais recentes do estado
    const { receitas } = get();
    const ingredientesAtualizados = get().ingredientes;
    
    // Encontra todas as receitas que usam este ingrediente
    const receitasParaAtualizar = receitas.filter((r) =>
      r.ingredientes.some((ing) => ing.ingredienteId === ingredienteId)
    );

    if (receitasParaAtualizar.length === 0) {
      // Se não há receitas para atualizar, apenas recarrega para garantir sincronização
      await get().carregarReceitas();
      return;
    }

    // Atualiza cada receita no Firestore com os ingredientes mais recentes
    const promises = receitasParaAtualizar.map(async (receita) => {
      const receitaRef = doc(db, 'receitas', receita.id);
      // Recalcula o custo usando os ingredientes atualizados
      const custoTotal = calcularCustoReceita(receita, ingredientesAtualizados);

      await updateDoc(receitaRef, {
        custoTotal,
        updatedAt: Timestamp.now(),
      });
    });

    // Executa todas as atualizações em paralelo para melhor performance
    await Promise.all(promises);

    // Recarrega as receitas para atualizar o estado local com os novos custos
    await get().carregarReceitas();
  },

  salvarHistoricoIngrediente: async (ingredienteId, ingrediente) => {
    const { userId } = get();
    if (!userId) {
      console.error('❌ userId não encontrado ao salvar histórico');
      return;
    }

    try {
      // Verifica se o ingrediente pertence ao usuário antes de salvar histórico
      const ingredienteRef = doc(db, 'ingredientes', ingredienteId);
      const ingredienteDoc = await getDoc(ingredienteRef);
      
      if (!ingredienteDoc.exists()) {
        console.error('❌ Ingrediente não existe:', ingredienteId);
        throw new Error('Ingrediente não encontrado');
      }
      
      const ingredienteData = ingredienteDoc.data();
      if (ingredienteData?.userId !== userId) {
        console.error('❌ Ingrediente não pertence ao usuário:', {
          ingredienteUserId: ingredienteData?.userId,
          currentUserId: userId
        });
        throw new Error('Ingrediente não pertence ao usuário');
      }
      
      console.log('✅ Ingrediente verificado, pode salvar histórico');
      
      const historicoRef = collection(db, 'ingredientes', ingredienteId, 'historico');
      const dadosHistorico = {
        nome: ingrediente.nome,
        precoTotal: ingrediente.precoTotal,
        medidaTotal: ingrediente.medidaTotal,
        unidadeBase: ingrediente.unidadeBase,
        precoPorUnidade: ingrediente.precoPorUnidade,
        data: Timestamp.now(),
        userId,
      };
      console.log('💾 Salvando histórico do ingrediente:', ingredienteId, dadosHistorico);
      await addDoc(historicoRef, dadosHistorico);
      console.log('✅ Histórico salvo com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar histórico do ingrediente:', error);
      throw error;
    }
  },

  buscarHistoricoIngrediente: async (ingredienteId) => {
    const { userId } = get();
    if (!userId) {
      console.error('❌ userId não encontrado ao buscar histórico');
      return [];
    }

    try {
      // Primeiro verifica se o ingrediente existe e pertence ao usuário
      const ingredienteRef = doc(db, 'ingredientes', ingredienteId);
      const ingredienteDoc = await getDoc(ingredienteRef);
      
      if (!ingredienteDoc.exists()) {
        console.error('❌ Ingrediente não existe:', ingredienteId);
        return [];
      }
      
      const ingredienteData = ingredienteDoc.data();
      if (ingredienteData?.userId !== userId) {
        console.error('❌ Ingrediente não pertence ao usuário:', {
          ingredienteUserId: ingredienteData?.userId,
          currentUserId: userId
        });
        return [];
      }
      
      console.log('✅ Ingrediente verificado, pertence ao usuário');
      
      const historicoRef = collection(db, 'ingredientes', ingredienteId, 'historico');
      console.log('🔍 Buscando histórico em:', `ingredientes/${ingredienteId}/historico`);
      console.log('👤 userId:', userId);
      
      // Busca sem orderBy para evitar problemas com regras do Firestore
      // O orderBy pode causar problemas na avaliação das regras de segurança
      const q = query(historicoRef, where('userId', '==', userId));
      console.log('📋 Query criada sem orderBy');
      
      const querySnapshot = await getDocs(q);
      console.log('📄 Documentos encontrados:', querySnapshot.size);
      
      if (querySnapshot.empty) {
        console.log('ℹ️ Nenhum documento encontrado na subcoleção historico - histórico vazio');
      }
      
      const historico: HistoricoIngrediente[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log('📝 Processando documento histórico:', docSnap.id, data);
        historico.push({
          id: docSnap.id,
          ...data,
          data: data.data?.toDate() || new Date(),
        } as HistoricoIngrediente);
      });

      // Ordena manualmente se não usou orderBy
      historico.sort((a, b) => b.data.getTime() - a.data.getTime());

      console.log('✅ Histórico processado:', historico.length, 'itens');
      return historico;
    } catch (error: any) {
      console.error('❌ Erro ao buscar histórico do ingrediente:', error);
      console.error('Detalhes:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack
      });
      if (error.code === 'failed-precondition') {
        console.error('⚠️ Índice necessário no Firestore. Crie um índice composto para: ingredientes/{ingredienteId}/historico com campos: userId (Ascending) e data (Descending)');
      } else if (error.code === 'permission-denied') {
        console.error('⚠️ Permissão negada. Verifique as regras do Firestore para a subcoleção historico');
      }
      return [];
    }
  },

  salvarHistoricoReceita: async (receitaId, receita) => {
    const { userId } = get();
    if (!userId) {
      console.error('❌ userId não encontrado ao salvar histórico');
      return;
    }

    try {
      // Verifica se a receita pertence ao usuário antes de salvar histórico
      const receitaRef = doc(db, 'receitas', receitaId);
      const receitaDoc = await getDoc(receitaRef);
      
      if (!receitaDoc.exists()) {
        console.error('❌ Receita não existe:', receitaId);
        throw new Error('Receita não encontrada');
      }
      
      const receitaData = receitaDoc.data();
      if (receitaData?.userId !== userId) {
        console.error('❌ Receita não pertence ao usuário:', {
          receitaUserId: receitaData?.userId,
          currentUserId: userId
        });
        throw new Error('Receita não pertence ao usuário');
      }
      
      console.log('✅ Receita verificada, pode salvar histórico');
      
      const historicoRef = collection(db, 'receitas', receitaId, 'historico');
      const precoSugerido = receita.custoTotal * ((receita.margemLucro || 250) / 100);
      
      const dadosHistorico = {
        nome: receita.nome,
        custoTotal: receita.custoTotal,
        precoSugerido,
        margemLucro: receita.margemLucro || 250,
        data: Timestamp.now(),
        userId,
      };
      console.log('💾 Salvando histórico da receita:', receitaId, dadosHistorico);
      await addDoc(historicoRef, dadosHistorico);
      console.log('✅ Histórico salvo com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar histórico da receita:', error);
      throw error;
    }
  },

  buscarHistoricoReceita: async (receitaId) => {
    const { userId } = get();
    if (!userId) {
      console.error('❌ userId não encontrado ao buscar histórico');
      return [];
    }

    try {
      // Primeiro verifica se a receita existe e pertence ao usuário
      const receitaRef = doc(db, 'receitas', receitaId);
      const receitaDoc = await getDoc(receitaRef);
      
      if (!receitaDoc.exists()) {
        console.error('❌ Receita não existe:', receitaId);
        return [];
      }
      
      const receitaData = receitaDoc.data();
      if (receitaData?.userId !== userId) {
        console.error('❌ Receita não pertence ao usuário:', {
          receitaUserId: receitaData?.userId,
          currentUserId: userId
        });
        return [];
      }
      
      console.log('✅ Receita verificada, pertence ao usuário');
      
      const historicoRef = collection(db, 'receitas', receitaId, 'historico');
      console.log('🔍 Buscando histórico em:', `receitas/${receitaId}/historico`);
      console.log('👤 userId:', userId);
      
      // Busca sem orderBy para evitar problemas com regras do Firestore
      // O orderBy pode causar problemas na avaliação das regras de segurança
      const q = query(historicoRef, where('userId', '==', userId));
      console.log('📋 Query criada sem orderBy');
      
      const querySnapshot = await getDocs(q);
      console.log('📄 Documentos encontrados:', querySnapshot.size);
      
      if (querySnapshot.empty) {
        console.log('ℹ️ Nenhum documento encontrado na subcoleção historico - histórico vazio');
      }
      
      const historico: HistoricoReceita[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log('📝 Processando documento histórico:', docSnap.id, data);
        historico.push({
          id: docSnap.id,
          ...data,
          data: data.data?.toDate() || new Date(),
        } as HistoricoReceita);
      });

      // Ordena manualmente se não usou orderBy
      historico.sort((a, b) => b.data.getTime() - a.data.getTime());

      console.log('✅ Histórico processado:', historico.length, 'itens');
      return historico;
    } catch (error: any) {
      console.error('❌ Erro ao buscar histórico da receita:', error);
      console.error('Detalhes:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack
      });
      if (error.code === 'failed-precondition') {
        console.error('⚠️ Índice necessário no Firestore. Crie um índice composto para: receitas/{receitaId}/historico com campos: userId (Ascending) e data (Descending)');
      } else if (error.code === 'permission-denied') {
        console.error('⚠️ Permissão negada. Verifique as regras do Firestore para a subcoleção historico');
      }
      return [];
    }
  },
}));

