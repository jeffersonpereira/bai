---
name: twin-workflow
description: Interactive twin agents workflow with router and specialist selection, following the flow workflow -> router -> analyst -> planner -> specialist -> reviewer -> documenter
trigger: /twin-workflow
parameters:
  - name: task
    type: string
    required: false
    description: Feature to build or bug to fix (not needed when continuing)
  - name: quality
    type: string
    required: false
    description: Quality level (pragmatic, balanced, strict) - default is strict
  - name: specialist
    type: string
    required: false
    description: (optional) force a specific specialist, e.g. data-engineer, devops, frontend-react, backend, mobile-flutter, security, infrastructure, developer
---

# Twin Development Workflow - Router-aware Interactive Mode

Task: $ARGUMENTS
Quality Level: ${quality:-pragmatic}

This version integrates a `twin-router` step to detect and confirm which specialist should execute the implementation.
Flow: `workflow -> router -> analyst -> planner -> specialist -> reviewer -> documenter`

## 🔄 Workflow Execution Logic (updated)

First, check if `./twin-plan-current.md` exists to determine workflow phase:

```bash
Check for ./twin-plan-current.md
```

### 📋 PHASE 1: If Plan File NOT EXISTS (Discover & Create Plan)

Execute planning phase with router confirmation:

```
Quality Level: ${quality:-pragmatic}

IMPORTANT: Execute agents SEQUENTIALLY - DO NOT run in parallel.
```

1. **ROUTER (NEW)**: Use `twin-router` to analyze the user's task and suggest the most appropriate specialist.
   - If user provided `--specialist`, router respects it and skips suggestion step.
   - Router prints suggested specialist and asks user to confirm:
     - Confirm (yes) → proceed
     - Change specialist (provide name) → router accepts and proceeds
     - Cancel → abort workflow
   - Router writes selection into a temporary meta (e.g., `./twin-plan-meta.yaml` or top of `twin-plan-current.md` when created).

2. **ANALYST**: Use `twin-analyst` to analyze the task with awareness of the chosen specialist.
   - Analyst should tailor the analysis based on specialist context (e.g., if specialist=data-engineer, include data schema, Glue Catalog, sample dataset).
   - Output: concise analysis of current state + constraints.

3. **PLANNER**: Use `twin-planner` to create the implementation plan, using analyst's results and the selected specialist context.
   - List files to modify, exact changes, order of changes.
   - Include QA validation steps suited to the specialist (e.g., Playwright for frontend, Glue local testing for data jobs, terraform plan for infra).
   - Save plan to `./twin-plan-current.md` with a header that includes:
     - Selected Specialist: <name>
     - Selection Reason: <explicit|keyword|heuristic|user_override>
     - Timestamp

4. **PAUSE & PROMPT**: Display the plan to the user and STOP for explicit approval:
   ```
   Plan created and saved to ./twin-plan-current.md
   Selected Specialist: <name>
   To proceed type: ok, continue, approve
   To cancel type: cancel
   ```

### 💻 PHASE 2: If Plan File EXISTS (Execute Plan)

When user types 'ok', 'continue', or runs the command again:

1. Read the plan from `./twin-plan-current.md` and extract:
   - Task description
   - Quality level
   - Implementation steps
   - Selected Specialist

2. Show starting message:
   ```
   🚀 Found approved plan. Starting implementation using <Selected Specialist>...
   ```

3. Start Implementation → Review → Document loop:

   Loop until QA validation passes (or until user cancels / escalates):

   a. **SPECIALIST**: Invoke the selected specialist twin (instead of always twin-developer).
      - Mapping examples:
        - `data-engineer` → `twin-data-engineer` (PySpark/Glue jobs)
        - `devops` → `twin-devops` (CI/CD, k8s manifests)
        - `infrastructure` → `twin-infrastructure` (Terraform, networking)
        - `security` → `twin-security` (auth, secrets, threat mitigation)
        - `mobile-flutter` → `twin-mobile-flutter` (Flutter UI, builds)
        - `frontend-react` → `twin-frontend-react` (React components, routes)
        - `backend` → `twin-backend` (API endpoints, services)
        - fallback `developer` → `twin-developer` (general changes)
      - Specialist implements the steps from `twin-plan-current.md` following the `quality` level.
      - Specialist should output:
        - Files changed/created
        - Short summary of implementation
        - Any blockers or deviations from plan

   b. **REVIEWER**: Invoke `twin-reviewer` to review the specialist's changes.
      - Reviewer must use checks relevant to the specialist's domain (multi-stack support).
      - If reviewer returns "approve" → proceed
      - If reviewer returns "needs changes" → return to Specialist with reviewer notes

   c. **TESTER (optional)**: If your workflow includes twin-tester, run QA validation steps defined in the plan.
      - If tests fail → generate bug reports and loop back to Specialist.
      - If tests pass → proceed.

   d. **DOCUMENTER**: After approval and successful QA, invoke `twin-documenter` to create session documentation:
      - Changelog entries (conventional commits)
      - Technical decisions and migration/rollback notes
      - Any infra/resource references (IDs, S3 paths, etc.)

4. **Archive and cleanup**:
   - Move plan to `./twin-plans/[YYYY-MM-DD-HH-MM]-plan.md`
   - Save session documentation in `./docs/sessions/`
   - Delete `./twin-plan-current.md` and `./twin-plan-meta.yaml` if used

5. **Show completion message** with summary and links.

## 🔁 Notes on Agent Ordering & Responsibilities

- The **router** must run *before* analyst so the analyst tailors analysis to the selected specialist context.
- The **analyst** feeds the **planner** with constraints/specifics.
- The **planner** creates specialist-aware plans.
- The **specialist** executes implementation; do **not** use `twin-developer` as a default executor.
- The **reviewer** is specialist-aware and verifies domain-specific concerns.
- The **documenter** always runs at the end to produce changelog and decisions.

## 🔧 Minimal changes required in your existing workflow file
- Add the `twin-router` invocation before `twin-analyst` in Phase 1.
- Persist selected specialist in the generated plan file header.
- Replace the fixed `twin-developer` call in Phase 2 with a dynamic call to the selected specialist twin.
- Ensure `twin-reviewer` uses specialist-aware checks (already updated).
- Ensure `twin-documenter` captures specialist-specific artifacts (already updated).

## ✅ Validation: Does each twin get called in correct order for your desired flow?
Yes — with the modifications above the order becomes:

```
workflow -> router -> analyst -> planner -> specialist -> reviewer -> documenter
```

This preserves planning pause/approval semantics and makes execution specialist-aware.

## ⚠️ Edge cases & recommendations
- If router suggests a specialist but user cancels, abort gracefully and keep no partial state.
- For ambiguous tasks, router should suggest multiple candidates and allow user pick or fallback to `planner` to propose.
- Log selection reason in the plan (explicit, keyword, heuristic, user_override) for auditability.
- If specialist cannot complete (missing permissions or environment), specialist should return clear error and optionally escalate to `twin-planner` or `twin-analyst` for replanning.

## 📁 Updated workflow file
This file replaces the previous `twin-workflow.md` with router-aware logic. Save as `twin-workflow.md` to replace your current workflow.

