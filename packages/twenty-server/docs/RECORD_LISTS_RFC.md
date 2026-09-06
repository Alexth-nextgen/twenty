# Record Lists RFC

Status: architecture spike

## Summary

Twenty should model an Attio-style list as a first-class process context over
records from exactly one object. A list is not a saved filter and is not a view
layout. Adding a record creates a distinct list entry that owns list-specific
field values. Multiple entries may point to the same source record.

This spike adds the core `recordList` metadata boundary and lets a view declare
that it belongs to a record list. It also provides builders for the internal
entry object and its non-unique relation to source records. It does not expose a
GraphQL API or UI yet.

Attio references:

- https://attio.com/help/reference/attio-101/attios-data-model/understanding-lists
- https://attio.com/help/reference/attio-101/attios-data-model/define-your-data-model-objects-lists-and-views
- https://docs.attio.com/docs/objects-and-lists

## Terminology

`ViewType.LIST` already means a compact record rendering layout in Twenty. It
must not be reused for the domain concept in this RFC.

- Record list: a workflow or project that contains entries from one source
  object.
- Source record: the existing workspace record referenced by an entry.
- List entry: a distinct record in the internal entry object.
- List field: field metadata and values owned by the internal entry object.
- List view: a normal Twenty view whose object is the internal entry object and
  whose `recordListId` identifies its domain context.

## Invariants

1. A record list has exactly one parent object.
2. A list entry references exactly one record from that parent object.
3. A source record may have zero, one, or many entries in the same list.
4. List field values are stored on the entry and never copied to the source
   record.
5. Source object field edits affect the source record everywhere.
6. A view owns presentation state only; deleting a view cannot delete entries.
7. List authorization must be enforced by the server and cannot be represented
   by `ViewVisibility.UNLISTED`.

## Proposed storage

The core schema owns one `recordList` row per list:

```text
recordList
  id
  workspaceId
  name
  icon
  position
  parentObjectMetadataId
  entryObjectMetadataId
  createdByUserWorkspaceId
  createdAt
  updatedAt
  deletedAt
```

`entryObjectMetadataId` is unique because an internal entry object belongs to
exactly one list. `parentObjectMetadataId` is deliberately not unique.

Each list gets an internal workspace object. It uses the existing object and
field metadata engine, so list fields retain Twenty's field validation, typed
storage, filters, sorts, grouping, audit behavior, and record CRUD.

The internal object contains a required `sourceRecord` many-to-one relation to
the list's parent object. The relation is explicitly non-unique. Two entry rows
can therefore reference the same person while holding different status or
assignee values.

Views continue to use `objectMetadataId` for querying and rendering. For a list
view, it points to the internal entry object. The nullable `recordListId` marks
the domain context and supports list navigation, lifecycle, and authorization.

In this spike, `view.recordListId` is a scalar application-level reference,
not a database foreign key. Adding `recordList` to the existing flat-metadata
entity union would broaden generated types and synchronization behavior beyond
the spike. Until that integration decision is made, every write must validate
that the list belongs to the same workspace, and list deletion must clear its
views explicitly. The backend MVP should either promote `recordList` into that
metadata system or introduce a dedicated constraint-aware relation before the
API is exposed.

## Why not JSONB or EAV entry values?

A shared JSONB or entity-attribute-value store avoids creating an internal
object per list, but it also creates a second implementation of typed fields,
validation, filtering, sorting, grouping, indexes, permissions, audit logs, and
GraphQL selection. The internal-object design reuses Twenty's strongest
abstraction and is the preferred starting point.

The decision must be revisited if the product requires thousands of lists per
workspace. The next spike should benchmark schema creation and metadata cache
cost for 10, 100, and 1,000 internal objects before the storage strategy is
considered final.

## Object fields in list views

List views need to display two sources:

- entry fields, which are editable list-specific values;
- source record fields, which read and write the parent record.

The first implementation should add a typed field reference rather than copy
source values into the entry object:

```ts
type RecordListViewFieldReference =
  | { type: 'ENTRY_FIELD'; fieldMetadataId: string }
  | {
      type: 'SOURCE_RECORD_FIELD';
      relationFieldMetadataId: string;
      fieldMetadataId: string;
    };
```

