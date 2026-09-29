# Twenty "Related Fields" Plugin — Capability Research & Implementation Plan

Status: architecture review complete, implementation not started.
Target: Twenty Apps framework as shipped in this checkout (`twenty-sdk` 2.39.0, `twenty-ui` 1.0.0-alpha.1).
Deliverable: portable Twenty App, developed outside Twenty core, transferable to another Twenty instance.
Source requirements: `twenty_related_fields_plugin_requirements.md` (v1.0, sections referenced as §N).

---

## 1. Method

Everything below was verified against this working copy. Evidence is given as `path` (+ line where useful).
No core file was modified. Two research rules from §195 were applied: only SDK/App/API surface counts as
supported, and the plugin must remain installable through the standard App mechanism.

Primary evidence sources:

| Area | Evidence |
| --- | --- |
| App definition API | `packages/twenty-sdk/src/sdk/define/index.ts` (full export list) |
| App runtime (logic functions) | `packages/twenty-sdk/src/sdk/logic-function/index.ts`, `src/sdk/logic-function/**` |
| App runtime (front components) | `packages/twenty-sdk/src/sdk/front-component/index.ts`, `front-component/globals/frontComponentHostCommunicationApi.ts` |
| Front component sandbox | `packages/twenty-front-component-renderer/src/host/fetch/utils/buildHostFetchPolicyFromFrontComponentUrls.ts`, `src/remote/worker/environment/utils/setWorkerEnvironmentVariablesFromRenderContext.ts` |
| Event payloads | `packages/twenty-shared/src/database-events/*.ts` |
| Trigger filtering | `packages/twenty-server/src/engine/core-modules/logic-function/logic-function-trigger/triggers/database-event/**` |
| Token/permission semantics | `packages/twenty-server/src/engine/core-modules/auth/strategies/jwt.auth.strategy.ts` (`validateApplicationToken`, L332), `.../logic-function-executor.service.ts` (L440–462), `.../permissions/permissions.service.ts` (L147–289) |
| Metadata API | `packages/twenty-client-sdk/src/metadata/generated/schema.graphql`, `twenty-server/.../field-metadata/{field-metadata.resolver.ts,controllers/field-metadata.controller.ts,dtos/create-field.input.ts}`, `.../flat-field-metadata/utils/get-default-flat-field-metadata-from-create-field-input.util.ts` |
| Writability | `packages/twenty-server/src/engine/twenty-orm/repository/validate-writability-or-throw.util.ts`, `packages/twenty-shared/src/types/MetadataWritability.ts` |
| Documented capability list | `packages/twenty-docs/developers/extend/apps/**` |
| Real-world precedent | `packages/twenty-apps/public/last-contact/**` (event-driven + backfill + aggregation app), `packages/twenty-apps/examples/media-notes`, `.../document-generator` |

---

## 2. Research checklist results (§194)

### 2.1 Can an app dynamically create fields on standard objects at runtime? — YES (APP_WITH_LIMITATION)

* `createOneField` / `updateOneField` / `deleteOneField` exist on the metadata API
  (`metadata/generated/schema.graphql` L3313–3315, L6926–6928) and over REST at
  `/rest/metadata/fields` (`field-metadata.controller.ts` L59).
* Both are guarded by `SettingsPermissionGuard(PermissionFlagType.DATA_MODEL)`
  (`field-metadata.resolver.ts` L245; `field-metadata.controller.ts` L59–63).
* The guard resolves permissions as **user role ∩ application default role**
  (`permissions.service.ts` L205–222 → `resolveRoleIdsForUser` → `checkRolesPermissions({intersectionOf})`).
  So creating a destination field from the settings UI requires the acting admin **and** the app's default
  role to hold `DATA_MODEL`.
* `CreateFieldInput` exposes `type, name, label, description, icon, isActive, isSystem, isUIEditable,
  isUIReadOnly, isNullable, isUnique, defaultValue, options, settings, objectMetadataId,
  isLabelSyncedWithName, relationCreationPayload, morphRelationsCreationPayload`
  (schema.graphql L4772–4792) — no `writability`, and `universalIdentifier` is `@HideField()` in GraphQL
  (`create-field.input.ts` L31–34: `@HideField() universalIdentifier?: string`).
  On the REST body path there is no whitelist (`@UsePipes(new ValidationPipe())`, L72), so
  `universalIdentifier` **is** accepted there and used (`get-default-flat-field-metadata-from-create-field-input.util.ts`
  L57: `universalIdentifier: createFieldInput.universalIdentifier ?? v4()`). This is undocumented surface —
  treat as opportunistic, not load-bearing.
* Fields created this way default to `writability: OPEN` (same util, L69), i.e. not locked to the app.
* Implication: materialized destination fields are creatable at runtime, but (a) require the `DATA_MODEL`
  flag on the app role, (b) are plain user fields that survive app uninstall, and (c) must not be assumed
  portable across workspaces (§95 allows this explicitly).

### 2.2 Can an app query all object/field metadata from a front component? — YES

* `MetadataApiClient` is a first-class SDK client (`twenty-client-sdk/metadata`) targeting
  `${TWENTY_API_URL}/metadata` (`generate/generate-metadata-client.ts` L43) and is importable inside front
  components (precedent: `packages/twenty-apps/examples/media-notes/src/components/media-notes.front-component.tsx` L2, L38).
