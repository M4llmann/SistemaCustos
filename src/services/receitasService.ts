import { Receita, Ingrediente, RecheioReceita, UnidadeMedida } from '../types';
import { calcularCustoIngrediente, converterUnidade } from '../utils/calculos';

/**
 * Calcula o custo total só dos ingredientes da receita
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
 * Custo dos recheios (lista com peso) a partir da lista de receitas.
 * Se o recheio tiver rendimentoGramas, custo é proporcional ao peso; senão usa custo total.
 */
export function calcularCustoRecheios(
  recheios: RecheioReceita[] | undefined,
  receitas: Receita[]
): number {
  if (!recheios?.length) return 0;
  let total = 0;
  recheios.forEach((item) => {
    const recheio = receitas.find((r) => r.id === item.recheioId);
    if (!recheio) return;
    if (item.unidade === 'un') {
      total += recheio.custoTotal * item.quantidade;
      return;
    }
    const qtyG = converterUnidade(item.quantidade, item.unidade, 'g');
    if (recheio.rendimentoGramas && recheio.rendimentoGramas > 0) {
      total += (qtyG / recheio.rendimentoGramas) * recheio.custoTotal;
    } else {
      total += recheio.custoTotal;
    }
  });
  return total;
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

