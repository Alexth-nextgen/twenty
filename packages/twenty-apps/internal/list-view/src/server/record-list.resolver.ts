import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/core-modules/application/native-extension-host/api/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { MetadataResolver } from 'src/engine/core-modules/application/native-extension-host/api/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/application/native-extension-host/api/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/core-modules/application/native-extension-host/api/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/core-modules/application/native-extension-host/api/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/core-modules/application/native-extension-host/api/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/core-modules/application/native-extension-host/api/engine/guards/workspace-auth.guard';
import { NativeAppEnabledGuard } from 'src/engine/core-modules/application/native-extension-host/native-app-enabled.guard';
import { CreateRecordListInput } from './dtos/create-record-list.input';
import { AddRecordToListInput } from './dtos/add-record-to-list.input';
import { AddRecordsToListInput } from './dtos/add-records-to-list.input';
import { AddRecordsToListResultDTO } from './dtos/add-records-to-list-result.dto';
import { RemoveRecordsFromListResultDTO } from './dtos/remove-records-from-list-result.dto';
import { RecordListEntryDTO } from './dtos/record-list-entry.dto';
import { RecordListEntryEditorDTO } from './dtos/record-list-entry-editor.dto';
import { RecordListMembershipDTO } from './dtos/record-list-membership.dto';
import { RecordListDTO } from './dtos/record-list.dto';
import { UpdateRecordListInput } from './dtos/update-record-list.input';
import { UpdateRecordListEntryFieldsInput } from './dtos/update-record-list-entry-fields.input';
import { RecordListService } from './services/record-list.service';

@UseGuards(
  WorkspaceAuthGuard,
  NoPermissionGuard,
  NativeAppEnabledGuard('ac8f2b7a-15d3-47fa-a06c-2bfc6d85ec72'),
)
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

  @Mutation(() => [RecordListDTO])
  async reorderRecordLists(
    @Args('ids', { type: () => [UUIDScalarType] }) ids: string[],
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListDTO[]> {
    return await this.recordListService.reorderRecordLists({
      ids,
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

  @Query(() => [RecordListEntryDTO])
  async recordListEntries(
    @Args('recordListId', { type: () => UUIDScalarType }) recordListId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListEntryDTO[]> {
    return await this.recordListService.findRecordListEntries({
      recordListId,
      workspaceId: workspace.id,
    });
  }

  @Query(() => RecordListEntryEditorDTO)
  async recordListEntryForEditing(
    @Args('entryObjectMetadataId', { type: () => UUIDScalarType })
    entryObjectMetadataId: string,
    @Args('entryId', { type: () => UUIDScalarType }) entryId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListEntryEditorDTO> {
    return await this.recordListService.findRecordListEntryForEditing({
      entryObjectMetadataId,
      entryId,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => RecordListEntryDTO)
  async updateRecordListEntryFields(
    @Args('input') input: UpdateRecordListEntryFieldsInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListEntryDTO> {
    return await this.recordListService.updateRecordListEntryFields({
      ...input,
      workspaceId: workspace.id,
    });
  }

  @Query(() => [RecordListMembershipDTO])
  async recordListMemberships(
    @Args('sourceRecordId', { type: () => UUIDScalarType })
    sourceRecordId: string,
    @Args('parentObjectMetadataId', { type: () => UUIDScalarType })
    parentObjectMetadataId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListMembershipDTO[]> {
    return await this.recordListService.findRecordListMembershipsForRecord({
      sourceRecordId,
      parentObjectMetadataId,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => RecordListEntryDTO)
  async addRecordToList(
    @Args('input') input: AddRecordToListInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListEntryDTO> {
    return await this.recordListService.addRecordToList({
      ...input,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => AddRecordsToListResultDTO)
  async addRecordsToList(
    @Args('input') input: AddRecordsToListInput,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<AddRecordsToListResultDTO> {
    return await this.recordListService.addRecordsToList({
      ...input,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => RecordListEntryDTO)
  async removeRecordFromList(
    @Args('recordListId', { type: () => UUIDScalarType }) recordListId: string,
    @Args('entryId', { type: () => UUIDScalarType }) entryId: string,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RecordListEntryDTO> {
    return await this.recordListService.removeRecordFromList({
      recordListId,
      entryId,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => RemoveRecordsFromListResultDTO)
  async removeRecordsFromList(
    @Args('recordListId', { type: () => UUIDScalarType }) recordListId: string,
    @Args('entryIds', { type: () => [UUIDScalarType] }) entryIds: string[],
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RemoveRecordsFromListResultDTO> {
    return await this.recordListService.removeRecordsFromList({
      recordListId,
      entryIds,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => RemoveRecordsFromListResultDTO)
  async removeRecordsFromListBySourceRecordIds(
    @Args('recordListId', { type: () => UUIDScalarType }) recordListId: string,
    @Args('sourceRecordIds', { type: () => [UUIDScalarType] })
    sourceRecordIds: string[],
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<RemoveRecordsFromListResultDTO> {
    return await this.recordListService.removeRecordsFromListBySourceRecordIds({
      recordListId,
      sourceRecordIds,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => Boolean)
  async syncRecordListRelatedField(
    @Args('recordListId', { type: () => UUIDScalarType }) recordListId: string,
    @Args('sourceFieldMetadataId', { type: () => UUIDScalarType })
    sourceFieldMetadataId: string,
    @Args('sourceRecordId', { type: () => UUIDScalarType, nullable: true })
    sourceRecordId: string | undefined,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<boolean> {
    return await this.recordListService.syncRecordListRelatedField({
      recordListId,
      sourceFieldMetadataId,
      sourceRecordId,
      workspaceId: workspace.id,
    });
  }
}
