import { Field, HideField, ObjectType } from '@nestjs/graphql';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

import { UUIDScalarType } from 'src/engine/core-modules/application/native-extension-host/api/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('RecordList')
export class RecordListDTO {
  @IsUUID()
  @Field(() => UUIDScalarType)
  id: string;

  @IsString()
  @Field()
  name: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  icon: string | null;

  @Field()
  position: number;

  @IsUUID()
  @Field(() => UUIDScalarType)
  parentObjectMetadataId: string;

  @IsUUID()
  @Field(() => UUIDScalarType)
  entryObjectMetadataId: string;

  @IsOptional()
  @IsUUID()
  @Field(() => UUIDScalarType, { nullable: true })
  defaultViewId: string | null;

  @IsOptional()
  @IsUUID()
  @Field(() => UUIDScalarType, { nullable: true })
  createdByUserWorkspaceId: string | null;

  @HideField()
  workspaceId: string;

  @IsDateString()
  @Field()
  createdAt: Date;

  @IsDateString()
  @Field()
  updatedAt: Date;
}
