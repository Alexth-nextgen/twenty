import { Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, ArrayUnique, IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/core-modules/application/native-extension-host/api/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class AddRecordsToListInput {
  @IsUUID()
  @Field(() => UUIDScalarType)
  recordListId: string;

  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @Field(() => [UUIDScalarType])
  sourceRecordIds: string[];
}
