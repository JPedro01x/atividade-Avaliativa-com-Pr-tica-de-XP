# RELATÓRIO DE ATIVIDADE AVALIATIVA DE TDD (TEST-DRIVEN DEVELOPMENT)
**Plataforma Obra360 • Engenharia de Software & Qualidade de Código**

---

## 1. REQUISITO ORIGINAL E REQUISITO ALTERADO

### 1.1 Descrição do Requisito Original
> **[RF-12] Controle de Estoque, Almoxarifado e Consumo por m² ($C_{m^2}$):**
> O sistema deve gerenciar o cadastro de materiais e insumos (código SKU), controle de equipamentos, entradas, saídas e transferências entre almoxarifados, além de calcular o consumo automatizado por metro quadrado ($C_{m^2}$) e emitir alertas de estoque mínimo.  
> **Atores:** Almoxarife, Gestor de Compras, Engenheiro.  
> **Prioridade:** ☒ Essencial | ☐ Importante | ☐ Desejável  
> **Critério de Aceitação:** Movimentações atualizam automaticamente o saldo em estoque, registram o histórico de entradas/saídas e disparam alertas quando o estoque mínimo é atingido.

---

### 1.2 Descrição do Requisito Alterado / Ampliado
> **[RF-12 Modificado] Controle de Estoque, Almoxarifado, Consumo por m² ($C_{m^2}$) e Inteligência de Reposição com Bônus Eficiência:**
> Além de gerenciar cadastros de insumos, movimentações físicas de entrada/saída e cálculo de $C_{m^2}$, o sistema deve calcular dinamicamente a **Prioridade do Pedido de Reposição** e aplicar um **Bônus de Eficiência de Estoque**:
> 1. Se o saldo de um insumo estiver igual ou abaixo do estoque mínimo **E** o $C_{m^2}$ real acumulado da obra for superior a **15% da meta orçada**, o sistema deve elevar a prioridade do alerta para **`CRITICA_DESVIO_ORCAMENTARIO`** e adicionar automaticamente uma **margem de segurança de +20%** na quantidade sugerida de compra.
> 2. Se o $C_{m^2}$ real acumulado estiver mais de **10% abaixo da meta orçada** (evidenciando alta eficiência no uso do insumo), o sistema deve aplicar automaticamente um **Bônus de Eficiência de 5% de desconto virtual** no preço unitário do insumo para precificação das próximas cotações B2B.  
> **Critério de Aceitação:** Ao registrar saídas de almoxarifado, o serviço calcula $C_{m^2} = \frac{\text{Quantidade Consumida}}{\text{Área Executada (m²)}}$, valida o desvio percentual em relação à meta e ajusta prioridade de alerta, margem de reposição e precificação com bônus.

#### Explicação da Alteração:
A alteração ampliou o comportamento original conectando o controle físico do almoxarifado à engenharia de custos e suprimentos. Em canteiros de obra, um estoque baixo combinado com consumo excessivo por m² representa risco iminente de desabastecimento e estouro de orçamento. A inclusão da prioridade crítica com margem de segurança previne paralisações, enquanto o bônus de eficiência recompensa equipes que gastam menos material por metro quadrado.

---

## 2. EVIDÊNCIA DO CICLO TDD (RED $\rightarrow$ GREEN $\rightarrow$ REFACTOR)

### 2.1 Etapa 1: RED (Criar o teste antes da implementação)
Nesta etapa, os testes automatizados para as novas regras do **[RF-12 Modificado]** foram implementados no arquivo `tests/stock.service.spec.ts` antes que a funcionalidade estivesse disponível em `src/services/stock.service.ts`.

#### Resultado da Execução no Terminal (RED):
```text
 RUN  v1.6.1 C:/Users/João Pedro/Downloads/claude/atividade avaliativa

 ❯ tests/stock.service.spec.ts  (4 tests | 2 failed) 12ms
   ❯ tests/stock.service.spec.ts > StockService - Testes de Gestão de Almoxarifado e Cm² > Novo Requisito: [RF-12 Modificado] Bônus de Eficiência e Alertas Críticos por Desvio de Cm² > [RED] deve classificar prioridade como CRITICA_DESVIO_ORCAMENTARIO e adicionar margem de 20% quando Cm2 estiver >15% acima da meta
     → expected 'ALERTA_ESTOQUE_MINIMO' to be 'CRITICA_DESVIO_ORCAMENTARIO'
   ❯ tests/stock.service.spec.ts > StockService - Testes de Gestão de Almoxarifado e Cm² > Novo Requisito: [RF-12 Modificado] Bônus de Eficiência e Alertas Críticos por Desvio de Cm² > [RED] deve aplicar Bônus de Eficiência de 5% de desconto quando Cm2 estiver >10% abaixo da meta (obra eficiente)
     → expected +0 to be 5

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/stock.service.spec.ts > [RED] deve classificar prioridade como CRITICA_DESVIO_ORCAMENTARIO
AssertionError: expected 'ALERTA_ESTOQUE_MINIMO' to be 'CRITICA_DESVIO_ORCAMENTARIO'

 FAIL  tests/stock.service.spec.ts > [RED] deve aplicar Bônus de Eficiência de 5%
AssertionError: expected +0 to be 5

 Test Files  1 failed (1)
      Tests  2 failed | 2 passed (4)
   Start at  09:57:48
   Duration  1.41s
```