* The sandbox fetch proxy allows exactly the Twenty API origin and the app functions origin
  (`buildHostFetchPolicyFromFrontComponentUrls.ts` L22–27), both of which are what these clients use.
* The metadata schema exposes what the wizard needs: `objects` (with `universalIdentifier`, labels, `isActive`,
  `isCustom`), `fields` with `type`, `name`, `label`, `options`, `isActive`, `isUIEditable`, `writability`,
  `relation { type, sourceObjectMetadata, targetObjectMetadata, sourceFieldMetadata, targetFieldMetadata }`
  and enum `FieldMetadataType` incl. `MORPH_RELATION` (schema.graphql L2336–2385).
* Known gap, from the media-notes example comment: object queries cannot always be filtered by
  `universalIdentifier` in practice, so resolution needs a paged fallback; `ObjectFilter` does declare
  `universalIdentifier` (schema.graphql L3660), so behaviour must be verified per instance.

### 2.3 Can a front component read current record context reliably? — PARTLY (APP_WITH_LIMITATION)

* `FrontComponentExecutionContext` = `{ frontComponentId, userId, recordId, selectedRecordIds,
  timelineActivityId, colorScheme, locale }`
  (`twenty-sdk/src/sdk/front-component/types/FrontComponentExecutionContext.ts`).
* There is **no object name / object metadata in the context**; `recordId` is only set when exactly one record
  is selected (`useFrontComponentExecutionContext.ts` L441).
* Mitigation: the app declares per-object widget wrappers (object name baked into the component) for the
  standard record pages it ships tabs for, plus a generic widget that resolves the object by probing the
  destination objects that actually have definitions (bounded by definition count, cached per render).
* `useUserId()`, `useColorScheme()`, `useFrontComponentId()` are available for provenance and theming.

### 2.4 Can app UI honor current-user permissions instead of only app-role permissions? — YES (APP_NATIVE)

This is the strongest finding of the research.

* Front components receive a **delegated** application access token: the host mints
  `generateApplicationTokenPair({ userId, userWorkspaceId, applicationId })` and injects it as
  `TWENTY_APP_ACCESS_TOKEN` (`twenty-server/.../front-component/front-component.resolver.ts` L82–88,
  `setWorkerEnvironmentVariablesFromRenderContext.ts` L27–29); the docs state it is "scoped to the signed-in
  person's role intersected with your app's".
* Token validation builds an auth context carrying both `application` and `user`/`userWorkspace`
  (`jwt.auth.strategy.ts` L360–382), and permission checks then intersect the two roles
  (`permissions.service.ts` L205–222).
* Logic functions: `TWENTY_APP_ACCESS_TOKEN` is the *delegated* token when a person triggered the run, falling
  back to the pure application token for cron/install (`logic-function-executor.service.ts` L440–462). The
  typed clients default to that delegated identity (`runAs: 'user'`); `runAs: 'application'` is opt-in.
