import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType('RecordListEntryEditor')
export class RecordListEntryEditorDTO {
  @Field(() => GraphQLJSON)
  fields: Array<{
    name: string;
    label: string;
    type: string;
    options: Array<{ label: string; value: string }>;
  }>;

  @Field(() => GraphQLJSON)
  values: Record<string, unknown>;
}
