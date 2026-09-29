import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  mixin,
} from '@nestjs/common';
import { NativeAppHostService } from 'src/engine/core-modules/application/native-extension-host/native-app-host.service';
import { getRequestOrThrowWhenUnauthenticated } from 'src/engine/guards/utils/get-request-or-throw-when-unauthenticated.util';

export const NativeAppEnabledGuard = (
  universalIdentifier: string,
): import('@nestjs/common').Type<CanActivate> => {
  @Injectable()
  class NativeAppGuard implements CanActivate {
    constructor(private readonly host: NativeAppHostService) {}
    async canActivate(context: ExecutionContext) {
      const request = getRequestOrThrowWhenUnauthenticated(context);
      if (!request.workspace) return false;
      await this.host.assertEnabled(request.workspace.id, universalIdentifier);
      return true;
    }
  }
  return mixin(NativeAppGuard);
};
