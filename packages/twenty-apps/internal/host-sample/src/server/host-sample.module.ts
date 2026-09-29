import { Module, type OnModuleInit } from '@nestjs/common';

import { NativeAppHostService } from 'src/engine/core-modules/application/native-extension-host/native-app-host.service';
import {
  HOST_SAMPLE_APPLICATION_ID,
  HostSampleService,
} from './host-sample.service';

@Module({
  providers: [HostSampleService],
  exports: [HostSampleService],
})
export class HostSampleModule implements OnModuleInit {
  constructor(
    private readonly host: NativeAppHostService,
    private readonly sample: HostSampleService,
  ) {}

  onModuleInit() {
    // The generic resource inventory powers the uninstall impact overview. This
    // app owns no domain rows, so it registers exactly one synthetic marker.
    this.host.registerResourceInventory(
      HOST_SAMPLE_APPLICATION_ID,
      async (workspaceId) => [
        { kind: 'marker', id: this.sample.getMarker(workspaceId) },
      ],
    );
  }
}
