import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('RemoveRecordsFromListResult')
export class RemoveRecordsFromListResultDTO {
  @Field()
  removedCount: number;

  @Field()
  skippedCount: number;
}
