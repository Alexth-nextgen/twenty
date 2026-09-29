import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { UserWorkspaceEntity } from 'src/engine/core-modules/application/native-extension-host/api/engine/core-modules/user-workspace/user-workspace.entity';
import { ObjectMetadataEntity } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/object-metadata/object-metadata.entity';
import { WorkspaceRelatedEntity } from 'src/engine/core-modules/application/native-extension-host/api/engine/workspace-manager/types/workspace-related-entity';
import { ViewEntity } from 'src/engine/core-modules/application/native-extension-host/api/engine/metadata-modules/view/entities/view.entity';
import { WasIntroducedInUpgrade } from 'src/engine/core-modules/application/native-extension-host/api/engine/core-modules/upgrade/decorators/was-introduced-in-upgrade.decorator';
import { ADD_DEFAULT_VIEW_TO_RECORD_LIST_UPGRADE_COMMAND_NAME } from '../constants/add-default-view-upgrade-command-name.constant';

@Entity({ name: 'recordList', schema: 'core' })
@Index('IDX_RECORD_LIST_WORKSPACE_ID_PARENT_OBJECT_METADATA_ID', [
  'workspaceId',
  'parentObjectMetadataId',
])
export class RecordListEntity
  extends WorkspaceRelatedEntity
  implements Required<RecordListEntity>
{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text' })
  name: string;

  @Column({ nullable: true, type: 'text' })
  icon: string | null;

  @Column({ nullable: false, type: 'double precision', default: 0 })
  position: number;

  @Column({ nullable: false, type: 'uuid' })
  parentObjectMetadataId: string;

  @ManyToOne(() => ObjectMetadataEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentObjectMetadataId' })
  parentObjectMetadata: Relation<ObjectMetadataEntity>;

  @Column({ nullable: false, type: 'uuid' })
  entryObjectMetadataId: string;

  @OneToOne(() => ObjectMetadataEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entryObjectMetadataId' })
  entryObjectMetadata: Relation<ObjectMetadataEntity>;

  @WasIntroducedInUpgrade({
    upgradeCommandName: ADD_DEFAULT_VIEW_TO_RECORD_LIST_UPGRADE_COMMAND_NAME,
  })
  @Column({ nullable: true, type: 'uuid' })
  defaultViewId: string | null;

  @ManyToOne(() => ViewEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'defaultViewId' })
  defaultView: Relation<ViewEntity> | null;

  @Column({ nullable: true, type: 'uuid' })
  createdByUserWorkspaceId: string | null;

  @ManyToOne(() => UserWorkspaceEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'createdByUserWorkspaceId' })
  createdBy: Relation<UserWorkspaceEntity> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
