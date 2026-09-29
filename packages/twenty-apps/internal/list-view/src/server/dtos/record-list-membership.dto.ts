import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

import { RecordListEntryDTO } from './record-list-entry.dto';
import { RecordListDTO } from './record-list.dto';

@ObjectType('RecordListMembership')
export class RecordListMembershipDTO extends RecordListEntryDTO {
  @Field(() => RecordListDTO)
  recordList: RecordListDTO;

  @Field(() => GraphQLJSON)
  values: Record<string, unknown>;
}
