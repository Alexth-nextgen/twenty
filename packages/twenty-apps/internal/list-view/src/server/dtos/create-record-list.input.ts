import { Field, InputType } from '@nestjs/graphql';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { UUIDScalarType } from 'src/engine/core-modules/application/native-extension-host/api/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import {
  RECORD_LIST_TEMPLATE_KEYS,
  type RecordListTemplateKey,
} from '../constants/record-list-templates.constant';
import { CreateRecordListTemplateFieldInput } from './create-record-list-template-field.input';

@InputType()
export class CreateRecordListInput {
  @IsString()
  @IsNotEmpty()
  @Field()
  name: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  icon?: string | null;

  @IsUUID()
  @Field(() => UUIDScalarType)
  parentObjectMetadataId: string;

  @IsOptional()
  @IsIn(RECORD_LIST_TEMPLATE_KEYS)
  @Field(() => String, { nullable: true })
  templateKey?: RecordListTemplateKey | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CreateRecordListTemplateFieldInput)
  @Field(() => [CreateRecordListTemplateFieldInput], { nullable: true })
  templateFields?: CreateRecordListTemplateFieldInput[] | null;
}
