import semver from 'semver';

// The host capability is the only contract a native app depends on. It is
// versioned independently from the Twenty version so that an app can declare a
// compatible version range instead of a single exact host build.
export const NATIVE_APP_HOST_CAPABILITY_NAME = 'native-app-host';

// Every capability version the running host implements. A new capability
// version is a breaking change and requires a new range.
export const NATIVE_APP_HOST_SUPPORTED_RANGE = '>=1.0.0 <2.0.0';

export type NativeAppHostCapability = {
  name: string;
  versionRange: string;
};

export const parseNativeAppHostCapability = (
  declaration: string,
): NativeAppHostCapability | null => {
  const separatorIndex = declaration.lastIndexOf('@');

  if (separatorIndex <= 0) {
    return null;
  }

  const name = declaration.slice(0, separatorIndex);
  const versionRange = declaration.slice(separatorIndex + 1);

  if (name.length === 0 || versionRange.length === 0) {
    return null;
  }

  return { name, versionRange };
};

export const isNativeAppHostCapabilitySupported = (
  declaration: string,
): boolean => {
  const capability = parseNativeAppHostCapability(declaration);

  if (!isNativeAppHostCapabilityDeclarationValid(declaration)) {
    return false;
  }

  // A partial overlap would let the app load with missing functions, which is
  // explicitly not allowed: the declared range must be fully covered.
  return semver.subset(
    capability!.versionRange,
    NATIVE_APP_HOST_SUPPORTED_RANGE,
  );
};

export const isNativeAppHostCapabilityDeclarationValid = (
  declaration: string,
): boolean => {
  const capability = parseNativeAppHostCapability(declaration);

  if (capability === null) {
    return false;
  }

  if (capability.name !== NATIVE_APP_HOST_CAPABILITY_NAME) {
    return false;
  }

  return semver.validRange(capability.versionRange) !== null;
};

export type NativeAppHostCapabilityFailureReason =
  | 'NATIVE_APP_CAPABILITY_MISSING'
  | 'NATIVE_APP_CAPABILITY_INVALID'
  | 'NATIVE_APP_CAPABILITY_UNSUPPORTED';

export type NativeAppHostCapabilityCheckResult =
  | { compatible: true; capability: NativeAppHostCapability }
  | {
      compatible: false;
      reason: NativeAppHostCapabilityFailureReason;
      message: string;
    };

export const checkNativeAppHostCapability = ({
  declaration,
  universalIdentifier,
  appVersion,
}: {
  declaration: string | undefined;
  universalIdentifier: string;
  appVersion: string;
}): NativeAppHostCapabilityCheckResult => {
  const hostDescription = `${NATIVE_APP_HOST_CAPABILITY_NAME}@${NATIVE_APP_HOST_SUPPORTED_RANGE}`;

  if (declaration === undefined || declaration.trim().length === 0) {
    return {
      compatible: false,
      reason: 'NATIVE_APP_CAPABILITY_MISSING',
      message: `Native app ${universalIdentifier}@${appVersion} does not declare a required host capability. This server provides ${hostDescription}.`,
    };
  }

  if (!isNativeAppHostCapabilityDeclarationValid(declaration)) {
    return {
      compatible: false,
      reason: 'NATIVE_APP_CAPABILITY_INVALID',
      message: `Native app ${universalIdentifier}@${appVersion} declares the invalid host capability "${declaration}". Expected "<name>@<semver range>" for ${NATIVE_APP_HOST_CAPABILITY_NAME}.`,
    };
  }

  if (!isNativeAppHostCapabilitySupported(declaration)) {
    return {
      compatible: false,
      reason: 'NATIVE_APP_CAPABILITY_UNSUPPORTED',
      message: `Native app ${universalIdentifier}@${appVersion} requires host capability ${declaration} but this server only provides ${hostDescription}. Update Twenty or install a compatible app version.`,
    };
  }

  return {
    compatible: true,
    capability: parseNativeAppHostCapability(declaration)!,
  };
};
