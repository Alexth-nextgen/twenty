export type RecordList = {
  id: string;
  name: string;
  icon: string | null;
  position: number;
  parentObjectMetadataId: string;
  entryObjectMetadataId: string;
  defaultViewId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecordListEntry = {
  id: string;
  sourceRecordId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type RecordListMembership = RecordListEntry & {
  recordList: RecordList;
  values?: Record<string, unknown>;
};
