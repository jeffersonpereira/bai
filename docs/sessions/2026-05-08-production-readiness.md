# Sessão: Análise de Prontidão para Produção
**Data:** 2026-05-08
**Especialista:** twin-reviewer
**Resultado:** Análise + Correções Sprint 1 e 2

---

## Veredicto

**NÃO PRONTO para produção** — pontuação geral 3.8/10.

O produto é funcionalmente rico (8/10) mas bloqueado por 4 issues críticos de segurança e ausência de testes, infraestrutura e observabilidade.

---

## Correções Aplicadas

### fix(tests): migrar test_map_bbox para imovel_service
- `backend/tests/test_map_bbox.py` — todos os imports e referências a `property_service` substituídos por `imovel_service`
- Campos dos `_fake_row` atualizados: `lat/lng` → `latitude/longitude`, `price` → `preco`, `property_type` → `tipo_imovel`, `image_url` → `url_imagem`, `title` → `titulo`
- URLs dos endpoints: `/api/v1/properties/map` → `/api/v1/imoveis/map`
- **Resultado: 19 testes passando (era 0)**

### fix(agents): desativar ScoutAgent com comentário de porte
- `backend/app/agents/scout.py` — removida importação de `app.models.property.Property` (modelo inglês inexistente)
- Adicionado comentário de porte com instruções para migrar para `Imovel` e os mapeamentos de campo
- Agente não causa mais `ImportError` na inicialização

### fix(deps): fixar versões no requirements.txt + adicionar gateways de pagamento
- Todas as dependências agora têm versão pinada (`==`)
- Adicionados: `stripe>=7.0.0` e `mercadopago>=2.0.0` (eram importados com `try/import` mas não declarados)

### fix(quota): alinhar limite de imóveis do plano gratuito
- `frontend/src/app/page.tsx` linha 393: "Até 3 imóveis ativos" → "Até 5 imóveis ativos"
- Alinhado com `backend/app/core/planos.py` que define `"imoveis_ativos": 5` para o plano gratuito

---

## Issues Críticos Pendentes (ação manual necessária)

| ID | Issue | Ação |
|---|---|---|
| SEG-01 | `.env` com credenciais reais possivelmente no histórico git | `git filter-branch` ou `git-filter-repo` para remover; rotacionar credenciais no Supabase |
| SEG-02 | `SECRET_KEY` fraca | `python -c "import secrets; print(secrets.token_hex(32))"` e atualizar no Vercel |
| SEG-03 | Supabase Service Key exposta | Revogar e regenerar no painel Supabase → Settings → API |
| SEG-04 | `DEBUG=true` no `.env` | Garantir `DEBUG=false` nas variáveis de ambiente de produção (Vercel) |

---

## Roadmap de Correções Restantes

### Sprint 3 — Observabilidade e Infra
- `loguru` para logging estruturado no backend
- `Dockerfile` para backend e frontend
- `docker-compose.yml` para ambiente local completo
- Sentry para monitoramento de erros

### Sprint 4 — Auth
- Endpoint `/auth/refresh` para renovação silenciosa de token
- Migrar JWT de `localStorage` para `httpOnly cookie`
- Validação de senha mínima (8+ chars) no backend

### Sprint 5 — CI/CD e Testes
- GitHub Actions: lint + pytest + deploy
- Testes de integração para auth, checkout e CRM
- Meta: cobertura > 30%

---

## Cobertura de Requisitos do Mercado Imobiliário

**Implementado (✅):** CRM/Kanban, imóveis, mapa PostGIS, agendamentos, propostas, matchmaking, favoritos, simulador SAC/PRICE, GED, comissões, equipe, landing pages, WhatsApp (Baileys), monetização (Stripe + Pagar.me + Mercado Pago), quotas por plano, análise de preço por m², multi-role.

**Ausente (❌):** Portais imobiliários (ZAP/Viva Real), assinatura digital, portal do proprietário, notificações por email, app mobile.

---

## Commits Sugeridos

```
fix(tests): corrigir test_map_bbox para usar imovel_service e campos em português
fix(agents): desativar ScoutAgent com instruções de porte para modelo Imovel
fix(deps): fixar versões no requirements.txt e adicionar stripe/mercadopago
fix(quota): alinhar limite de imóveis gratuito entre frontend (3→5) e backend
```
