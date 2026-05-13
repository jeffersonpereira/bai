# Bug-Fix Session: Admin Panel & Core Stability
**Date:** 2026-05-06
**Scope:** 14 bugs fixed across frontend (Next.js) and backend (FastAPI)
**Severity breakdown:** 2 Critical · 6 High · 5 Medium · 1 Low

---

## Summary

This session addressed a broad sweep of accumulated bugs spanning authentication, property state management, API contract mismatches, admin role enforcement, CORS configuration, and defensive UI programming. The fixes collectively harden the admin panel, eliminate silent data-loss paths, and bring frontend type contracts into alignment with backend enums.

---

## Conventional Commit Message

```
fix: resolve 14 bugs across auth, admin, documents, and property modules

CRITICAL
- fix(auth): replace out-of-scope logout() call with inline cleanup in AuthContext.tsx; add router to useCallback deps (BUG-2)
- fix(dashboard): correct status→situacao field name in property state update (page.tsx:113) (BUG-1)

HIGH
- fix(imoveis): rename filter param "title"→"titulo" in frontend query and backend route handler (BUG-3)
- fix(admin): add premium_users to admin_service.get_stats(); delegate stats router to service, remove duplicate logic (BUG-4+20)
- fix(documents): add null guard for v.criado_em before date rendering (page.tsx:827) (BUG-5)
- fix(usuarios): restrict UserAdminUpdate.perfil to Literal enum; add self-role-change guard in admin router (BUG-6)
- fix(cors): move origin regex to settings.CORS_ORIGIN_REGEX, remove hardcoded value in main.py (BUG-7)
- fix(documents): replace Promise.all with Promise.allSettled to prevent cascade failure on partial errors (BUG-8)

MEDIUM
- fix(types): narrow User.role and UserAdmin.perfil from string to explicit union literals (BUG-9+11+13)
- fix(admin/properties): split combined useEffect into separate auth-guard and fetch effects (BUG-10)
- fix(admin/configuracoes): add gateway and key validation guards before allowing "Testar Conexão" (BUG-14)
- fix(layout): create ErrorBoundary component; wrap dashboard layout children (BUG-15)
- fix(admin/properties): add defensive validation for API response shape (BUG-16)

LOW
- fix(header): add early return guard when token is absent in handleScrape (Header.tsx:121) (BUG-19)
```

---

## Technical Decisions

### BUG-2 — Inline logout instead of calling `logout()` from AuthContext

`logout()` was referenced inside a `useCallback` that was defined *before* `logout` was in scope (or captured a stale closure). Calling `logout()` in that position caused either a "not a function" runtime error or silently operated on stale state. The fix inlines the equivalent cleanup logic (clear token, clear user, redirect) directly inside the callback and adds `router` to the dependency array. This is the correct pattern when the function you want to call is itself a closure whose identity changes — inlining eliminates the dependency chain problem entirely.

### BUG-8 — `Promise.allSettled` over `Promise.all`

`Promise.all` rejects immediately on the first failure, meaning a single bad document fetch would silently discard results for all other documents. `Promise.allSettled` waits for every promise to resolve or reject, then returns a results array that distinguishes fulfilled from rejected outcomes. The caller can then render whatever succeeded and surface per-item errors — correct behavior for a bulk document load where partial data is better than no data.

### BUG-6 & BUG-9/11/13 — `Literal` / explicit union for `perfil` / `role`

Using plain `string` on role/profile fields allows any value to pass validation at the type and schema layer. This is a data integrity risk: a typo or a client sending an unsupported value would be accepted and persisted. Narrowing to `Literal["comprador","corretor","imobiliaria","admin"]` (Python) and the equivalent union type (TypeScript) makes both the API schema and the frontend type-checker reject invalid values at the boundary. The self-role-change guard in the admin router is a complementary runtime check — a logged-in admin cannot demote themselves, preventing accidental lockout.

### BUG-7 — CORS regex in settings

Hardcoding a regex pattern directly in `main.py` means any environment-specific origin policy requires a code change. Moving it to `settings.CORS_ORIGIN_REGEX` follows the existing configuration pattern in the project and allows per-environment overrides via `.env` without touching application code.

### BUG-10 — Split `useEffect` in `admin/properties/page.tsx`

A single `useEffect` that does both auth-guard logic and data fetching creates ambiguous dependency arrays and makes it impossible to clearly reason about when each side effect fires. Splitting into two effects — one that only runs the auth redirect check and one that only fetches data — gives each effect a clean, minimal dependency list and makes the control flow explicit.

---

## Files Changed

### Frontend (`frontend/src/`)

| File | Change |
|---|---|
| `app/components/AuthContext.tsx` | Inline logout cleanup; add `router` to useCallback deps |
| `app/dashboard/page.tsx` | `status` → `situacao` (line 113); `"title"` → `"titulo"` filter param (line 68) |
| `app/documents/page.tsx` | `Promise.all` → `Promise.allSettled` (line 242); null guard for `v.criado_em` (line 827) |
| `app/admin/properties/page.tsx` | Split useEffect; add API response shape validation |
| `app/admin/configuracoes/page.tsx` | Add gateway/key validation before "Testar Conexão" |
| `app/components/Header.tsx` | `if (!token) return` guard in `handleScrape` (line 121) |
| `app/components/ErrorBoundary.tsx` | New component; wraps dashboard layout children |
| `app/dashboard/layout.tsx` (or equivalent) | Wrap children with `<ErrorBoundary>` |
| `types/usuario.ts` (or equivalent) | Narrow `User.role` and `UserAdmin.perfil` to union literals |

### Backend (`backend/app/`)

| File | Change |
|---|---|
| `routers/imoveis.py` | Rename filter param `"title"` → `"titulo"` (line 58) |
| `routers/admin.py` | Delegate stats to `admin_service`; add self-role-change guard |
| `services/admin_service.py` | Add `premium_users` count to `get_stats()` |
| `schemas/usuario.py` | Restrict `UserAdminUpdate.perfil` to `Literal[...]` |
| `main.py` | Remove hardcoded CORS regex; read from `settings.CORS_ORIGIN_REGEX` |
| `core/config.py` (or `settings.py`) | Add `CORS_ORIGIN_REGEX` field |

---

## Notes

- BUG-4 and BUG-20 were resolved together: the duplication in the stats endpoint was the root cause of both issues.
- BUG-9, BUG-11, and BUG-13 were resolved in a single pass by tightening the type definitions shared across schemas and TypeScript interfaces.
- No database migrations were required for this session.
- No new external dependencies were introduced.
