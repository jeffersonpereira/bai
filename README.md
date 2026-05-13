# BAI — Plataforma Inteligente para o Mercado Imobiliário

> Conectamos compradores, corretores e imobiliárias em uma plataforma completa, do primeiro contato ao fechamento do negócio.

---

## O Problema que o BAI Resolve

O mercado imobiliário enfrenta desafios críticos que custam tempo e dinheiro para todos os envolvidos:

| Problema | Impacto |
|----------|---------|
| **Leads perdidos** | Mensagens chegam por WhatsApp, e-mail e portais sem centralização — o corretor perde oportunidades por desorganização |
| **Processo manual e lento** | Agendamentos, propostas e documentos são tratados via papel, planilhas e WhatsApp individual |
| **Falta de visibilidade** | Proprietários não sabem quantos interessados existem no seu imóvel ou em que fase estão |
| **Match ineficiente** | Compradores recebem dezenas de imóveis irrelevantes; corretores desperdiçam tempo em visitas sem potencial |
| **Comissões sem controle** | Corretores não têm onde registrar e acompanhar seus recebíveis de forma estruturada |
| **Sem presença digital** | Corretores independentes não têm site ou landing page própria para captar leads |
| **Atendimento fora do horário** | Interessados não conseguem resposta rápida fora do horário comercial |

---

## O que é o BAI

BAI é uma plataforma SaaS B2B2C para o setor imobiliário construída com:

- **Backend**: Python / FastAPI + SQLAlchemy
- **Frontend**: Next.js 14 + React (TypeScript)
- **IA**: Claude (Anthropic) para qualificação de leads e matchmaking
- **Integrações**: WhatsApp, Stripe, Pagar.me, Mercado Pago
- **Mapas**: Geolocalização com visualização de imóveis por área

---

## Quem Usa o BAI

```
Comprador         →   Busca, compara, agenda e faz propostas
Corretor          →   Anuncia, gerencia leads, visitas e comissões
Imobiliária       →   Coordena equipe, portfólio e resultados
Proprietário      →   Acompanha o processo de venda/locação
Admin             →   Gerencia toda a plataforma
```

---

## Módulos e Funcionalidades

---

### 1. Busca e Descoberta de Imóveis

**Problema resolvido:** compradores perdem tempo em buscas sem filtros relevantes e sem visão espacial do mercado.

- Busca avançada com filtros de preço, tipo, localização, área, quartos e vagas
- Visualização em mapa com agrupamento por região (bbox geográfico)
- Página de detalhe completa com galeria de fotos, descrição, localização e disponibilidade
- Histórico de imóveis visitados ("novos" vs "já vistos")
- Favoritos com criação automática de lead para o corretor

---

### 2. CRM — Gestão de Leads e Relacionamento

**Problema resolvido:** corretores gerenciam leads em WhatsApp e anotações avulsas, perdendo o histórico e o momento certo de agir.

- Painel Kanban com estágios do lead: **Novo → Contatado → Visita → Proposta → Fechado / Perdido**
- Criação manual ou automática de leads (via favorito, proposta ou WhatsApp)
- Registro de atividades por lead (ligação, visita, e-mail, nota)
- Múltiplos origens de lead: portal, WhatsApp, indicação, landing page
- Filtros por status, imóvel e data
- Visualização de lista ou Kanban

---

### 3. Agendamento de Visitas

**Problema resolvido:** agendamentos feitos por mensagem geram confusão de horários, esquecimentos e sem registro formal.

- Formulário público de agendamento direto na página do imóvel
- Disponibilidades configuráveis por dia da semana e horário
- Status da visita: **Pendente → Confirmada → Realizada → Cancelada**
- Feedback pós-visita registrado pelo corretor
- Histórico de visitas para comprador e corretor

---

### 4. Propostas de Compra

**Problema resolvido:** ofertas informais via mensagem não têm rastreabilidade, valor documentado nem acompanhamento de negociação.

