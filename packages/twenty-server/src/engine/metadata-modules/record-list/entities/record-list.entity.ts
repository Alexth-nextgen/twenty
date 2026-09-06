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

import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

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
