# Twin Plan — Upload de Imagens de Imóveis (Supabase)

**Selected Specialist:** twin-developer
**Selection Reason:** heuristic (full-stack: FastAPI backend + Next.js frontend)
**Quality Level:** pragmatic
**Timestamp:** 2026-05-06

---

## Resumo da Tarefa

Adicionar funcionalidade de upload de imagens de imóveis para o bucket "imovel" do Supabase Storage. Cada imóvel pode ter no máximo 4 imagens com limite de 1 MB por imagem.

---

## Estratégia

- **Upload via backend** (não direto do browser ao Supabase) para manter controle de validação e quota server-side.
- Frontend envia multipart/form-data para endpoint FastAPI.
- Backend valida (tamanho, quantidade, tipo), faz upload ao Supabase Storage, salva URL no banco.
- Reutilizar model `MidiaImovel` existente (`/backend/app/models/midia.py`).

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Motivo |
|---------|------|--------|
| `backend/requirements.txt` | Modificar | Adicionar `supabase` e `python-multipart` |
| `backend/app/core/config.py` | Modificar | Adicionar `SUPABASE_SERVICE_KEY` |
| `backend/app/core/supabase_client.py` | Criar | Cliente Supabase singleton |
| `backend/app/routers/imoveis.py` | Modificar | Adicionar endpoints de upload/delete imagem |
| `backend/app/services/imovel_service.py` | Modificar | Lógica de upload/delete no Supabase Storage |
| `frontend/src/app/announce/page.tsx` | Modificar | Substituir URL input por file upload com preview |
| `backend/.env` | Não modificar | Usuário adiciona `SUPABASE_SERVICE_KEY` manualmente |

---

## Passos de Implementação

### PASSO 1 — Backend: Dependências
**Arquivo:** `backend/requirements.txt`
- Adicionar linha: `supabase>=2.0.0`
- Adicionar linha: `python-multipart>=0.0.6`

### PASSO 2 — Backend: Config
**Arquivo:** `backend/app/core/config.py`
- Adicionar campo: `SUPABASE_SERVICE_KEY: str = ""`
- (Usuário precisa adicionar a service key ao .env)

### PASSO 3 — Backend: Cliente Supabase
**Arquivo:** `backend/app/core/supabase_client.py` (criar)
- Instanciar cliente supabase usando `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
- Exportar `get_supabase_client()` como singleton

### PASSO 4 — Backend: Service de Upload
**Arquivo:** `backend/app/services/imovel_service.py`
- Adicionar função `fazer_upload_imagem(imovel_id, arquivo, db, supabase_client)`:
  - Buscar count atual de imagens do imóvel no banco
  - Validar: count < 4 (máx 4 imagens)
  - Validar: tamanho do arquivo ≤ 1_048_576 bytes (1 MB)
  - Validar: tipo MIME in ['image/jpeg', 'image/png', 'image/webp']
  - Gerar path: `{imovel_id}/{uuid}.{ext}`
  - Upload ao bucket "imovel" via supabase storage
  - Salvar MidiaImovel com URL pública no banco
  - Retornar MidiaImovel criado
- Adicionar função `deletar_imagem_imovel(midia_id, imovel_id, db, supabase_client)`:
  - Buscar MidiaImovel por id
  - Verificar ownership (imovel_id)
  - Deletar do Supabase Storage
  - Deletar do banco

### PASSO 5 — Backend: Endpoints
**Arquivo:** `backend/app/routers/imoveis.py`
- Adicionar `POST /imoveis/{imovel_id}/imagens` (upload de 1 imagem por vez, multipart):
  - Recebe `UploadFile` via `File(...)`
  - Chama `fazer_upload_imagem()`
  - Retorna MidiaImovel criado (id, url, ordem)
- Adicionar `DELETE /imoveis/{imovel_id}/imagens/{midia_id}`:
  - Chama `deletar_imagem_imovel()`
  - Retorna 204

### PASSO 6 — Frontend: Componente de Upload
**Arquivo:** `frontend/src/app/announce/page.tsx`
- Substituir o bloco de URL input de imagens por:
  - `<input type="file" accept="image/jpeg,image/png,image/webp" multiple>` (max 4)
  - Preview das imagens selecionadas/enviadas (thumbnails)
  - Botão de remover por imagem
  - Mensagem de validação: "Máximo 4 imagens, 1 MB cada"
  - Upload disparado ao submeter o formulário (ou on-change com feedback imediato)
  - Exibe progresso de upload (loading state por imagem)

---

## Restrições / Constraints

- Máximo 4 imagens por imóvel (validado no backend)
- Tamanho máximo por imagem: 1 MB (1_048_576 bytes) — validado no backend E no frontend
- Tipos aceitos: JPEG, PNG, WebP
- Usuário deve adicionar `SUPABASE_SERVICE_KEY` ao arquivo `.env` do backend
- Bucket "imovel" deve existir no Supabase (com política de upload autenticado)
- Não quebrar o fluxo de criação de imóvel existente (midias como URL ainda suportadas)

---

## QA Checklist

- [ ] Upload de imagem válida (< 1MB, JPEG) retorna 200 com URL
- [ ] Upload acima de 1MB retorna 400 com mensagem clara
- [ ] Tentativa de upload quando imóvel já tem 4 imagens retorna 400
- [ ] DELETE remove do Supabase e do banco
- [ ] Frontend não permite selecionar mais de 4 arquivos
- [ ] Frontend mostra erro se arquivo > 1MB
- [ ] Preview aparece antes/depois do upload
- [ ] Endpoint de upload requer autenticação

---

## Notas

- O campo `url_imagem` do imóvel (capa) pode ser atualizado para a primeira imagem após upload
- A service key do Supabase é necessária para uploads server-side; não confundir com a publishable key já no .env
- Path no storage: `imovel/{imovel_id}/{uuid}.ext`
