# Session: Ownership Control Fixes — 2026-05-06

## Summary

Four authorization gaps were identified and patched in the property/document layer. Two were critical (any agency could mutate broker assignments on properties they don't own), one moderate (any authenticated user could attach documents to arbitrary properties), and one low (availability endpoint was fully public).

---

## Gaps and Fixes

### GAP 1 — CRITICAL: `assign_broker` lacked ownership check (`imovel_service.py` ~line 498)

**Problem:** Any authenticated imobiliaria/corretor could call `assign_broker` against any `imovel_id`, regardless of whether that property belonged to them.

**Fix:** Added an `owns` predicate before proceeding:
```python
owns = (prop.corretor_id == current_user.id or
        prop.corretor.imobiliaria_id == current_user.id)
if not owns:
    raise HTTPException(status_code=403, detail="Sem permissão para este imóvel")
```

---

### GAP 2 — CRITICAL: `unassign_broker` lacked ownership check (`imovel_service.py` ~line 515)

**Problem:** Same as GAP 1 — unassignment had no ownership verification. Additionally, the router used `dependencies=[Depends(get_current_user)]` which injects the user as a side-effect but does not expose it to the service call.

**Fix:**
- Added `current_user: Usuario` as an explicit parameter to `unassign_broker` in the service.
- Router changed from `dependencies=[Depends(get_current_user)]` to `current_user: Usuario = Depends(get_current_user)` so the resolved user object is passed through to the service.
- Same `owns` ownership check applied.

---

### GAP 3 — MODERATE: `create_document` allowed cross-property attachment (`documento_service.py` ~line 54)

**Problem:** Any authenticated user could set `imovel_id` in the document payload and attach a document to a property they don't own or manage.

**Fix:** When `imovel_id` is present and the caller is neither admin nor imobiliaria, ownership is verified:
```python
if doc_in.imovel_id and current_user.perfil not in ("admin", "imobiliaria"):
    prop = db.query(Imovel).filter(Imovel.id == doc_in.imovel_id).first()
    if not prop or prop.corretor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sem permissão para este imóvel")
```
`Imovel` was added to the import list (line 6).

---

### GAP 4 — LOW: `GET /{property_id}/availability` was unauthenticated (`routers/imoveis.py` ~line 178)

**Problem:** The availability endpoint had no authentication dependency, leaking scheduling/occupancy data to anonymous callers.

**Fix:** Added `_: Usuario = Depends(get_current_user)` to the route signature. The underscore name makes clear the value is used only for the auth side-effect, not inside the handler body.

---

## Files Changed

| File | Change location |
|------|----------------|
| `backend/app/services/imovel_service.py` | `assign_broker` ~line 498, `unassign_broker` ~line 515 |
| `backend/app/routers/imoveis.py` | `unassign` DELETE ~line 168, `availability` GET ~line 178 |
| `backend/app/services/documento_service.py` | import line 6, `create_document` ~line 54 |

---

## Conventional Commit Message

```
fix(security): enforce ownership checks on broker assignment and document attachment

- assign_broker / unassign_broker: verify caller owns or manages the
  target property before allowing broker mutations (GAP 1 & 2)
- create_document: prevent corretores from attaching docs to foreign
  properties; admin/imobiliaria roles bypass the check (GAP 3)
- GET availability: require valid JWT; endpoint was fully public (GAP 4)
- Router: inject current_user explicitly for unassign_broker so the
  service receives the resolved user object (was: dependencies=[...])
```

---

## Technical Decisions

### Why `owns` uses OR (direct listing OR agency relationship)

A property can be "owned" by the acting user in two distinct ways:

1. **Direct listing** — `prop.corretor_id == current_user.id`: the broker is directly assigned as the listing agent.
2. **Agency relationship** — `prop.corretor.imobiliaria_id == current_user.id`: the logged-in user is the imobiliaria that employs the listing broker, granting supervisory authority over that property.

Using OR covers both legitimate principals without requiring a separate admin bypass for agencies. An AND would be overly restrictive (an agency user is never simultaneously the individual corretor).

### Why admin/imobiliaria bypass the document ownership check (GAP 3)

Admins require unrestricted access for operational support, compliance archiving, and back-office workflows — ownership-scoped checks would block legitimate platform management. Imobiliaria users manage portfolios across multiple corretores; requiring them to be the direct `corretor_id` on every property would break multi-agent workflows. The bypass is intentionally scoped to those two trusted profiles, keeping corretores under the ownership constraint.

### Why `unassign_broker` needed explicit injection rather than a dependency list (GAP 2)

`dependencies=[Depends(get_current_user)]` in FastAPI runs the dependency for its side-effects (e.g., raising 401 if no valid token) but discards the return value — the resolved `Usuario` object is never bound to a name and cannot be passed to downstream calls. Changing to `current_user: Usuario = Depends(get_current_user)` binds the resolved object to a parameter, making it available to pass into `unassign_broker(db, property_id, broker_id, current_user)`. This is the standard FastAPI pattern when the resolved value is needed beyond authentication gating.