- Envio de proposta diretamente na página do imóvel (público ou autenticado)
- Campos estruturados: valor ofertado, forma de pagamento, percentual de financiamento
- Status da proposta: **Pendente → Aceita → Recusada → Cancelada**
- Visão unificada para o corretor de todas as propostas recebidas
- Histórico de propostas para o comprador

---

### 5. Matchmaking Inteligente com IA

**Problema resolvido:** compradores recebem sugestões genéricas sem considerar suas reais preferências e capacidade financeira.

- Comprador cria perfil com preferências: cidade, bairro, faixa de preço, tipo, quartos, financiamento aprovado
- Algoritmo de scoring calcula compatibilidade de cada imóvel com o perfil
- Listagem ranqueada dos imóveis mais alinhados
- Múltiplos perfis por comprador (ex: casa para morar + apartamento para investir)

---

### 6. WhatsApp com Atendimento Automático por IA

**Problema resolvido:** corretores perdem leads que mandam mensagem fora do horário e não recebem resposta rápida.

- Integração nativa com WhatsApp via sessão dedicada por corretor
- Agente IA (Claude) responde automaticamente mensagens recebidas
- Qualifica o lead e extrai informações de interesse
- Cria lead automaticamente no CRM a partir da conversa
- Proteções inteligentes:
  - Silencia quando o corretor respondeu manualmente (últimas 2h)
  - Para de responder se lead já está em fase avançada (visita, proposta, fechado)
  - Limite de 5 respostas automáticas por conversa
- Histórico de mensagens centralizado no dashboard

---

### 7. Landing Page Pública do Corretor

**Problema resolvido:** corretores independentes não têm presença digital própria e dependem 100% de portais de terceiros.

- Cada corretor recebe uma página pública personalizada: `app.bai.com/corretor/seu-nome`
- Configurável: foto, bio, especialidade, cidade de atuação
- Exibe portfólio de imóveis do corretor
- Formulário de contato direto que gera lead no CRM
- Slug personalizado com verificação de disponibilidade

---

### 8. Gestão de Proprietários e Mandatos

**Problema resolvido:** corretores não têm onde registrar quem são seus proprietários e quais são as condições acordadas para cada imóvel.

- Cadastro completo de proprietários (nome, CPF/CNPJ, contato)
- Portfólio de imóveis por proprietário
- Mandatos de venda/locação com percentual de comissão e data de vencimento
- Visão consolidada para a imobiliária de todos os proprietários da carteira

---

### 9. Gestão de Comissões

**Problema resolvido:** corretores perdem o controle de quanto têm a receber e quando, usando planilhas desconectadas do processo de venda.

- Registro de comissão ao fechar negócio (percentual e valor calculado)
- Status de pagamento: **Pendente → Pago**
- Resumo financeiro consolidado
- Gestão pela imobiliária para toda a equipe

---

### 10. Gestão de Documentos

**Problema resolvido:** documentos de imóveis, proprietários e operações ficam espalhados em e-mails e pastas sem controle de vencimento.

- Upload e organização de documentos por contexto: imóvel, proprietário ou operacional
- Alertas de documentos próximos do vencimento
- Tipos: contrato, certidão, laudo, procuração, etc.
- Status: válido, vencendo, vencido, renovado

---

### 11. Simulador de Financiamento

**Problema resolvido:** compradores precisam sair da plataforma para simular o financiamento, perdendo o contexto da busca.

- Cálculo de parcelas com diferentes prazos e taxas de juros
- Integrado ao fluxo de busca do comprador
- Auxilia na tomada de decisão antes de fazer uma proposta

---

### 12. Gestão de Equipe (Imobiliária)

**Problema resolvido:** imobiliárias não têm visibilidade centralizada sobre o trabalho dos corretores da equipe.

- Adicionar e gerenciar corretores vinculados à imobiliária
- Pool de leads compartilhado entre corretores da mesma imobiliária
- Visão de performance da equipe
- Comissões centralizadas por imobiliária

