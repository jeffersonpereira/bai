---
name: twin-router
description: Agente responsável por identificar dinamicamente o twin mais adequado para uma solicitação e confirmar com o usuário antes de delegar a execução.
trigger: /twin-router
parameters:
  - name: task
    type: string
    required: true
    description: Descrição da tarefa ou problema a ser resolvido.
  - name: quality
    type: string
    required: false
    description: Quality level (pragmatic, balanced, strict) - padrão: strict
---

# Twin Router

O **twin-router** é o ponto de entrada inteligente para o ecossistema de twins.  
Ele analisa a solicitação (`task`), sugere qual especialista (twin) deve atuar, e **pede confirmação ao usuário** antes de continuar o fluxo (normalmente chamando o `twin-workflow`).

---

## 🎯 Objetivo

Garantir que cada solicitação do usuário seja direcionada ao **especialista mais apropriado**, reduzindo erros de roteamento e mantendo transparência no processo.

O twin-router:
1. Lê a task enviada pelo usuário.
2. Detecta qual twin parece mais adequado.
3. Apresenta a sugestão e pede confirmação.
4. Caso o usuário confirme, dispara o workflow do twin correspondente.
5. Caso o usuário corrija o especialista, respeita a escolha e reencaminha a execução.
6. Caso o usuário rejeite ou cancele, encerra o processo sem executar o workflow.

---

## ⚙️ Lógica de Descoberta de Especialista

A lógica de detecção segue regras simples e ajustáveis.  
A ordem de prioridade é importante:

| Palavras-chave / contexto detectado                        | Especialista sugerido |
|------------------------------------------------------------|-----------------------|
| `flutter`, `dart`, `mobile`                                | `twin-mobile-flutter` |
| `react`, `next`, `ui`, `frontend`, `tailwind`              | `twin-frontend-react` |
| `api`, `backend`, `spring`, `express`, `node`              | `twin-backend`        |
| `pyspark`, `glue`, `etl`, `s3`, `data`, `parquet`          | `twin-data-engineer`  |
| `k8s`, `helm`, `ci/cd`, `pipeline`, `rancher`, `terraform` | `twin-devops`         |
| `infrastructure`, `vpc`, `iam`, `aws`, `gcp`, `azure`      | `twin-infrastructure` |
| `security`, `auth`, `jwt`, `vuln`, `pentest`               | `twin-security`       |
| `plan`, `strategy`, `spec`                                 | `twin-planner`        |
| `doc`, `document`, `changelog`                             | `twin-documenter`     |
| `review`, `lint`, `pull request`                           | `twin-reviewer`       |
| qualquer outro caso                                        | `twin-developer`      |

---

## 🧠 Exemplo de fluxo de decisão

1. Usuário executa:
   ```
   /twin-router "criar pipeline no Glue para processar parquet no S3"
   ```
2. Router identifica as palavras `Glue`, `S3`, `parquet` → Sugere `twin-data-engineer`.
3. Mostra a mensagem:
   ```
   Sugestão: twin-data-engineer parece o especialista certo. Deseja confirmar? (y/n ou especifique outro twin)
   ```
4. Se confirmado, roteia para `/twin-workflow --specialist=data-engineer`.
5. Se negado e o usuário responde `devops`, roteia para `/twin-workflow --specialist=devops`.

---

## 🪶 Saída esperada

O router gera uma saída em Markdown simples antes de executar o próximo passo:

```
# Twin Routing Decision

Task: criar pipeline no Glue para processar parquet no S3
Suggested Specialist: twin-data-engineer
Confidence: alta (baseado em keywords)
Action Required: Confirme o especialista para continuar.
```

---

## 🧩 Integração com twin-workflow

Após confirmação, o router aciona o `twin-workflow`:

```
/twin-workflow "criar pipeline no Glue para processar parquet no S3" --specialist=data-engineer
```

---

## 🔄 Extensibilidade

- O mapeamento de palavras-chave pode ser mantido em um arquivo YAML central.
- Pode ser expandido para leitura de arquivos (ex: `package.json`, `pubspec.yaml`).
- Suporte a fallback inteligente com `twin-planner` caso nenhum twin corresponda.

---

## ✅ Benefícios

- Reduz erros de roteamento automático.
- Mantém transparência no processo.
- Permite confirmação humana antes da execução.
- Facilita futuras integrações com IA de contexto.

---
