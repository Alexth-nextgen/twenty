import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/core-modules/application/native-extension-host/api/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class AddRecordToListInput {
  @IsUUID()
  @Field(() => UUIDScalarType)
  recordListId: string;

  @IsUUID()
  @Field(() => UUIDScalarType)
  sourceRecordId: string;
}
