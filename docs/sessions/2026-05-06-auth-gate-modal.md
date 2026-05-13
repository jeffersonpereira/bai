# Session: Auth Gate Modal para Agendamento/Proposta

**Date:** 2026-05-06
**Branch:** master

---

## Feature Summary

Implemented an inline authentication gate modal that intercepts unauthenticated users attempting to schedule a property visit ("Agendar Visita") or submit a proposal ("Fazer Proposta"). Instead of redirecting to `/login` and losing page context, a self-contained modal appears in-place with Login and Register tabs. After successful authentication the originally intended action modal opens automatically.

---

## Conventional Commit Message

```
feat(properties): add auth gate modal for visit scheduling and proposal actions

Unauthenticated users clicking "Agendar Visita" or "Fazer Proposta" on a
property detail page now see an inline modal with Login/Register tabs instead
of being redirected to /login. A pendingAction state defers the target modal
until authentication succeeds, preserving page context throughout the flow.
```

---

## Files

### Created
- `frontend/src/app/components/AuthGateModal.tsx` (~190 lines)

### Modified
- `frontend/src/app/properties/[id]/page.tsx`

---

## Technical Decisions

### 1. Inline modal vs. redirect to /login

**Decision:** Show an inline `AuthGateModal` overlaying the current property page instead of navigating away to `/login`.

**Rationale:** Redirecting to `/login` forces the user to leave the property detail page. After login they land on a generic dashboard or a saved `returnUrl`, but the property's scroll position, open photo gallery, or any other ephemeral UI state is lost. An inline modal preserves full context — the property stays visible behind the backdrop, the user can close without committing, and the post-auth callback fires directly with no navigation round-trip. This is the standard UX pattern for e-commerce "add to cart while guest" flows and reduces drop-off on high-intent actions.

### 2. `pendingAction` pattern (deferred execution)

**Decision:** Store the intended action (`'visit' | 'proposal' | null`) in a `pendingAction` state variable and evaluate it inside `handleAuthSuccess` to open the correct modal.

**Rationale:** The auth modal is asynchronous — login/register can fail, the user can close the modal, or they can switch between tabs. Storing the intended action as state decouples the trigger (button click) from the consequence (open visit/proposal modal). This avoids prop-drilling callbacks deep into `AuthGateModal`, keeps the guard logic in one place (`handleAuthSuccess`), and makes it trivial to add a third guarded action in the future by extending the union type and the switch/if block.

### 3. `imobiliaria` omitted from register perfil options

**Decision:** The Register tab exposes only `comprador` (buyer) and `corretor` (agent/broker) as selectable roles; `imobiliaria` (real estate agency) is not offered.

**Rationale:** An `imobiliaria` account represents an organisation, not an individual, and its creation involves additional verification, plan selection, and CNPJ/tax data that cannot be handled in a lightweight inline form. Users arriving at a property detail page are either looking to buy or are agents acting on a client's behalf — neither use-case maps to creating a new agency account mid-session. Agency registration is handled through a dedicated onboarding flow outside the property browsing context.

---

## Component API

```tsx
<AuthGateModal
  isOpen={showAuthModal}
  onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
  onAuthSuccess={handleAuthSuccess}
  actionType={pendingAction ?? 'visit'}   // drives the context-aware banner
/>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Controls modal visibility |
| `onClose` | `() => void` | Called on backdrop click, close button, or ESC |
| `onAuthSuccess` | `() => void` | Called after token stored in AuthContext |
| `actionType` | `'visit' \| 'proposal'` | Determines the banner copy |

---

## Auth Flow Sequence

```
User (unauthenticated)
  → clicks "Agendar Visita" / "Fazer Proposta"
  → handleScheduleVisitClick / handleMakeProposalClick
      setPendingAction('visit' | 'proposal')
      setShowAuthModal(true)
  → AuthGateModal renders
      user logs in or registers
      calls login(access_token) via AuthContext
      calls onAuthSuccess()
  → handleAuthSuccess
      setShowAuthModal(false)
      if pendingAction === 'visit'  → setShowVisitModal(true)
      if pendingAction === 'proposal' → setShowProposalModal(true)
      setPendingAction(null)
```

---

## Error Handling

- **HTTP 422 (Pydantic validation):** Response body is an array of `{loc, msg, type}` objects. `AuthGateModal` maps the array to a single display string joining all `msg` values.
- **HTTP 401/400:** Message extracted from `detail` field of the JSON response body.
- **Network failure:** Generic fallback message shown in the form error area.
- Scroll is locked (`overflow: hidden` on `document.body`) while the modal is open and restored in the cleanup effect.
