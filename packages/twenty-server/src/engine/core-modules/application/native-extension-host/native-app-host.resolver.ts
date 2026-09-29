import { UseGuards } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Query } from '@nestjs/graphql';
import { PermissionFlagType } from 'twenty-shared/constants';
import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import {
  NativeAppHostService,
  type NativeAppAction,
} from 'src/engine/core-modules/application/native-extension-host/native-app-host.service';

@ObjectType('NativeApplication')
export class NativeApplicationDTO {
  @Field(() => String) universalIdentifier: string;
  @Field(() => String) displayName: string;
  @Field(() => String) version: string;
  @Field(() => String) hostCapability: string;
  @Field(() => Boolean) isEnabled: boolean;
}

@ObjectType('NativeApplicationResource')
export class NativeApplicationResourceDTO {
  @Field(() => String) kind: string;
  @Field(() => String) id: string;
}

@UseGuards(WorkspaceAuthGuard)
@MetadataResolver(() => NativeApplicationDTO)
export class NativeAppHostResolver {
  constructor(private readonly host: NativeAppHostService) {}

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  @Query(() => [NativeApplicationResourceDTO])
  nativeApplicationResources(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('universalIdentifier') universalIdentifier: string,
  ) {
    return this.host.inspectResources(workspace.id, universalIdentifier);
  }

  @UseGuards(NoPermissionGuard)
  @Query(() => [NativeApplicationDTO])
  nativeApplications(@AuthWorkspace() workspace: WorkspaceEntity) {
    return this.host.list(workspace.id);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.APPLICATIONS))
  @Mutation(() => [NativeApplicationDTO])
  manageNativeApplication(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @Args('universalIdentifier') universalIdentifier: string,
    @Args('action') action: string,
  ) {
    return this.host.manage(
      workspace.id,
      universalIdentifier,
      action as NativeAppAction,
    );
  }
}
