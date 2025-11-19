export type UnidadeMedida = 'g' | 'kg' | 'ml' | 'L' | 'un';

export interface Ingrediente {
  id: string;
  nome: string;
  precoTotal: number;
  medidaTotal: number;
  unidadeBase: UnidadeMedida;
  precoPorUnidade: number; // Calculado automaticamente
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IngredienteReceita {
  ingredienteId: string;
  quantidade: number;
  unidade: UnidadeMedida;
}

export interface Receita {
  id: string;
  nome: string;
  ingredientes: IngredienteReceita[];
  descricao?: string;
  custoTotal: number; // Calculado automaticamente
  custoPorPorcao?: number; // Opcional
  porcoes?: number; // Número de porções (opcional)
  imagemUrl?: string; // URL da imagem da receita
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

