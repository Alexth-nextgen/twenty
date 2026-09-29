import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('AddRecordsToListResult')
export class AddRecordsToListResultDTO {
  @Field(() => Int)
  addedCount: number;

  @Field(() => Int)
  skippedCount: number;
}
