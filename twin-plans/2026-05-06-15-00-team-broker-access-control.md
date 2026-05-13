# Twin Implementation Plan

Selected Specialist: backend
Selection Reason: heuristic
Timestamp: 2026-05-06

---

## Task Summary

A team broker (`perfil == "corretor"` AND `imobiliaria_id IS NOT NULL`) must:
- Be BLOCKED from: team registration view, visits they don't manage, plan/consumption page, commissions that are not theirs
- Have SCOPED access to: their own leads PLUS unassigned leads from their agency (can claim them)

---

## Step 1 — `backend/app/core/deps.py`

Add `get_current_broker_or_above` dependency (allows all corretores, not just independent ones):

```python
def get_current_broker_or_above(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.perfil in ["admin", "imobiliaria", "corretor"]:
        return current_user
    raise HTTPException(status_code=403, detail="Acesso negado.")
```

---

## Step 2 — `backend/app/services/crm_service.py`

### Fix `get_leads` — add team broker branch (before `else`):

```python
elif current_user.perfil == "corretor" and current_user.imobiliaria_id is not None:
    agency_broker_ids = [
        b.id for b in db.query(Usuario)
        .filter(Usuario.imobiliaria_id == current_user.imobiliaria_id)
        .all()
    ]
    agency_broker_ids.append(current_user.imobiliaria_id)
    query = query.filter(
        or_(
            Lead.corretor_id == current_user.id,
            and_(
                Lead.corretor_id.is_(None),
                Lead.imovel_id.in_(
                    db.query(Imovel.id).filter(
                        Imovel.corretor_id.in_(agency_broker_ids)
                    )
                )
            )
        )
    )
```

### Fix `get_leads_kanban` — same branch addition.

### Add `claim_lead` function:

```python
def claim_lead(db: Session, lead_id: int, current_user: Usuario) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    if lead.corretor_id is not None:
        raise HTTPException(status_code=409, detail="Lead já está atribuído a um corretor.")
    if current_user.imobiliaria_id is None:
        raise HTTPException(status_code=403, detail="Acesso negado")
    lead.corretor_id = current_user.id
    db.commit()
    db.refresh(lead)
    return lead
```

---

## Step 3 — `backend/app/services/comissao_service.py`

### Replace `_assert_agency_access` with two helpers:

```python
def _assert_write_access(current_user: Usuario) -> None:
    if current_user.perfil not in ["imobiliaria", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso restrito a agências e administradores.")

def _assert_read_access(current_user: Usuario) -> None:
    if current_user.perfil not in ["imobiliaria", "admin", "corretor"]:
        raise HTTPException(status_code=403, detail="Acesso negado.")
```

### Fix `list_comissoes`:
- Replace `_assert_agency_access` with `_assert_read_access`
- Add `elif current_user.perfil == "corretor": query = query.filter(Comissao.corretor_id == current_user.id)`

### Fix `get_resumo`:
- Same read_access + corretor filter pattern.

### Keep `create_comissao` and `update_status` using `_assert_write_access`.

---

## Step 4 — `backend/app/services/agendamento_service.py`

### Fix `imobiliaria` branch in `get_appointments`:

```python
if current_user.perfil == "imobiliaria":
    broker_ids = [b.id for b in current_user.corretores]
    broker_ids.append(current_user.id)
    return (
        base.join(Imovel)
        .filter(Imovel.corretor_id.in_(broker_ids))
        .order_by(Agendamento.data_visita.asc())
        .all()
    )
```

Team brokers already fall to existing `else` branch (filters by `corretor_id == current_user.id`) — no separate branch needed.

---

## Step 5 — `backend/app/routers/crm.py`

- Import `get_current_broker_or_above` from `core.deps`
- Change dependency on: `GET /leads`, `GET /leads/kanban`, `POST /leads`, `PATCH /leads/{id}/status`, `POST /leads/{id}/activities`, `GET /leads/{id}/activities`
- Add claim endpoint:

```python
@router.post("/leads/{lead_id}/claim")
def claim_lead_endpoint(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_broker_or_above),
):
    return crm_service.claim_lead(db, lead_id, current_user)
```

---

## Step 6 — `backend/app/routers/comissoes.py`

- `GET /` and `GET /resumo` → use `get_current_broker_or_above`
- `POST /` and `PATCH /{id}/status` → keep `get_current_agency`

---

## Step 7 — `frontend/src/app/context/AuthContext.tsx`

Add `isTeamBroker` boolean to the context interface and provider value:

```typescript
// interface
isTeamBroker: boolean;

// computed
const isTeamBroker = !!user && user.role === "broker" && !!user.parent_id;
```

---

## Step 8 — `frontend/src/app/components/DashboardSidebar.tsx`

In `getNavItems`, add `!parentId` guard before adding "Plano & Consumo" item. "Equipe" is already gated on `role === "agency"`.

---

## Step 9 — `frontend/src/app/dashboard/comissoes/page.tsx`

Use `isTeamBroker` from context to hide the "Registrar Comissão" button:

```typescript
{!isTeamBroker && (
  <button onClick={...}>+ Registrar Comissão</button>
)}
```

---

## Step 10 — `frontend/src/app/dashboard/team/page.tsx`

Add redirect guard:

```typescript
useEffect(() => {
  if (user && isTeamBroker) router.replace("/dashboard/agency");
}, [user, isTeamBroker, router]);
```

---

## Step 11 — `frontend/src/app/dashboard/cobranca/page.tsx` (if exists)

Same redirect guard pattern as Step 10.

---

## Step 12 — `frontend/src/app/dashboard/crm/page.tsx`

- Import `isTeamBroker` from `useAuth()`
- Add "Assumir Lead" button for unassigned leads visible to team brokers
- Add `handleClaimLead` async function calling `POST /api/v1/crm/leads/{id}/claim`

---

## Execution Order

1. `deps.py`
2. `comissao_service.py`
3. `crm_service.py`
4. `agendamento_service.py`
5. `routers/crm.py`
6. `routers/comissoes.py`
7. `AuthContext.tsx`
8. `DashboardSidebar.tsx`
9. `comissoes/page.tsx`
10. `team/page.tsx`
11. `cobranca/page.tsx`
12. `crm/page.tsx`

---

## QA Validation Steps

**Users needed:** Agency A, Team Broker T (imobiliaria_id=A), Independent Broker I

**Backend:**
1. `GET /crm/leads` as T → 200, own leads + unassigned agency leads only
2. `GET /crm/leads` as I → 200, own leads only
3. `POST /crm/leads/{unassigned}/claim` as T → 200, lead assigned to T
4. `POST /crm/leads/{assigned_other}/claim` as T → 409
5. `GET /comissoes/` as T → 200, only T's commissions
6. `POST /comissoes/` as T → 403
7. `GET /agendamentos/` as T → 200, only T's managed visits
8. `GET /equipe/brokers` as T → 403 (already protected)

**Frontend:**
1. Login as T → no "Equipe" or "Plano & Consumo" in sidebar
2. Navigate to `/dashboard/team` as T → redirect to `/dashboard/agency`
3. Navigate to `/dashboard/cobranca` as T → redirect to `/dashboard/agency`
4. `/dashboard/comissoes` as T → no "Registrar Comissão" button
5. `/dashboard/crm` as T → shows unassigned agency leads with "Assumir Lead" button
6. Click "Assumir Lead" → lead claimed, button disappears
7. Login as A → all team management works normally
