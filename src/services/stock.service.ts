import { StockItem, StockMovement, Cm2AnalysisResult, AlertPriority } from '../types/stock.types.js';

export class StockService {
  private items: Map<string, StockItem> = new Map();
  private movements: StockMovement[] = [];

  constructor(initialItems: StockItem[] = []) {
    initialItems.forEach((item) => this.items.set(item.sku, { ...item }));
  }

  public getItem(sku: string): StockItem | undefined {
    return this.items.get(sku);
  }

  public registerMovement(movement: StockMovement): StockItem {
    const item = this.items.get(movement.sku);
    if (!item) {
      throw new Error(`Insumo com SKU ${movement.sku} não foi encontrado.`);
    }

    if (movement.type === 'SAIDA') {
      if (item.quantity < movement.quantity) {
        throw new Error(`Saldo insuficiente no almoxarifado para o SKU ${movement.sku}. Disponível: ${item.quantity}`);
      }
      item.quantity -= movement.quantity;
    } else {
      item.quantity += movement.quantity;
    }

    this.movements.push(movement);
    return { ...item };
  }

  /**
   * Avalia o consumo por m² (Cm²) e o saldo em estoque para um dado SKU.
   * [Versão Inicial - Requisito Original RF-12]
   */
  public analyzeCm2AndStock(sku: string, targetCm2: number): Cm2AnalysisResult {
    const item = this.items.get(sku);
    if (!item) {
      throw new Error(`Insumo com SKU ${sku} não foi encontrado.`);
    }

    const itemMovements = this.movements.filter((m) => m.sku === sku && m.type === 'SAIDA');
    const totalConsumed = itemMovements.reduce((acc, m) => acc + m.quantity, 0);
    const totalAreaM2 = itemMovements.reduce((acc, m) => acc + m.executedAreaM2, 0);

    const currentCm2 = totalAreaM2 > 0 ? totalConsumed / totalAreaM2 : 0;
    const deviationPercent = targetCm2 > 0 ? ((currentCm2 - targetCm2) / targetCm2) * 100 : 0;

    // Regra Original: Alerta padrão de Estoque Mínimo
    let alertPriority: AlertPriority = 'NORMAL';
    if (item.quantity <= item.minStock) {
      alertPriority = 'ALERTA_ESTOQUE_MINIMO';
    }

    const suggestedReorder = item.quantity <= item.minStock ? item.minStock * 2 - item.quantity : 0;

    return {
      sku: item.sku,
      totalQuantityConsumed: totalConsumed,
      executedAreaM2: totalAreaM2,
      currentCm2: Math.round(currentCm2 * 100) / 100,
      targetCm2,
      cm2DeviationPercent: Math.round(deviationPercent * 100) / 100,
      alertPriority,
      suggestedReorderQuantity: Math.max(0, suggestedReorder),
      appliedEfficiencyBonusPercent: 0, // Ainda não implementado no requisito original
      unitPriceWithBonus: item.unitPrice
    };
  }
}
