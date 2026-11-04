# 📦 Arquivo Histórico do SmartBid

Esta pasta armazena com segurança códigos legados, scripts pontuais de automação/migração e diffs de testes realizados durante as fases iniciais do projeto. 

Nenhum arquivo contido aqui é executado em produção pelo Next.js. Eles foram preservados para manter o histórico de auditoria e desenvolvimento acessível caso alguma lógica antiga precise ser consultada.

---

## 📂 Estrutura

### 1. `legado_fpv/`
- Protótipos monolíticos antigos do FPV (Folha de Pagamento Visual / Proposta Comercial) que foram desenvolvidos antes da transição para a arquitetura modular componentizada atual em `components/propostas/`.
- Contém: `old_fpv.tsx`, `original_fpv.tsx`, `fpv_pure.tsx`, etc.

### 2. `scripts_legados/`
- Scripts de automação pontual utilizados no desenvolvimento:
  - `seed_templates.*`: Carga inicial de modelos de e-mail e propostas.
  - `create_print_deck*.js`: Scripts utilitários de geração de lâminas/impressão.
  - `fix_*.js` / `fix_*.ts`: Scripts pontuais de ajuste de encoding, CSS e formatação de campos.
  - `test_*.js` / `test_*.ts`: Scripts rápidos de validação de APIs externas e CCTs sindicais.
  - `agent_scratch/`: Scripts auxiliares de ajustes pontuais.

### 3. `diffs_e_logs/`
- Diffs e logs de depuração de versões antigas do código (`diff.txt`, `extracted.txt`, `emails_diff.txt`).