This should be introduced as a general relation path only if another concrete
consumer needs deeper paths. A one-hop source-record reference is enough for
the list MVP.

Filtering and sorting source fields must be translated into relation-aware
workspace queries. This is the largest query-layer risk and should be proven
before building the complete UI.

## Creation lifecycle

Creating a list is an orchestration, not a single repository insert:

1. Reserve the list ID and deterministic internal object name.
2. Create the internal object without a normal object navigation item.
3. Mark the object as system-owned and hidden from ordinary object pickers.
4. Create the required non-unique `sourceRecord` relation.
5. Create the `recordList` metadata row.
6. Create the default table view with `recordListId`.
7. Create a navigation item targeting the default view.

The operation crosses the core schema and a workspace schema migration. The
service therefore needs idempotent steps and compensating cleanup. A database
transaction alone cannot make the whole operation atomic.

The existing public `createOneObject` path currently creates an object
navigation item automatically. The list orchestrator should use or introduce a
system-object creation path that suppresses that side effect; it should not
create and then race to delete a visible navigation item.

## Deletion lifecycle

Deleting a list should first make it unavailable, then remove dependent views
and navigation, and finally delete the internal object through the workspace
migration engine. Hard database cascades are appropriate for core metadata but
are insufficient for dropping the workspace table.

Deletion must be resumable. Each step should treat an already-deleted dependent
resource as success.

## Permissions

The MVP ships workspace-visible lists only. Private and restricted lists are
explicitly deferred. They require a dedicated access model with read and edit
levels for workspace roles or members. View visibility is presentation metadata
and must not become the authorization boundary.

Object and field permissions on the internal entry object can enforce much of
the data access, but the service must also verify that every referenced source
record is readable. List access must never be a privilege escalation path into
the parent object.

## API boundary

The metadata API should eventually expose:

- create, update, delete, and list record lists;
- create and delete list fields;
- add, update, duplicate, and remove entries;
- query entries with list and source-record fields;
- list memberships for a source record.

Entry mutations should use entry IDs. A `(recordListId, sourceRecordId)` pair is
not an identifier because duplicate entries are valid.

## Delivery slices

### Slice 1: storage and query proof

- Persist `recordList` metadata.
- Create one hidden entry object for a People-based Recruiting list.
- Create the non-unique source relation and one Status field.
- Insert two entries for the same person with independent Status values.
- Query entry fields together with the person's label.
- Measure internal object creation and cache recomputation.

### Slice 2: backend MVP

- Add the list orchestration service and GraphQL metadata API.
- Add entry CRUD and list field CRUD.
- Implement relation-aware field selection, filtering, and sorting.
- Add lifecycle cleanup and workspace-boundary validation.

### Slice 3: table UI

- Add the Lists navigation section and creation flow.
- Reuse the record table and view bar.
- Add record picker, bulk add, remove, and explicit duplicate actions.
- Clearly distinguish source fields from list fields in the field picker.

### Slice 4: kanban and later parity

- Reuse the board renderer with a Status list field.
- Add list permissions, record-page memberships, imports, public API,
  automations, and time-in-stage tracking in separate changes.

## Spike exit criteria

The architecture is ready for the backend MVP when all of the following hold:

- the generated core upgrade command runs up and down cleanly;
- one internal entry object can be created without appearing as a normal object;
- duplicate source relations are accepted and independently editable;
- table queries can select, filter, and sort one-hop source fields;
- deleting the list leaves no metadata rows, navigation items, or workspace
  tables;
- the 100-list benchmark has acceptable schema and cache latency;
- cross-workspace object and record references are rejected.

## Open decisions

1. Whether internal list objects belong to the workspace custom application or
   to a dedicated system application.
2. Whether reverse `sourceRecord` relations should be stored but hidden, or
   represented through a dedicated record-list membership resolver.
3. The maximum supported lists and list fields per workspace.
4. The exact list permission subject model after the MVP.
5. Whether entry position is a normal system field or a list-owned ordering
   primitive.
