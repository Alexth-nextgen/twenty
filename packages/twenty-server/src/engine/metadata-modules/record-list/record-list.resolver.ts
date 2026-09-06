import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CreateRecordListInput } from 'src/engine/metadata-modules/record-list/dtos/create-record-list.input';
import { RecordListDTO } from 'src/engine/metadata-modules/record-list/dtos/record-list.dto';
import { UpdateRecordListInput } from 'src/engine/metadata-modules/record-list/dtos/update-record-list.input';
import { RecordListService } from 'src/engine/metadata-modules/record-list/services/record-list.service';

@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
@MetadataResolver(() => RecordListDTO)
export class RecordListResolver {
  constructor(private readonly recordListService: RecordListService) {}

  @Query(() => [RecordListDTO])
  async recordLists(
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListDTO[]> {
    return await this.recordListService.findAll({ workspaceId: workspace.id });
  }

  @Query(() => RecordListDTO)
  async recordList(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListDTO> {
    return await this.recordListService.findOneOrThrow({
      id,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => RecordListDTO)
  async createRecordList(
    @Args('input') input: CreateRecordListInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId: string,
  ): Promise<RecordListDTO> {
    return await this.recordListService.createRecordList({
      ...input,
      workspaceId: workspace.id,
      createdByUserWorkspaceId: userWorkspaceId,
    });
  }

  @Mutation(() => RecordListDTO)
  async updateRecordList(
    @Args('input') input: UpdateRecordListInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListDTO> {
    return await this.recordListService.updateRecordList({
      ...input,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => RecordListDTO)
  async deleteRecordList(
    @Args('id', { type: () => UUIDScalarType }) id: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListDTO> {
    return await this.recordListService.deleteRecordList({
      id,
      workspaceId: workspace.id,
    });
  }
}
