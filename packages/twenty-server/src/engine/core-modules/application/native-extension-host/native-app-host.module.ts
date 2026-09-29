import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { CommandMenuItemEntity } from 'src/engine/metadata-modules/command-menu-item/entities/command-menu-item.entity';
import { NativeAppHostService } from 'src/engine/core-modules/application/native-extension-host/native-app-host.service';
import { NativeAppHostResolver } from 'src/engine/core-modules/application/native-extension-host/native-app-host.resolver';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationEntity,
      KeyValuePairEntity,
      CommandMenuItemEntity,
    ]),
    PermissionsModule,
    WorkspaceCacheModule,
  ],
  providers: [NativeAppHostService, NativeAppHostResolver],
  exports: [NativeAppHostService],
})
export class NativeAppHostModule {}
