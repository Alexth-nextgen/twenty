import { FieldMetadataType, RelationType } from 'twenty-shared/types';

import {
  buildRecordListEntryObjectInput,
  buildRecordListSourceRecordFieldInput,
} from '../build-record-list-entry-object-input';

describe('record list entry object input', () => {
  it('builds a deterministic internal object name for each list', () => {
    const input = buildRecordListEntryObjectInput({
      recordListId: '7fd025b4-18ad-4a65-8368-34c607155f47',
      recordListName: 'Recruiting',
    });

    expect(input).toMatchObject({
      nameSingular: 'recordListEntry7fd025b418ad4a65836834c607155f47',
      namePlural: 'recordListEntry7fd025b418ad4a65836834c607155f47Collection',
      labelSingular: 'Recruiting entry',
      labelPlural: 'Recruiting entries',
      skipNameField: true,
    });
  });

  it('uses a non-unique many-to-one relation so a record can have several entries', () => {
    const input = buildRecordListSourceRecordFieldInput({
      entryObjectMetadataId: 'a6e2b152-6482-47aa-a1e7-d9d597d79f5a',
      parentObjectMetadataId: 'df1ad98b-444c-484a-8765-361b1b851414',
      parentObjectLabelSingular: 'Person',
      recordListName: 'Recruiting',
    });

    expect(input).toMatchObject({
      type: FieldMetadataType.RELATION,
      name: 'sourceRecord',
      objectMetadataId: 'a6e2b152-6482-47aa-a1e7-d9d597d79f5a',
      isNullable: false,
      isUnique: false,
      relationCreationPayload: {
        type: RelationType.MANY_TO_ONE,
        targetObjectMetadataId: 'df1ad98b-444c-484a-8765-361b1b851414',
      },
    });
  });
});
