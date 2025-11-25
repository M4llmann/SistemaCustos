import { Ingrediente, UnidadeMedida } from '../types';

/**
 * Calcula o preço por unidade base de um ingrediente
 */
export function calcularPrecoPorUnidade(
  precoTotal: number,
  medidaTotal: number,
  _unidadeBase: UnidadeMedida
): number {
  if (medidaTotal <= 0) return 0;
  return precoTotal / medidaTotal;
}

/**
 * Converte quantidade de uma unidade para outra
 */
export function converterUnidade(
  quantidade: number,
  de: UnidadeMedida,
  para: UnidadeMedida
): number {
  // Se for a mesma unidade, retorna o valor
  if (de === para) return quantidade;

  // Conversões de peso
  if (de === 'kg' && para === 'g') return quantidade * 1000;
  if (de === 'g' && para === 'kg') return quantidade / 1000;

  // Conversões de volume
  if (de === 'L' && para === 'ml') return quantidade * 1000;
  if (de === 'ml' && para === 'L') return quantidade / 1000;

  // Se não for possível converter (ex: g para ml), retorna o valor original
  // Em produção, você pode querer lançar um erro ou tratar melhor
  return quantidade;
}

/**
 * Calcula o custo de um ingrediente em uma receita
 */
export function calcularCustoIngrediente(
  ingrediente: Ingrediente,
  quantidadeUsada: number,
  unidadeUsada: UnidadeMedida
): number {
  // Converte a quantidade usada para a unidade base do ingrediente
  const quantidadeNaUnidadeBase = converterUnidade(
    quantidadeUsada,
    unidadeUsada,
    ingrediente.unidadeBase
  );

  // Multiplica pelo preço por unidade
  return quantidadeNaUnidadeBase * ingrediente.precoPorUnidade;
}

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

