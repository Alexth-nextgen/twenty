# Native App Host

The native app host is the small, generic extension surface that lets an installed
Twenty app add native routes, navigation entries, record page sections, commands,
record index policies and server modules.

The host contains no product logic. It must never import a specific app module and
must never know app-specific DTOs, resolvers or services.

## Capability

| Property | Value |
| --- | --- |
| Capability name | `native-app-host` |
| Implemented version range | `>=1.0.0 <2.0.0` |
| Declaration format | `<capability name>@<semver range>` |
| Example declaration | `native-app-host@^1` |

The contract lives in
`utils/native-app-host-capability.util.ts` and is the single source of truth: the
build of the app packages reads the constant from that file, so a released app can
never declare a range the host does not implement.

Rules enforced today:

- An app declares `hostCapability` in its `native-app.json`.
- Lifecycle actions (`install`, `enable`, `disable`, `uninstall`, `upgrade`) abort
  with `NATIVE_APP_CAPABILITY_MISSING`, `NATIVE_APP_CAPABILITY_INVALID` or
  `NATIVE_APP_CAPABILITY_UNSUPPORTED` when the declaration is missing, malformed or
  not fully covered by the host range.
- Partial overlaps are rejected. Loading an app with silently missing capabilities
  is not allowed.
- Error messages contain app identifier, app version and the host range, never
  record contents.

## Manifest

Each app ships a `native-app.json`; `tools/native-apps/build.mjs` validates it and
generates the runtime registries. Supported keys:

| Key | Purpose |
| --- | --- |
| `universalIdentifier` | Stable app identity (UUID). Never regenerate after release. |
| `displayName`, `version` | Product name and semantic app version. |
| `hostCapability` | Required host capability range. |
| `serverModule`, `serverExport` | App NestJS module registered into the server. |
| `entities` | App-owned core entities (discovered by the core datasource). |
| `routes` | Native workspace routes (lazy component + error boundary + install check). |
| `navigation` | Native navigation drawer entries with fixed positions. |
| `recordSections` | Record page slots with the target object names. |
| `commands` | Command renderer mapping: command key to a native React component. |

## Frontend extension points

| Extension point | Provided by |
| --- | --- |
| Workspace route | `createNativeAppRoutes`, `NativeAppBoundary` |
| Navigation section | `NativeAppNavigation` (rendered inside `MainNavigationDrawerScrollableItems`) |
| Record page slot | `NativeAppRecordSections` (rendered by `RecordShowPage`) |
| Command renderer | `NativeAppCommand` fallback in `CommandRunner` |
| Public native components | `@/app/native-extension-host/api/**` |
| Hotkey scope | `useGlobalHotkeys` through `@/app/native-extension-host/api/**` |
| Sorting and lookup | `nativeAppRegistry.ts` (position, then identifier; command lookup; activation check) |

Registrations are driven by the generated registry and gated by the app activation
state, so disabling or removing an app removes its routes, navigation entries,
record sections and commands without a reload.

## Server extension points

- `NATIVE_APP_MODULES` – generated list of app NestJS modules loaded by the metadata
  engine module.
- `NativeAppHostService.registerResourceInventory(applicationId, inventory)` – app
  owned data inventory, used for the non-destructive uninstall impact overview.
- `NativeAppHostService.isEnabled` / `assertEnabled` – activation checks inside the
  app's own server module.
- `NativeAppEnabledGuard(universalIdentifier)` – resolver guard, independent of the
  `workspaceId` in the request (isolation always comes from the authenticated
  context).
- GraphQL API: `nativeApplications`, `nativeApplicationResources`,
  `manageNativeApplication` (the two latter require the `APPLICATIONS` settings
  permission).
- Lifecycle: `install`, `enable`, `disable`, `uninstall`, `upgrade`, serialized by a
  transaction-level advisory lock, followed by a workspace cache invalidation of
  `flatApplicationMaps`.
- The app record is created with `canBeUninstalled: false`; uninstall only changes
  the activation state, so app data survives and a later install reconnects to it.

## Adding an app

1. Create `packages/twenty-apps/internal/<app>` with `native-app.json`.
2. Add the directory to `native-apps.json`.
3. Run `node tools/native-apps/build.mjs` (also part of the front and server builds).
4. The build rejects duplicate identifiers, duplicate routes and command keys, app
   sources importing private core paths, invalid versions and unsupported
   capabilities.
5. Ship a `compatibility.json` next to `native-app.json`; the automated
   compatibility matrix test (`__tests__/native-app-compatibility.spec.ts`) fails
   when an app and the host drift apart.

The sample app at `packages/twenty-apps/internal/host-sample` exists to prove that
every extension point above is generic: it registers a route, a navigation entry, a
record page section, a command and a server module without any ListView import.

## Known limits

- App code is built inside the monorepo bundle until an external native bundle
  loader exists.
- Database migrations for app-owned core rows still live in the core upgrade
  directories and re-export their command names through this host API.
