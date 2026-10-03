import { describe, it, expect, beforeEach } from 'vitest';
import { StockService } from '../src/services/stock.service.js';
import { StockItem } from '../src/types/stock.types.js';

describe('StockService - Testes de Gestão de Almoxarifado e Cm²', () => {
  let stockService: StockService;

  const initialItems: StockItem[] = [
    {
      id: 'SKU-001',
      sku: 'CONC-30MPA',
      name: 'Concreto Usinado Fck 30MPa',
      category: 'ESTRUTURA',
      quantity: 100,
      minStock: 20,
      unit: 'm³',
      unitPrice: 450.0
    },
    {
      id: 'SKU-002',
      sku: 'ACO-CA50-10',
      name: 'Vergalhão de Aço CA-50 10mm',
      category: 'ESTRUTURA',
      quantity: 50,
      minStock: 30,
      unit: 'kg',
      unitPrice: 12.5
    }
  ];

  beforeEach(() => {
    stockService = new StockService(initialItems);
  });

  describe('Funcionalidades Originais do RF-12', () => {
    it('deve dar baixa no estoque corretamente ao registrar saída', () => {
      stockService.registerMovement({
        id: 'MOV-1',
        sku: 'CONC-30MPA',
        type: 'SAIDA',
        quantity: 30,
        executedAreaM2: 100,
        timestamp: '2026-10-03T10:00:00Z'
      });

      const item = stockService.getItem('CONC-30MPA');
      expect(item?.quantity).toBe(70);
    });

    it('deve lançar erro ao tentar retirar quantidade maior do que o saldo disponível (RN-03)', () => {
      expect(() => {
        stockService.registerMovement({
          id: 'MOV-2',
          sku: 'CONC-30MPA',
          type: 'SAIDA',
          quantity: 150,
          executedAreaM2: 100,
          timestamp: '2026-10-03T10:00:00Z'
        });
      }).toThrow('Saldo insuficiente no almoxarifado');
    });
  });

  /* ========================================================================= */
  /* NOVO COMPORTAMENTO DO REQUISITO ALTERADO [RF-12 Modificado]               */
  /* ========================================================================= */
  describe('Novo Requisito: [RF-12 Modificado] Bônus de Eficiência e Alertas Críticos por Desvio de Cm²', () => {
    it('[RED] deve classificar prioridade como CRITICA_DESVIO_ORCAMENTARIO e adicionar margem de 20% quando Cm2 estiver >15% acima da meta', () => {
      // 1. Consumo de 90 kg de aço em 50 m² -> Cm² real = 1.8 kg/m²
      // Meta de Cm² = 1.0 kg/m² -> Desvio = +80% (acima do limite crítico de 15%)
      // Saldo restante: 50 - 90 = - (vamos ajustar saldo inicial para 40 e retirar 25 -> saldo = 15 <= minStock 30)

      stockService.registerMovement({
        id: 'MOV-3',
        sku: 'ACO-CA50-10',
        type: 'SAIDA',
        quantity: 35, // Saldo passa para 15 (menor que minStock 30)
        executedAreaM2: 20, // Cm² real = 35 / 20 = 1.75 kg/m²
        timestamp: '2026-10-03T10:15:00Z'
      });

      const analysis = stockService.analyzeCm2AndStock('ACO-CA50-10', 1.0); // Meta: 1.0 kg/m²

      // Assertiva 1: Alerta deve ser de prioridade crítica
      expect(analysis.alertPriority).toBe('CRITICA_DESVIO_ORCAMENTARIO');

      // Assertiva 2: Recomposição de estoque deve incluir margem de segurança de 20%
      // Reorder base = (30 * 2) - 15 = 45. Com +20% -> 45 * 1.2 = 54
      expect(analysis.suggestedReorderQuantity).toBe(54);
    });

    it('[RED] deve aplicar Bônus de Eficiência de 5% de desconto quando Cm2 estiver >10% abaixo da meta (obra eficiente)', () => {
      // Consumo de 30 m³ de concreto em 100 m² -> Cm² real = 0.30 m³/m²
      // Meta de Cm² = 0.50 m³/m² -> Desvio = -40% (obra muito mais eficiente que a meta)

      stockService.registerMovement({
        id: 'MOV-4',
        sku: 'CONC-30MPA',
        type: 'SAIDA',
        quantity: 30,
        executedAreaM2: 100,
        timestamp: '2026-10-03T10:30:00Z'
      });

      const analysis = stockService.analyzeCm2AndStock('CONC-30MPA', 0.5);

      // Assertiva 1: Deve aplicar bônus de 5%
      expect(analysis.appliedEfficiencyBonusPercent).toBe(5);

      // Assertiva 2: Preço unitário com desconto = 450 * 0.95 = 427.50
      expect(analysis.unitPriceWithBonus).toBe(427.5);
    });
  });
});