---

### 2.2 Etapa 2: GREEN (Implementação mínima para fazer o teste passar)
A regra de negócio foi implementada em `src/services/stock.service.ts` com o código mínimo necessário para satisfazer o desvio orçamentário e o bônus de eficiência.

#### Resultado da Execução no Terminal (GREEN):
```text
 RUN  v1.6.1 C:/Users/João Pedro/Downloads/claude/atividade avaliativa

 ✓ tests/stock.service.spec.ts  (4 tests) 4ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  10:07:49
   Duration  906ms
```

---

### 2.3 Etapa 3: REFACTOR (Melhoria do código mantendo os testes 100% aprovados)
O código em `src/services/stock.service.ts` foi refatorado utilizando princípios de Clean Code e Clean Architecture:
- Extração de métodos auxiliares privados (`calculateCm2Metrics`, `determineAlertAndReorder`, `calculateEfficiencyBonus`).
- Inclusão de documentação de código JSDoc em Português do Brasil (pt-BR).
- Arredondamento padronizado de valores numéricos de precisão.

#### Resultado da Re-execução após Refatoração:
```text
 RUN  v1.6.1 C:/Users/João Pedro/Downloads/claude/atividade avaliativa

 ✓ tests/stock.service.spec.ts  (4 tests) 5ms

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  10:09:16
   Duration  876ms
```

---

## 3. HISTÓRICO DE COMMITS (GIT LOG)

O histórico de commits do repositório demonstra rigorosamente a evolução TDD solicitada na atividade:

```text
aef8912 refactor: melhora implementacao mantendo os testes [RF-12 Modificado]
79230e0 feat: implementa comportamento necessario para bônus e alerta critico [RF-12 Modificado]
aa2b7ef test: adiciona teste para novo requisito [RF-12 Modificado]
be8901d chore: inicializa estrutura do projeto de testes para RF-12
```

---

## 4. RELATÓRIO FINAL DA EXECUÇÃO DOS TESTES

```text
==============================================================================
                    RELATÓRIO FINAL DE TESTES AUTOMATIZADOS
==============================================================================
Ferramenta: Vitest v1.6.1
Ambiente: Node.js ES2022 / TypeScript 5.3.3
Resultado Geral: 100% dos testes APROVADOS (4/4 Passed)

[PASS] tests/stock.service.spec.ts
  ✓ Funcionalidades Originais do RF-12 > deve dar baixa no estoque corretamente ao registrar saída
  ✓ Funcionalidades Originais do RF-12 > deve lançar erro ao tentar retirar quantidade maior do que o saldo disponível (RN-03)
  ✓ Novo Requisito: [RF-12 Modificado] > deve classificar prioridade como CRITICA_DESVIO_ORCAMENTARIO e adicionar margem de 20%
  ✓ Novo Requisito: [RF-12 Modificado] > deve aplicar Bônus de Eficiência de 5% de desconto quando Cm2 estiver >10% abaixo da meta

Total de Suítes: 1 Aprovada
Total de Testes: 4 Aprovados (0 Falhas)
Tempo de Execução: 876 ms
==============================================================================
```

---

## 5. REGISTRO INDIVIDUAL DA ATIVIDADE

- **Horário Aproximado de Início:** 09:45
- **Horário Aproximado de Conclusão:** 10:15
- **Requisito Escolhido:** `[RF-12] Controle de Estoque, Almoxarifado e Consumo por m² (Cm²)`
- **Linguagem Utilizada:** TypeScript (Node.js ES2022)
- **Framework / Biblioteca de Testes Utilizada:** Vitest v1.6.1
- **Breve Descrição das Principais Dificuldades Encontradas:**
  > A principal dificuldade residiu em isolar o cálculo percentual de desvio do consumo acumulado por metro quadrado ($C_{m^2}$) de forma que a recomposição de estoque aplicasse a margem de segurança de 20% apenas em casos onde o estoque físico estivesse simultaneamente abaixo do estoque mínimo (`minStock`). A estruturação prévia dos testes no estágio RED auxiliou a definir as fronteiras exatas da regra de negócio antes de codificar o serviço de domínio.