---

### 13. Dashboard por Perfil

Cada tipo de usuário tem um painel personalizado:

#### Comprador
- Visitas agendadas e status
- Propostas enviadas
- Imóveis favoritos
- Matches com perfil de comprador

#### Corretor / Vendedor
- Imóveis anunciados com contagem de leads, visitas e propostas
- Ranking de compradores mais engajados por imóvel
- Funil de vendas por propriedade

#### Imobiliária
- Visão consolidada da equipe
- Gestão de portfólio completo
- Comissões da equipe

#### Admin
- Estatísticas globais da plataforma
- Gerenciamento de usuários e imóveis
- Configurações do sistema e gateway de pagamento

---

### 14. Plataforma SaaS com Planos e Cobranças

**Problema resolvido:** corretores e imobiliárias precisam de um serviço escalável com cobrança proporcional ao uso.

- Planos: **Gratuito**, **Pro** (corretor), **Premium** (imobiliária)
- Cotas de uso por plano (imóveis, leads, etc.)
- Checkout seguro: o número do cartão nunca passa pelo servidor (tokenizado no frontend)
- Suporte a múltiplos gateways: **Stripe**, **Pagar.me**, **Mercado Pago**
- Gateway configurável pelo admin sem mudança de código

---

## Fluxos Principais

### Fluxo do Comprador

```
Busca imóvel → Visualiza detalhes → Favorita ou Agenda visita
     ↓
Lead criado automaticamente para o corretor
     ↓
Corretor confirma visita → Visita realizada → Comprador faz proposta
     ↓
Corretor aceita proposta → Negócio fechado
```

### Fluxo do Corretor

```
Cadastra proprietário → Anuncia imóvel → Define disponibilidades
     ↓
Recebe leads no CRM (Kanban) → Filtra por estágio
     ↓
Agenda visitas → Registra atividades → Recebe propostas
     ↓
Fecha negócio → Registra comissão → Acompanha pagamento
```

### Fluxo de Atendimento por WhatsApp

```
Interessado envia mensagem no WhatsApp do corretor
     ↓
IA analisa a mensagem com contexto do imóvel
     ↓
IA responde e qualifica o lead automaticamente
     ↓
Lead criado no CRM com histórico da conversa
     ↓
Corretor assume a conversa quando disponível
```

---

## Arquitetura Técnica

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│         Next.js 14 + TypeScript             │
│    Busca · CRM · Dashboards · Landing       │
└───────────────────┬─────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────┐
│                  Backend                     │
│              FastAPI (Python)               │
│  18 routers · 16 serviços · 20 modelos      │
└────────────┬────────────────┬───────────────┘
             │                │
    ┌────────▼───────┐  ┌─────▼──────────────┐
    │   Banco de     │  │  Serviços externos  │
    │   Dados        │  │  WhatsApp (Node.js) │
    │ PostgreSQL/    │  │  Stripe / Pagar.me  │
    │   SQLite       │  │  Claude AI (Anthropic)│
    └────────────────┘  └────────────────────┘
```

---

## Roadmap Futuro

- **Notificações em tempo real** (WebSocket) para leads e visitas
- **App Mobile** (React Native) para corretores em campo
- **Integração com portais** (ZAP, OLX, Viva Real) para importar imóveis
- **Relatórios e analytics** avançados por período
- **Assinatura eletrônica** de contratos e propostas
- **Avaliação automática de imóveis** com IA baseada em dados de mercado

---

## Instalação e Execução

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Variáveis de Ambiente

```env
# Backend (.env)
DATABASE_URL=sqlite:///./bai.db
SECRET_KEY=sua-chave-secreta
ANTHROPIC_API_KEY=sk-ant-...

# Gateway de pagamento (configurável pelo admin)
GATEWAY_TIPO=stripe | pagarme | mercadopago
```

---

*BAI — Tecnologia que transforma a jornada imobiliária.*
