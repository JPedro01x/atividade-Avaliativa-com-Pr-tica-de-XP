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
   * Avalia o consumo por m² (Cm²), o saldo em estoque e calcula bônus/alertas críticos.
   * [Implementação do Requisito Alterado - RF-12 Modificado]
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

    let alertPriority: AlertPriority = 'NORMAL';
    let baseReorder = 0;
    let suggestedReorderQuantity = 0;

    const isLowStock = item.quantity <= item.minStock;
    if (isLowStock) {
      baseReorder = item.minStock * 2 - item.quantity;
      if (deviationPercent > 15) {
        alertPriority = 'CRITICA_DESVIO_ORCAMENTARIO';
        suggestedReorderQuantity = Math.round(baseReorder * 1.2); // Margem de 20%
      } else {
        alertPriority = 'ALERTA_ESTOQUE_MINIMO';
        suggestedReorderQuantity = baseReorder;
      }
    }

    let appliedEfficiencyBonusPercent = 0;
    let unitPriceWithBonus = item.unitPrice;

    if (deviationPercent < -10) {
      appliedEfficiencyBonusPercent = 5;
      unitPriceWithBonus = item.unitPrice * 0.95;
    }

    return {
      sku: item.sku,
      totalQuantityConsumed: totalConsumed,
      executedAreaM2: totalAreaM2,
      currentCm2: Math.round(currentCm2 * 100) / 100,
      targetCm2,
      cm2DeviationPercent: Math.round(deviationPercent * 100) / 100,
      alertPriority,
      suggestedReorderQuantity: Math.max(0, suggestedReorderQuantity),
      appliedEfficiencyBonusPercent,
      unitPriceWithBonus
    };
  }
}
