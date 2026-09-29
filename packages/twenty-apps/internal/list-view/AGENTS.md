## Base documentation

- https://docs.twenty.com/getting-started/core-concepts/apps
- https://docs.twenty.com/developers/extend/apps/getting-started/quick-start
- https://docs.twenty.com/developers/extend/apps/data/objects
- https://docs.twenty.com/developers/extend/apps/data/relations
- https://docs.twenty.com/developers/extend/apps/layout/front-components
- https://docs.twenty.com/developers/extend/apps/layout/command-menu-items

## App rules

- Never regenerate a released universal identifier.
- Define every app entity through `twenty-sdk/define` so the standard manifest build
  owns the complete feature.
- Use only `twenty-sdk`, `twenty-client-sdk`, published `twenty-ui` entry points and
  ordinary package dependencies. Do not import Twenty core paths.
- Front components must remain compatible with the Remote DOM sandbox.
- Run `yarn twenty dev:build`, `yarn typecheck`, `yarn lint` and `yarn test:unit`
  after changes.
