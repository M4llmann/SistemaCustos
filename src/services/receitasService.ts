import { Receita, Ingrediente } from '../types';
import { calcularCustoIngrediente } from '../utils/calculos';

/**
 * Calcula o custo total de uma receita
 */
export function calcularCustoReceita(
  receita: Receita,
  ingredientes: Ingrediente[]
): number {
  let custoTotal = 0;

  receita.ingredientes.forEach((ingReceita) => {
    const ingrediente = ingredientes.find(
      (ing) => ing.id === ingReceita.ingredienteId
    );

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
}

/**
 * Calcula o custo por porção de uma receita
 */
export function calcularCustoPorPorcao(
  custoTotal: number,
  porcoes: number
): number {
  if (porcoes <= 0) return custoTotal;
  return custoTotal / porcoes;
}

