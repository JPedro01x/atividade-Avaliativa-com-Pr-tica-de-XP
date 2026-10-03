import { StockItem, StockMovement, Cm2AnalysisResult, AlertPriority } from '../types/stock.types.js';

/**
 * SERVIÇO DE GESTÃO DE ESTOQUE E ALMOXARIFADO (CLEAN ARCHITECTURE - DOMAIN SERVICE)
 * 
 * Responsável pelas regras de negócio de movimentação de insumos,
 * cálculo automatizado de consumo por metro quadrado (Cm²) e inteligência
 * de precificação com Bônus de Eficiência e Alertas Críticos de Desvio.
 */
export class StockService {
  private items: Map<string, StockItem> = new Map();
  private movements: StockMovement[] = [];

  constructor(initialItems: StockItem[] = []) {
    initialItems.forEach((item) => this.items.set(item.sku, { ...item }));
  }

  /**
   * Obtém o insumo por SKU
   */
  public getItem(sku: string): StockItem | undefined {
    return this.items.get(sku);
  }

  /**
   * Registra movimentação física de entrada ou saída no almoxarifado.
   * Aplica a Regra de Negócio RN-03 (Bloqueio de Saída sem Saldo).
   */
  public registerMovement(movement: StockMovement): StockItem {
    const item = this.getOrThrowItem(movement.sku);

    if (movement.type === 'SAIDA') {
      this.validateStockAvailability(item, movement.quantity);
      item.quantity -= movement.quantity;
    } else {
      item.quantity += movement.quantity;
    }

    this.movements.push(movement);
    return { ...item };
  }

  /**
   * Realiza a análise de inteligência de consumo Cm², verifica alertas de estoque
   * e calcula bônus de eficiência de reposição.
   * [RF-12 Modificado - Versão Refatorada]
   */
  public analyzeCm2AndStock(sku: string, targetCm2: number): Cm2AnalysisResult {
    const item = this.getOrThrowItem(sku);
    const { totalConsumed, totalAreaM2, currentCm2, deviationPercent } = this.calculateCm2Metrics(sku, targetCm2);

    const { alertPriority, suggestedReorderQuantity } = this.determineAlertAndReorder(item, deviationPercent);
    const { appliedEfficiencyBonusPercent, unitPriceWithBonus } = this.calculateEfficiencyBonus(item.unitPrice, deviationPercent);

    return {
      sku: item.sku,
      totalQuantityConsumed: totalConsumed,
      executedAreaM2: totalAreaM2,
      currentCm2: this.roundTwoDecimals(currentCm2),
      targetCm2,
      cm2DeviationPercent: this.roundTwoDecimals(deviationPercent),
      alertPriority,
      suggestedReorderQuantity,
      appliedEfficiencyBonusPercent,
      unitPriceWithBonus: this.roundTwoDecimals(unitPriceWithBonus)
    };
  }

  /* ========================================================================= */
  /* MÉTODOS PRIVADOS REFATORADOS (HELPER METHODS)                            */
  /* ========================================================================= */

  private getOrThrowItem(sku: string): StockItem {
    const item = this.items.get(sku);
    if (!item) {
      throw new Error(`Insumo com SKU ${sku} não foi encontrado.`);
    }
    return item;
  }

  private validateStockAvailability(item: StockItem, requestedQuantity: number): void {
    if (item.quantity < requestedQuantity) {
      throw new Error(`Saldo insuficiente no almoxarifado para o SKU ${item.sku}. Disponível: ${item.quantity}`);
    }
  }

  private calculateCm2Metrics(sku: string, targetCm2: number) {
    const itemMovements = this.movements.filter((m) => m.sku === sku && m.type === 'SAIDA');
    const totalConsumed = itemMovements.reduce((acc, m) => acc + m.quantity, 0);
    const totalAreaM2 = itemMovements.reduce((acc, m) => acc + m.executedAreaM2, 0);

    const currentCm2 = totalAreaM2 > 0 ? totalConsumed / totalAreaM2 : 0;
    const deviationPercent = targetCm2 > 0 ? ((currentCm2 - targetCm2) / targetCm2) * 100 : 0;

    return { totalConsumed, totalAreaM2, currentCm2, deviationPercent };
  }

  private determineAlertAndReorder(item: StockItem, deviationPercent: number) {
    const isLowStock = item.quantity <= item.minStock;
    if (!isLowStock) {
      return { alertPriority: 'NORMAL' as AlertPriority, suggestedReorderQuantity: 0 };
    }

    const baseReorder = item.minStock * 2 - item.quantity;
    const isCriticalDeviation = deviationPercent > 15;

    if (isCriticalDeviation) {
      return {
        alertPriority: 'CRITICA_DESVIO_ORCAMENTARIO' as AlertPriority,
        suggestedReorderQuantity: Math.round(baseReorder * 1.2) // Adiciona 20% de margem de segurança
      };
    }

    return {
      alertPriority: 'ALERTA_ESTOQUE_MINIMO' as AlertPriority,
      suggestedReorderQuantity: Math.max(0, baseReorder)
    };
  }

  private calculateEfficiencyBonus(unitPrice: number, deviationPercent: number) {
    const isHighlyEfficient = deviationPercent < -10;
    if (isHighlyEfficient) {
      return {
        appliedEfficiencyBonusPercent: 5,
        unitPriceWithBonus: unitPrice * 0.95
      };
    }

    return {
      appliedEfficiencyBonusPercent: 0,
      unitPriceWithBonus: unitPrice
    };
  }

  private roundTwoDecimals(val: number): number {
    return Math.round(val * 100) / 100;
  }
}
