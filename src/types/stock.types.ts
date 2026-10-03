export type StockItemCategory = 'ESTRUTURA' | 'FUNDACAO' | 'ACABAMENTO' | 'INSTALACOES' | 'SEGURANCA';

export type AlertPriority = 'NORMAL' | 'ALERTA_ESTOQUE_MINIMO' | 'CRITICA_DESVIO_ORCAMENTARIO';

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: StockItemCategory;
  quantity: number;
  minStock: number;
  unit: string;
  unitPrice: number;
}

export interface StockMovement {
  id: string;
  sku: string;
  type: 'ENTRADA' | 'SAIDA';
  quantity: number;
  executedAreaM2: number; // Área executada no canteiro em m²
  timestamp: string;
}

export interface Cm2AnalysisResult {
  sku: string;
  totalQuantityConsumed: number;
  executedAreaM2: number;
  currentCm2: number; // Consumo real por m²
  targetCm2: number;  // Meta orçada de consumo por m²
  cm2DeviationPercent: number; // Percentual de desvio em relação à meta
  alertPriority: AlertPriority;
  suggestedReorderQuantity: number;
  appliedEfficiencyBonusPercent: number; // Bônus de desconto virtual (ex: 5%)
  unitPriceWithBonus: number;
}
