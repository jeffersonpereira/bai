# Sessão: Agente de WhatsApp Conversacional
**Data:** 2026-05-08
**Especialista:** twin-backend

---

## O que foi implementado

### feat(agents): agente de WhatsApp conversacional com Claude

**Arquivos criados/modificados:**

| Arquivo | Ação |
|---|---|
| `backend/app/agents/whatsapp_agent.py` | CRIADO — agente completo |
| `backend/app/routers/whatsapp.py` | MODIFICADO — webhook integra o agente |
| `backend/app/core/config.py` | MODIFICADO — `ANTHROPIC_API_KEY` adicionada |
| `backend/requirements.txt` | MODIFICADO — `anthropic>=0.40.0` adicionado |

---

## Arquitetura do Agente

```
POST /whatsapp/webhook/message
        ↓
Salva mensagem + cria lead (se 1ª mensagem) — comportamento original mantido
        ↓
BackgroundTask: _run_agent() → asyncio.run(handle_incoming_message())
        ↓
Verificações de proteção:
  - ANTHROPIC_API_KEY configurada?
  - Corretor respondeu nas últimas 2h? → silencia
  - Lead em visita/proposta/fechado/perdido? → silencia
  - Mais de 5 respostas automáticas em 24h? → silencia
        ↓
Busca histórico de mensagens (últimas 12, alternância user/assistant)
Busca dados do imóvel associado ao lead (se houver)
Busca nome do corretor para personalizar o prompt
        ↓
Chama Claude claude-haiku-4-5-20251001 com tool_use:
  - send_whatsapp_reply: envia resposta via Node.js e salva no DB
  - update_lead_status: atualiza situacao + observacoes do lead
        ↓
Webhook retorna {"ok": true} imediatamente (agente roda em background)
```

---

## Modelo usado

`claude-haiku-4-5-20251001` — escolhido por custo/latência adequados para resposta em tempo real no WhatsApp. Pode ser trocado para `claude-sonnet-4-6` em `whatsapp_agent.py` linha com `model=`.

---

## Configuração necessária

Adicionar ao `.env` do backend:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Se a chave não estiver configurada, o agente silencia sem quebrar o webhook.

---

## Decisões técnicas

- **BackgroundTasks do FastAPI** em vez de asyncio puro — mantém compatibilidade com o event loop do uvicorn e não bloqueia a resposta ao Node.js.
- **`asyncio.run()` dentro do background task** — necessário porque o agent usa `httpx.AsyncClient` mas o BackgroundTask roda em thread síncrona. Alternativa seria usar `anyio.from_thread.run_sync` mas `asyncio.run` é suficiente para este caso.
- **Máx 5 respostas automáticas / 24h** — protege contra loops quando o contato não responde de forma que o modelo consiga qualificar.
- **Silêncio se corretor respondeu nas últimas 2h** — evita que o agente "interfira" em conversas que o corretor já está conduzindo manualmente.
- **Modelo Haiku** — custo ~20x menor que Sonnet, latência menor. Para qualificação de lead por WhatsApp é suficiente.

---

## Próximos passos sugeridos

1. Adicionar campo `imovel_id` ao webhook payload para associar imóvel desde a primeira mensagem (hoje fica `None`).
2. Implementar painel de configuração do agente no dashboard do corretor (ativar/desativar, personalizar persona).
3. Adicionar ferramenta `schedule_visit` para o agente criar agendamentos diretamente.
4. Logar chamadas ao agente em tabela `AgentLog` para auditoria e melhoria do prompt.

---

## Commits sugeridos

```
feat(agents): implementar agente de WhatsApp conversacional com Claude API
feat(config): adicionar ANTHROPIC_API_KEY às configurações
feat(whatsapp): integrar agente ao webhook via BackgroundTasks
chore(deps): adicionar anthropic>=0.40.0 ao requirements.txt
```
