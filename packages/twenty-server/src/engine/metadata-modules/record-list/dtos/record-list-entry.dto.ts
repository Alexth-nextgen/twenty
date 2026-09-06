import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('RecordListEntry')
export class RecordListEntryDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType)
  sourceRecordId: string;

  @Field()
  position: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
