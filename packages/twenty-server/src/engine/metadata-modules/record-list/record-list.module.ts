import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { RecordListEntity } from 'src/engine/metadata-modules/record-list/entities/record-list.entity';
import { RecordListService } from 'src/engine/metadata-modules/record-list/services/record-list.service';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecordListEntity]),
    FieldMetadataModule,
    ObjectMetadataModule,
  ],
  providers: [
    RecordListService,
    provideWorkspaceScopedRepository(RecordListEntity),
  ],
  exports: [RecordListService],
})
export class RecordListModule {}
