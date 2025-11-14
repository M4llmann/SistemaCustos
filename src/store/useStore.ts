import { create } from 'zustand';
import { Ingrediente, Receita } from '../types';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot,
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
        receitas.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Receita);
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

      await addDoc(collection(db, 'ingredientes'), novoIngrediente);
      await get().carregarIngredientes();
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

      // Recarrega ingredientes e depois recalcula receitas
      await get().carregarIngredientes();
      // Recalcula todas as receitas que usam este ingrediente
      // Usa get() novamente para pegar os ingredientes atualizados
      await get().recalculcarReceitasComIngrediente(id);
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
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

      await addDoc(collection(db, 'receitas'), novaReceita);
      await get().carregarReceitas();
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

      await updateDoc(receitaRef, {
        ...dados,
        custoTotal,
        updatedAt: Timestamp.now(),
      });

      await get().carregarReceitas();
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
    const { receitas, ingredientes } = get();
    const receitasParaAtualizar = receitas.filter((r) =>
      r.ingredientes.some((ing) => ing.ingredienteId === ingredienteId)
    );

    for (const receita of receitasParaAtualizar) {
      const receitaRef = doc(db, 'receitas', receita.id);
      const custoTotal = calcularCustoReceita(receita, ingredientes);

      await updateDoc(receitaRef, {
        custoTotal,
        updatedAt: Timestamp.now(),
      });
    }

    await get().carregarReceitas();
  },
}));

