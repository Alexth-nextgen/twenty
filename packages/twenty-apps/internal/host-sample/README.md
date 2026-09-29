# Native host sample

This app is not a product. It exists to prove that the native app host is generic:
it registers every extension point the host exposes without importing a single line
of ListView code.

| Property | Value |
| --- | --- |
| `universalIdentifier` | `5f1d0c2e-9a44-4a3b-8f2f-6a1b2c3d4e5f` |
| App version | `1.0.0` |
| Required host capability | `native-app-host@^1` |

Registered extension points:

- Route `/native-host-sample`.
- Navigation entry in the workspace drawer (position 200).
- Record page section for `person` and `company`.
- Command renderer for the command key `NATIVE_HOST_SAMPLE`.
- Server module `HostSampleModule` with a service and a host resource inventory.

It must stay dependency-free on purpose: if this app needs a new host contract, the
contract is not generic yet.

Keep the app disabled in product workspaces. It is installed and enabled through
Settings → Applications → Native apps, which also makes it a second independent
proof for the capability check and the lifecycle.
