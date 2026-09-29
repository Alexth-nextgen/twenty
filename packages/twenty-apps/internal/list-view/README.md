# Lists

## Current implementation

Lists is implemented as a native Twenty app in this package. The app is registered
through `native-app.json` and requires `native-app-host@^1`; it is not the older
standalone SDK app described in earlier drafts of this README. The native app
provides a list route, sidebar navigation, a server module, record-page section,
and selection commands.

The app depends on the generic Native App Host changes in the Twenty repository.
To bring it to another Twenty instance, transfer and register the app code and
install the compatible host changes. List definitions, entries, field values,
People and Companies are workspace data and are not transferred with the code.

## How membership works

- A list targets either People or Companies.
- Each membership is represented by a list-entry record linked to the source
  Person or Company. List-specific attributes belong to that entry.
- A source record can belong to multiple lists. A duplicate membership in the
  same list is skipped.
- Removing a record from a list deletes only its entry and list-specific values;
  it does not delete the Person or Company.
- People and Companies have a `List Membership` multi-select field. Its options
  are synchronized from lists of the matching object type, and its selected
  values mirror actual memberships. Adding or removing a record in a list
  updates the field; selecting or deselecting a list in the field updates the
  actual membership.
- The record page also exposes a `Lists` section for managing memberships. This
  section complements Twenty's native reverse `Lists` relation; it does not
  replace the relation or keep a separate membership dataset.

## Available features

- Create People or Company lists from a blank setup or a template; name and
  icon are configurable.
- Browse list entries with Twenty's native table and Kanban views, including
  native view, filter, sort, and field controls where supported by the host.
- Add multiple existing records from a list, create a source record in the
  add flow, or use the pinned `Add to list` command after selecting People or
  Companies in their index.
- Remove selected entries from the current list, or select People/Companies in
  their index and use `Remove from list` to choose a matching list. Both flows
  remove membership only.
- Manage one record's memberships from its `Lists` section, while retaining the
  native reverse relation section.
- Create and manage list attributes, including Select options. Import source
  records into the current list with the native CSV import flow; export the
  current index context as CSV or Excel from `Import / Export`.
- Rename, reorder, and delete lists. List creation, rename, and deletion keep
  the `List Membership` field options synchronized.

## Known limitations and verification status

The detailed implementation comparison and acceptance gaps are tracked in
[`LIST_VIEW_PARITY_REQUIREMENTS.md`](../../../../LIST_VIEW_PARITY_REQUIREMENTS.md).
The most relevant known gaps are:

- Lists cannot currently be duplicated.
- Formula and rollup attributes are not implemented as a complete feature.
- CSV import does not map list-specific entry attributes.
- Entry-form templates and list sharing/permissions are not implemented.
- Several workflows, including Company flows, still need a full browser
  acceptance pass. Code presence in the status document is not by itself proof
  of end-to-end behavior.

The former RFC at `packages/twenty-server/docs/RECORD_LISTS_RFC.md` describes an
earlier architecture spike. The native app in this package is the current
implementation source.

## Development

From the repository root:

```bash
node tools/native-apps/build.mjs
yarn start
```

Edit app source in this package. Files generated under
`packages/twenty-front/src/native-apps/` and
`packages/twenty-server/src/native-apps/` are build outputs and should not be
edited as the source of truth.