* Queued jobs inherit the acting user ("The queued run inherits the acting user of the function that enqueued
  it", `docs/.../logic/background-jobs.mdx`).
* Implication: Live reads are permission-safe by construction (§64 = APP_NATIVE), with no core change and no
  "app-role bypass" risk. A Live value is only shown if the viewer could read it on the source record.

### 2.5 Can a front component be automatically inserted into standard object layouts? — PARTLY

* Declaratively: `definePageLayoutTab()` can add a tab (with a `FRONT_COMPONENT` widget) to a standard layout
  by universal identifier, e.g. `STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage`
  (`docs/.../layout/page-layouts.mdx`, `sdk/define/page-layouts/standard-page-layout-ids.ts`).
  This is code-declared at install/upgrade time → APP_NATIVE for the objects we enumerate (Company, Person,
  Opportunity, …).
* A `FRONT_COMPONENT` widget can carry `headerCommandMenuItemUniversalIdentifiers` as widget-header actions —
  the natural place for "Sync now" / "Validate".
* At runtime for arbitrary objects: the metadata API does expose `createPageLayoutWidget`,
  `createPageLayoutTab`, `createPageLayout` and `updatePageLayoutWithTabsAndWidgets`
  (schema.graphql L3818–3829) — but guarded by `SettingsPermissionGuard(PermissionFlagType.LAYOUTS)`
  (`page-layout-widget.resolver.ts` L97–124). So auto-adding a widget to a custom object's layout is possible
  but needs the `LAYOUTS` flag and explicit admin action → APP_WITH_LIMITATION.
* List/table columns: `WidgetType` has no per-column extension point (`twenty-shared/src/types/page-layout/WidgetType.ts`),
  so a virtual related-field **column** in a list view is not reachable → CORE_EXTENSION_REQUIRED (materialized
  fields give the real column today, exactly as §77 predicts).

### 2.6 Can app logic functions subscribe dynamically to database events, or must triggers be static? — Dynamic dispatch IS possible (APP_NATIVE)

* Triggers are declared statically per function, but the `eventName` supports **wildcards**:
  `person.updated`, `*.created`, `company.*` (`docs/.../logic/logic-functions.mdx` L59–62).
* `DatabaseEventTriggerSettings` = `{ eventName, updatedFields? }`
  (`twenty-shared/src/application/logicFunctionManifestType.ts` L22–25): `updatedFields` is a *static*
  pre-filter, applied in `transform-event-batch-to-event-payloads.ts` L57–79.
* Implication: one fixed set of dispatcher functions (`*.created`, `*.updated`, `*.deleted`, `*.destroyed`)
  serves every mapping, including mappings users create later — §68's "central dispatcher, no function per
  mapping" is satisfiable without generated functions. Field-level filtering that depends on *user config*
  must happen in code, from the payload (see 2.7).
* The platform throttles app job enqueue per application
  (`call-database-event-trigger-jobs.job.ts` L~90 `applicationJobEnqueueThrottlerService.throttleOrThrow`,
  which skips with a warning rather than failing) — the engine must be cheap per event and tolerant of
  skipped events (reconciliation exists precisely for that).

### 2.7 Does the event payload include changed fields / previous values? — YES (APP_NATIVE)

* `ObjectRecordUpdateEvent.properties = { updatedFields: string[], diff, before, after }`;
  `create/delete/restore/upsert` variants add `before`/`after`/`updatedFields`/`diff`
  (`twenty-shared/src/database-events/*.event.ts`).
* The envelope adds `recordId`, `userId`, `userWorkspaceId`, `workspaceMemberId` plus
  `objectMetadata` (nameSingular, namePlural, labels, `universalIdentifier`, `applicationId`, `isCustom`,
  `isActive`, `isSystem`, `isAuditLogged`, field universal identifiers) — `database-event-payload.type.ts`.
* Implication: §69 change-field optimization is APP_NATIVE (match `updatedFields` against configured relation
  and source field names — no re-fetch needed to decide), and the dispatcher can identify objects by canonical
  name *and* universal identifier, so no object names are hardcoded (§9.1).

### 2.8 Is there a supported background job / queue primitive? — YES (APP_NATIVE)

* `enqueueJobs` / `enqueueJob` (deprecated) / `getJobs` from `twenty-sdk/logic-function`
  (`sdk/logic-function/jobs/*`, `twenty-shared/src/application/enqueueJobType.ts`).
* Properties that matter for §45–47/§89: up to 200 jobs per call, per-job `jobId` that doubles as an
  **idempotency key**, `delayMs` (0–7 days), `retryLimit` (apps capped at 3), status polling
  (`WAITING/PRIORITIZED/DELAYED/ACTIVE/COMPLETED/FAILED`), retention 4 h after completion / 7 days after
  failure (`docs/.../logic/background-jobs.mdx`).
* Function runs are capped by `timeoutSeconds` (max 900); `RetryableLogicFunctionError` gives exponential
  backoff retries for transient errors only.
* `kv` (app key-value store, scopes `WORKSPACE` and `SERVER`, `appKeyValueScopeType.ts`) provides resumable
  cursor/progress state without new objects.
* Implication: batched, resumable, progress-reporting backfill and fan-out are APP_NATIVE, with the documented
  chunk-and-recurse pattern. Precedent to copy: `packages/twenty-apps/public/last-contact` (offset windows,
  `buildBackfillBatchArgs`, retry wrapper, batch-size/sleep server variables).

### 2.9 Can materialized fields be marked read-only? — PARTLY (APP_WITH_LIMITATION)

* `isUIEditable: false` / deprecated `isUIReadOnly: true` is available on create and update
  (schema.graphql L4780–4781, L4810–4811) and is a **UI-level** flag; it is not enforced in the ORM/API write
  path (`grep isUIReadOnly` finds no enforcement outside metadata defaults).
* Server-enforced read-only exists only through `writability: OPEN | APPLICATION | SYSTEM`
  (`MetadataWritability.ts`), enforced in `validate-writability-or-throw.util.ts` for both objects and fields.
  `APPLICATION` means "only this owning application may write, via an APPLICATION_ACCESS token".
  But `writability` is excluded from `CreateFieldInput`/`UpdateFieldInput` (L4772–4811) and app-created
  dynamic fields default to `OPEN`, and it cannot be set through the metadata API.
* Consequence for the MVP: materialized fields are created with `isUIEditable: false` plus a provenance
  description ("Synced by Related Fields from Company → Email. Manual changes may be overwritten."), which
  satisfies §90's documented fallback. Forcing `APPLICATION` writability would require a core change
  (out of scope) — this is the one place where the spec's strongest option is withheld.

### 2.10 Can app-originated updates suppress timeline noise? — NO (CORE_EXTENSION_REQUIRED for suppression)

* Timeline/audit routing keys off `objectMetadata.isAuditLogged`
  (`modules/timeline/services/timeline-activity-routing-plan.service.ts` L56) and is generated from the same
  record events the app receives; there is no per-mutation opt-out, no "silent write" parameter on record
  update inputs, and no app-facing suppression API.
* Mitigation available today (APP_NATIVE):
  1. compare-before-write (§35) so unchanged values never write;
  2. **collapse all materialized fields of one destination record into a single update mutation** so a sync
     produces one event/audit row instead of N;
  3. attribute app activity explicitly where it matters with `createTimelineActivity` +
     `defineTimelineActivityType` (`sdk/logic-function/timeline/create-timeline-activity.ts`,
     `sdk/define/timeline-activity-types/…`) so syncs are explainable in the timeline.
* Document as a limitation (§135/§136), do not patch core.

### 2.11 Can dynamically created app fields receive portable universal identifiers? — CONSTRAINED (APP_WITH_LIMITATION)

* With the documented GraphQL metadata API: no (`universalIdentifier` is `@HideField()`; server generates
  `v4()` when absent).
* On the REST body path the value is currently honoured, but it is undocumented and therefore not a foundation.
* The supported portable path is the **code-declared** one: app objects and fields declared with
  `defineObject`/`defineField` keep stable `universalIdentifier`s across installs and upgrades.
* Therefore: definitions, sync logs and groups are **app-declared objects** (portable by construction, and
  auto-migrated on upgrade); materialized destination fields are **workspace metadata** created at runtime and
  are explicitly excluded from portability guarantees. Export/import must re-create or re-map them (§58/§95),
  and §95's expectation is met by design rather than by a trick.

### 2.12 Can standard list views expose virtual/computed values from app components? — NO (CORE_EXTENSION_REQUIRED)

* `WidgetType` (page-layout widgets) has no list-column type; `defineView`/`defineViewField` only bind real
  field metadata. No SDK extension point exists for a computed column.
* MVP list support is therefore delivered through materialized fields (real columns, filterable/sortable/
  exportable), exactly as §77 strategy B prescribes. A native virtual column stays a future capability.

### 2.13 Can relation metadata include junction/morph relations in a stable API? — YES (APP_NATIVE, with care)

* `Field.relation { type: RelationType! sourceObjectMetadata targetObjectMetadata sourceFieldMetadata
  targetFieldMetadata }` and `FieldMetadataType.MORPH_RELATION` are exposed (schema.graphql L2336–2385).
  `RelationType` is `ONE_TO_MANY | MANY_TO_ONE`.
* Junction (many-to-many) relations materialize as the standard pair of `ONE_TO_MANY`/`MANY_TO_ONE` fields, so a
  one-hop mapping through them is *not* deterministic — those paths are rejected in MVP (§12, §39, §40) and
  flagged in validation.
* Tasks/Notes relations: keep the §139 stance — mark them experimental in the wizard until verified on the
  target workspace, no assumptions.

### 2.14 Two extra findings that shape the design

* **The front component ↔ logic function boundary is HTTP only** (`docs/.../layout/front-components.mdx`:
  "There is no direct in-process call"). A headless front component calls an app route through
  `RestApiClient` with a `/s/...` path; that route is a logic function with `httpRouteTriggerSettings`.
  Any settings mutation that needs app-scope (metadata writes, bulk jobs) goes through such a route.
* **Front component sandbox constraints** are explicit and must be designed around: no portals
  (Radix/MUI popovers render nothing → use inline overlays or unsupported-library-free components), no
  `ResizeObserver`/`getComputedStyle` cascade, `className` must be built by hand, only hyphenated
  `aria-*`/`data-*` attributes forward, `fetch` is proxied (no `AbortSignal`, string bodies only), no
  IndexedDB/cookies, CSS reaches the host **unscoped** (prefix every class). Styling should use `twenty-ui`
  components and `useTheme()` tokens for native look and dark mode (§153).

---

## 3. Capability classification (§11)

### APP_NATIVE

| Capability | Mechanism |
| --- | --- |
| Definition storage, groups, sync logs, indexes, views | `defineObject`, `defineField`, `defineIndex`, `defineView`, `defineViewField` (stable universal identifiers, upgraded with the app) |
| Settings UI at Settings → Apps → Related Fields | `defineSettingsFrontComponent` (one per app) |
| Object/field/relation discovery for the wizard | `MetadataApiClient` inside the front component and inside logic functions |
| Current-user-safe Live reads | delegated token (`TWENTY_APP_ACCESS_TOKEN`) = user role ∩ app role, in both front components and logic functions |
| Record-page widget for standard objects | `definePageLayoutTab` + `FRONT_COMPONENT` widget, plus `headerCommandMenuItemUniversalIdentifiers` for per-widget actions |
| Command-menu actions (sync record, validate, backfill) | `defineCommandMenuItem` (+ headless `defineFrontComponent`) |
| Dynamic event dispatch for any object, incl. later user-created mappings | wildcard `eventName` (`*.created`, `*.updated`, `*.deleted`, `*.destroyed`) + payload `objectMetadata` |
| Change-field optimization | `properties.updatedFields` / `diff` / `before` |
| Compare-before-write, one mutation per destination record | plain API-level logic in the sync engine |
| Batched, resumable backfill and large fan-out | `enqueueJobs`/`getJobs`, `kv` progress, `RetryableLogicFunctionError`, 900 s budget, chunk-and-recurse |
| Batch resolve endpoint (§82–85) | `httpRouteTriggerSettings` (`/s/related-fields/resolve`) with grouped source fetches |
| Loop prevention primitives | config-time cycle detection, managed-field bookkeeping, propagation depth, compare-before-write |
| App attributable sync history | `defineTimelineActivityType` + `createTimelineActivity` |
| Least-privilege app role, object/field permissions, row-level predicates | `defineApplicationRole` / `defineRole` |
| Config export/import, migration, machine-readable errors | app-owned data + `kv` + app routes |
| Install/upgrade seeding and migration | `definePostInstallLogicFunction` (`shouldRunOnVersionUpgrade`, `previousVersion`) |

### APP_WITH_LIMITATION

| Capability | Limitation | Mitigation |
| --- | --- | --- |
| Live rendering as a *native field* in the standard Fields widget and in list columns | Apps cannot register a `FieldMetadataType`; no list-column extension point | Live values render in the app's record-page widget; materialized fields give the native column (§77, §178) |
| Creating/altering the materialized destination field at runtime | metadata API needs `DATA_MODEL` on the app role **and** the acting admin; `writability` cannot be set | App declares `DATA_MODEL`; field created with `isUIEditable: false` + provenance description; document the flag |
| Read-only enforcement on materialized fields | `isUIEditable` is UI-only; `writability: APPLICATION` unreachable via API | Read-only in UI + provenance text + guarded writes (§90 fallback) |
| Current *object* context in the widget | execution context exposes only record IDs | Per-object wrapper components for declared tabs; bounded object probing + cache for manually placed widgets |
| Runtime widget insertion into arbitrary object layouts | `createPageLayoutWidget` needs `LAYOUTS` flag, admin action | Static tabs for the objects we ship; documented manual placement elsewhere, optional admin route later |
| Timeline noise from sync writes | no suppression API | single collapsed mutation per record, compare-before-write, explicit `createTimelineActivity` provenance |
| Portable identity for runtime-created destination fields | server-generated `universalIdentifier` | Export/import treats them as re-creatable/re-mappable (§58/§95) |
| Permission for *dynamic* objects (§63) | app role cannot enumerate future mappings | broad read/update on the default role (documented tradeoff) + explicit "app cannot read X" diagnostics from the API error codes |
| Front component sandbox | no portals, no observers, unscoped CSS, proxied fetch | `twenty-ui` + `useTheme()`, prefixed class names, inline overlays, `RestApiClient` |
| One front component ↔ logic function gap | HTTP only, string/URLSearchParams bodies | app routes under `/s/`, batched payloads |
| Tasks/Notes relation paths | unverified many-to-many behaviour (§139) | experimental flag in validator/wizard |

### CORE_EXTENSION_REQUIRED (documented, not built)

| Capability | Why core is needed | Portable-plugin consequence |
| --- | --- | --- |
| Registering a first-class lookup/rollup **field type** usable in field pickers, filters, sorting | no field-type extension point for apps | Live mode lives in the widget; filtering/sorting use materialized fields |
| Virtual computed **list columns** | no list-column extension point | ditto |
| Suppressing audit/timeline rows for app-originated writes | no per-mutation opt-out | noise reduced structurally, documented |
| Forcing `writability: APPLICATION` on app-created fields | excluded from metadata API inputs | UI read-only + docs |

These are also where a later migration to a native Twenty lookup field type plugs in: the
`RelatedFieldDefinition` domain model is intentionally independent of the rendering implementation (§157/§158),
so a native type can be adopted without recreating mappings.

---

## 4. Architecture

### 4.1 Deviations from the spec (decided)

1. **Live resolution happens in the front component**, directly against `/metadata` and the core GraphQL API
   with the delegated token. No logic-function hop for the common path: fewer requests, and permissions are
   enforced by the platform rather than re-implemented. The `/s/related-fields/resolve` route exists for
   non-UI consumers and for parity tests (§82/§83).
2. **Object detection is explicit where possible** (per-object widget wrappers declared with the layout tabs)
   with a documented auto-detect fallback, because the execution context has no object name.
3. **Materialized destination fields are workspace metadata**, not app-owned fields, so that uninstalling or
   upgrading the app cannot destroy user data (§96, §140). Definitions keep a reference by name +
   universal identifier, plus a validation state that survives drift.
4. **Definitions, groups, sync logs are app-declared objects** (portable universal identifiers, schema
   migrations on upgrade); global settings and job cursors live in `kv` to keep the definition schema small.
5. **Groups are Phase 2** but the object model is designed for them from the start so no migration churn.
6. **Rollups, filters, multi-hop > 1, manual override, visibility rules** stay out of MVP (§178).

### 4.2 Application structure

```text
twenty-related-fields/
  package.json                     # yarn, oxlint, vitest, tsgo (scaffold convention)
  vitest.config.ts / vitest.unit.config.ts
  public/logo.svg
  src/
    application-config.ts
    constants/universal-identifiers.ts
    roles/default-function.role.ts
    objects/
      related-field-definition.object.ts
      related-field-sync-log.object.ts
      (phase 2) related-field-group.object.ts
    fields/…                       # fields used by the app's own objects
    views/…                        # admin list views over definitions/logs
    indexes/…                      # definition lookup by destination/source + isActive
    page-layouts/
      company-related-fields.page-layout-tab.ts
      person-related-fields.page-layout-tab.ts
      opportunity-related-fields.page-layout-tab.ts
    front-components/
      related-fields-settings.tsx              # defineSettingsFrontComponent
      related-fields-record-widget.tsx         # generic, object-resolving
      related-fields-company-widget.tsx        # thin wrappers bound to one object
      related-fields-person-widget.tsx
      related-fields-opportunity-widget.tsx
      commands/sync-record.tsx                 # headless: manual sync
      commands/validate-definitions.tsx        # headless: validate all
    command-menu-items/
      sync-related-fields.command-menu-item.ts
      validate-related-fields.command-menu-item.ts
    logic-functions/
      dispatcher/related-fields-record-created.function.ts   # '*.created'
      dispatcher/related-fields-record-updated.function.ts   # '*.updated'
      dispatcher/related-fields-record-deleted.function.ts   # '*.deleted' (soft) + '*.destroyed'
      routes/resolve-related-fields.function.ts              # GET/POST /s/related-fields/resolve
      routes/definitions-crud.function.ts                    # settings mutations (create/update/delete/import)
      routes/create-destination-field.function.ts            # metadata write, admin-only
      routes/backfill.function.ts                            # preview + start
      jobs/sync-record-batch.function.ts                     # one destination record or a small chunk
      jobs/backfill-batch.function.ts                        # offset window job
      jobs/reconcile-batch.function.ts                       # validate & repair
      validate/validate-definitions.function.ts
      install/post-install.function.ts
      install/pre-install.function.ts
    lib/
      adapters/                    # the ONLY place SDK calls live (§127)
        metadata-adapter.ts
        record-adapter.ts
        field-metadata-adapter.ts
        routes-adapter.ts
        jobs-adapter.ts
        kv-adapter.ts
        version-adapter.ts         # centralized SDK/version probes (§159)
      domain/
        types.ts                   # RelatedFieldDefinition, path steps, modes, statuses
        field-type-compatibility.ts
        value-normalizer.ts
        value-formatter.ts
        relation-path.ts
        cycle-detector.ts
        validation.ts
        config-schema.ts
        config-import.ts
        config-export.ts
        config-migration.ts
      sync/
        sync-planner.ts
        sync-engine.ts
        fan-out.ts
        loop-guard.ts
        batch-runner.ts
      ui/                          # shared by settings + widget
        use-related-fields.ts
        resolve-related-fields.ts  # grouped, batched resolution (§132)
        components/…
    __tests__/
      unit/…                       # vitest unit suites (mirrors lib/domain)
      integration/…                # against a local Twenty instance
  docs/README.md, docs/admin.md, docs/user.md   (§160–162)
```

`lib/` never imports `twenty-front/*` or `twenty-server/*`; only `twenty-sdk/*`, `twenty-client-sdk/*`,
`twenty-ui/*`, `twenty-shared/*` and React (§155).

### 4.3 Data model (app-declared objects)

`relatedFieldDefinition` — `name`, `destinationObjectNameSingular`, `destinationObjectUniversalIdentifier`,
`relationPathJson` (array of `{ fieldName, fieldUniversalIdentifier?, targetObjectName,
targetObjectUniversalIdentifier, relationType }`; length 1 in MVP), `sourceObjectNameSingular`,
`sourceObjectUniversalIdentifier`, `sourceFieldName`, `sourceFieldUniversalIdentifier`, `sourceFieldType`,
`sourceFieldLabel`, `mode` (`LIVE` | `MATERIALIZED`), `destinationFieldName`,
`destinationFieldUniversalIdentifier`, `destinationFieldType`, `displayLabel`, `displayDescription`,
`displayFormatJson`, `nullBehavior`, `sourceDeleteBehavior`, `relationDeleteBehavior`, `syncConfigJson`,
`isActive`, `validationStatus`, `validationMessage`, `lastSyncedAt`, `lastBackfillAt`,
`lastReconciledAt`, `managedFieldNamesJson`.

Design notes: every metadata reference carries universal identifier **and** canonical name (§9.2/§93–95);
`managedFieldNamesJson` is what makes loop prevention and change filtering cheap on the event side
(the dispatcher can ignore events whose only changed fields are values this app itself wrote).

`relatedFieldSyncLog` — `definition` (relation), `eventType`, `sourceRecordId`, `destinationRecordId`,
`status`, `errorCode`, `errorMessage`, `startedAt`, `completedAt`, `updatedCount`, `skippedCount`,
`failedCount`; retention and aggregation enforced by a scheduled job (§102).

`kv` keys (WORKSPACE scope): `settings:v1`, `backfill:<definitionId>:progress`, `job:inflight:<jobId>`,
`meta:objectsSnapshot` (metadata cache with a short TTL).

### 4.4 Event flow (§67–69, §29–34)

```text
record event (wildcard trigger, any object)
        │
        ▼
dispatcher (static per operation type)
  • read payload.objectMetadata.{nameSingular, universalIdentifier}
  • read payload.properties.updatedFields / before / after
  • only if object has definitions  ──►  else return immediately
        │
        ├── source-side: object == definition.sourceObject
        │       filter by updatedFields ∩ {sourceField, path fields}
        │       plan affected destination records (relation-scoped query)
        │       enqueue sync-record-batch jobs in chunks (≤200/call, delayMs stagger)
        │
        └── destination-side: object == definition.destinationObject
                relation field changed / record created / soft- or hard-deleted
                enqueue sync-record-batch for that single record
        │
        ▼
sync-record-batch (per record, idempotent, jobId = definition+record+eventKey)
  group definitions by relation path → resolve source once → fetch field set once (§85, §132)
  normalize → compare-before-write → single collapsed mutation per record
  loop guard: destination fields ⊆ managedFieldNames ⇒ no downstream propagation
             propagation depth ≤ 1 for MVP; kv inflight marker; cycle check at config time
  write sync log (status, counts, error code)
```

Guard rails: the dispatcher must stay O(1)-ish per event (definitions are cached per workspace for the
function's lifetime, miss → cheap query), because the platform throttles per-application enqueues and skips
with a warning; `reconcile-batch` (scheduled via cron, opt-in) is the safety net for skipped fan-out.

### 4.5 Live read path (§131/§132/§86)

```text
widget mount
  → context: recordId (+ object name if bound)
  → definitions for object (cached; app object query via CoreApiClient)
  → group by relation path
  → one GraphQL query per destination record with aliases for every needed source object/field set
  → normalize + format per adapter
  → render rows: label, value, provenance ("Live from Company → Email"), source link, copy action
  → errors are per-row: NO_RELATION / NO_VALUE / MISSING_FIELD / PERMISSION_DENIED / CONFIG_INVALID
```

Rendering rules from the spec (§19–24, §114–118) map onto `twenty-ui` (`Tag`, `Status`, `Button`,
`Icon*`) and `useTheme()` tokens; empty states are verbal ("No Company linked", "No value", "Related field
configuration needs attention"), never `null`.

### 4.6 Settings UI (§13–17, §44–47, §53–57, §98–100, §101–102)

`defineSettingsFrontComponent` renders: header + `+ Create related field`; the definition list
(name, destination, relation, source, field, mode, status, last sync, actions); Validate all / Sync all /
Import / Export; the 8-step wizard (destination → relation → source field → mode → display → synced-field
config → sync behavior → review) with search, internal-name+type hints in the picker (§108–110), bulk
selection of several source fields (§119) as Phase 2; validation report with `Repair mapping`; backfill
preview with the §45 numbers and live progress from `kv`; health section with the §101 metrics.

All writes go through app routes (`/s/related-fields/...`) so that behaviour is identical regardless of
sandbox limits, and so the same code path is unit-testable.

### 4.7 Permissions (§62–65)

* Default application role: `canReadAllObjectRecords: true`, `canUpdateAllObjectRecords: true` (needed because
  destination objects are chosen later), no delete/destroy, plus explicit `objectPermissions` entries for the
  app's own objects so the app can always write its definitions and logs.
* `permissionFlagUniversalIdentifiers`: `DATA_MODEL` (create/alter materialized fields) and, only if we ship
  runtime layout insertion, `LAYOUTS`. Both are documented as elevated grants required for the materialized
  feature with a clear admin-facing explanation, and both are only reachable from the settings routes.
* Objective lens on §9.5/§64: reads never bypass the viewer. Live reads use the delegated token (user ∩ app);
  writes performed by background jobs inherit the acting user where one exists, and use the app role only for
  cron/reconciliation. Settings mutations additionally verify the caller holds the relevant permission flag.
* §63 diagnostics: on any API permission error during resolution or sync, the definition is marked
  `PERMISSION_BLOCKED` with the object name in the message, and the settings page shows
  "The Related Fields app does not have permission to read Companies."

### 4.8 Portability (§9.3, §53–58, §126)

Export (`schemaVersion`, `pluginVersion`, `twentyCompatibility.minimumVersion`, app version, definitions with
universal identifiers + canonical names + field types + relation types, no record values, no secrets). Import
resolves in order universal identifier → exact internal name → **no fuzzy label matching**, then produces the
§57 preview: Ready / Needs mapping (manual picker) / Incompatible, requiring confirmation before writing.
Materialized destination fields are re-created or re-mapped at import time (documented as expected, §58/§95).
`constants/version.ts` holds the compatibility floor and the single place that probes SDK capabilities.

### 4.9 Field-type matrix (§25–28, §133)

Implemented once in `lib/domain/field-type-compatibility.ts` and unit-tested:

| Source type | Live | Materialized destination | Notes |
| --- | --- | --- | --- |
| TEXT, RICH_TEXT | ✅ | TEXT / RICH_TEXT | truncation policy documented |
| EMAILS | ✅ | EMAILS | preserve `primaryEmail` + `additionalEmails` structure, never a bare string |
| PHONES | ✅ | PHONES | preserve calling code/country code |
| LINKS | ✅ | LINKS | preserve url + label |
| NUMBER, NUMERIC | ✅ | same | |
| CURRENCY | ✅ | CURRENCY | `{ amountMicros, currencyCode }` — never flattened |
| BOOLEAN, DATE, DATE_TIME, RATING, POSITION | ✅ | same | ISO normalization for dates |
| SELECT / MULTI_SELECT | ✅ | SELECT if option identity is compatible, else TEXT | compare option **value**, never the colour |
| ADDRESS / FULL_NAME / ACTOR | ✅ | same where the API round-trips reliably, else read-only JSON in Live | adapter required |
| RELATION / MORPH_RELATION | Phase 2 | — | display value only in MVP |
| RAW_JSON, FILES, TS_VECTOR, ARRAY | Live read-only JSON/text with an explicit "unsupported for sync" reason | excluded | never silently stringified (§27) |

Normalization (§133): null/empty equivalence, stable ordering for unordered arrays, ISO dates, currency and
select identity preserved, all compared via one function used by both the resolver and the sync engine.

### 4.10 Testing (§147–151, §173)

* Unit (vitest, mirrors `lib/domain`): relation path parsing, compatibility matrix, normalization,
  config schema/validation/import resolution, cycle detection, sync planning, null & delete behaviour,
  loop guard, field-name generation and collision detection.
* Integration (local Twenty, the `document-generator` pattern with `global-setup.ts`): scenarios A–J of §149,
  including permission denial, source field deletion, export/import round-trip.
* Load: 100 / 1 000 / 10 000 destination records and a large single-source fan-out, measuring processed
  records, API calls, failures, retries and duration (job batching, no full-memory loads).
* Frontend: loading, empty relation, missing value, source link, multiple fields, invalid mapping, narrow
  layout, light/dark.
* CI: typecheck (`tsgo`), lint (`oxlint`), unit tests, manifest build (`yarn twenty dev:build`),
  `dev:typecheck`, integration suite where a test instance is available.

---

## 5. Phasing

**Phase 0 — scaffold & prove the risky parts** (before feature work)
1. Scaffold the app outside the monorepo, pin SDK/UI versions to the instance's.
2. Spike A: metadata read + field creation from the settings component on a standard object (proves 2.1/2.2/2.4).
3. Spike B: `*.updated` dispatcher + one materialized mapping end-to-end on Person→Company (proves 2.6/2.7/2.8).
4. Spike C: widget on `personRecordPage` + delegated-token read of a Company field (proves 2.4/2.5/2.14).
Result of Phase 0 is a decision log update, not shipped behaviour.

**Phase 1 — MVP (§177)**: definition object + settings CRUD + wizard; Live mode widget with provenance,
source link, copy, empty/error states; materialized mode (field creation, sync on create/update/relation
change/removal, clear on relation removal and source delete, compare-before-write, backfill with preview and
progress); validation engine + repair; export/import; health/log views; standard-object tabs (Company,
Person, Opportunity) and documented custom-object placement.

**Phase 2 (§179)**: multi-hop paths with configurable max depth, bulk field creation wizard, groups and
ordering, scheduled reconciliation, runtime widget insertion via the layout metadata API, Tasks/Notes
verification, source filters, health dashboard, `resolve` route for external consumers.

**Phase 3 (§180)**: rollups and record-selection strategies, formulas, conditional visibility, workflow
action, template bundles, migration to a native Twenty lookup field type if one appears.

---

## 6. Risks / open questions

1. **`DATA_MODEL` on the app role** is unavoidable for runtime field creation; it is the single most
   sensitive grant in this design. Alternative for a stricter posture: declare materialized destination
   fields in code per known mapping (not viable given user-defined mappings) or accept manual field creation
   by the admin (worse UX). Needs an explicit product decision.
2. **Metadata filter behaviour**: whether the metadata API can filter objects/fields by
   `universalIdentifier` reliably on every instance (the media-notes comment suggests paging is required).
3. **Dynamic-object permission errors** (§63) surface as API errors, not pre-flight knowledge; the engine must
   classify them precisely so the UI can explain what to fix.
4. **Platform enqueue throttling** silently skips triggered work when a workspace is busy; reconciliation
   frequency becomes a correctness lever, not a nicety.
5. **Timeline volume** on aggressive mappings is structurally reduced but not removable without core support.
6. **Minimum Twenty version**: pin to the SDK the app is developed against (2.39.0 locally,
   `>=2.37.0` plausible because `last-contact` uses jobs at 2.37.0), to be confirmed in Phase 0 rather than
   guessed (§126).
7. **App location/repo**: the app must live outside `twenty-main` to stay transferable (§172); scaffolding a
   sibling directory requires the user's go-ahead because it is outside this project directory.

---

## 7. Acceptance mapping (§181–191, condensed)

| Acceptance area | Mechanism | Phase |
| --- | --- | --- |
| Install → settings → Person/Company/Email/Live → save → widget shows value | settings front component + app-declared layout tab + Live resolver | 1 |
| Live reflects later source edits, no copied field | read-time resolution | 1 |
| Materialized populate/update/clear on change/relation-move/relation-removal | dispatcher + sync engine | 1 |
| No redundant writes | normalization + compare-before-write | 1 |
| Missing relation → "No Company linked", no error | resolver states | 1 |
| Permission denial → no value, safe error state | delegated token + error classification | 1 |
| Source field deleted → `Needs attention`, no auto-substitution | validation engine + repair | 1 |
| Workspace A → B import with remapping UI | config export/import | 1 |
| 1 000-record backfill with progress, isolation, summary | job batching + `kv` progress | 1 |
| Twenty-like UI, dark mode, keyboard, clear states | `twenty-ui` + `useTheme()` + a11y pass | 1 |
| Standard **and** custom object mapping works | metadata-driven, no hardcoded names | 1 |
| No internal monorepo imports | adapter boundary + lint rule | 1 |
