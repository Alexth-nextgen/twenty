# Setup

## Prerequisites

- Node.js 24.5 or later in the Node 24 line
- Yarn 4
- Docker for the local Twenty development instance

## Run locally

1. Install dependencies with `yarn install`.
2. Start Twenty with `yarn twenty docker:start`.
3. Sync the app with `yarn twenty dev`.
4. Open `http://localhost:2020` and sign in with the development credentials.

The sync installs the List and List entry objects, their relations and indexes, the
Lists view and navigation item, and both record-selection commands.

## Verify

- `yarn twenty dev:build` builds the complete app manifest.
- `yarn typecheck` validates all app source files.
- `yarn lint` runs the scaffold linter.
- `yarn test:unit` runs local unit tests.
- `yarn test` installs the app into a running Twenty test instance.

## Publish

Use `yarn twenty app:publish --private` for a private production registration or
`yarn twenty app:publish` for npm and marketplace publication.
