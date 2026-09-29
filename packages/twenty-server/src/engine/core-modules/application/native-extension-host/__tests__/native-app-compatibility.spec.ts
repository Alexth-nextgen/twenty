import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import semver from 'semver';

import {
  NATIVE_APP_HOST_CAPABILITY_NAME,
  NATIVE_APP_HOST_SUPPORTED_RANGE,
  checkNativeAppHostCapability,
  isNativeAppHostCapabilitySupported,
} from 'src/engine/core-modules/application/native-extension-host/utils/native-app-host-capability.util';

const findRepositoryRoot = () => {
  let directory = __dirname;

  while (!existsSync(path.join(directory, 'native-apps.json'))) {
    const parent = path.dirname(directory);

    if (parent === directory) throw new Error('Repository root not found');

    directory = parent;
  }

  return directory;
};

type NativeAppManifestFixture = {
  universalIdentifier: string;
  displayName: string;
  version: string;
  hostCapability: string;
};

type NativeAppCompatibilityFixture = {
  applicationUniversalIdentifier: string;
  applicationVersion: string;
  hostCapability: string;
  hostSupportedRange: string;
  supportedTwentyVersions: string[];
};

const repositoryRoot = findRepositoryRoot();
const configuration = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'native-apps.json'), 'utf8'),
) as { applications: string[] };
const manifests = configuration.applications.map((directory) => ({
  directory,
  manifest: JSON.parse(
    readFileSync(
      path.join(repositoryRoot, directory, 'native-app.json'),
      'utf8',
    ),
  ) as NativeAppManifestFixture,
}));

// This is the automated compatibility matrix required for every release: the
// app declares a host capability range and this suite fails as soon as a
// manifest and the running host drift apart.
describe('native app compatibility matrix', () => {
  it('registers at least two applications so the host stays generic', () => {
    expect(manifests.length).toBeGreaterThan(1);
  });

  it('gives every application a unique stable identity and semantic version', () => {
    const identifiers = manifests.map(
      ({ manifest }) => manifest.universalIdentifier,
    );

    expect(new Set(identifiers).size).toBe(identifiers.length);

    for (const { directory, manifest } of manifests) {
      expect(manifest.universalIdentifier).toMatch(/^[a-f0-9-]{36}$/);
      expect(semver.valid(manifest.version)).not.toBeNull();
      expect(manifest.displayName.length).toBeGreaterThan(0);
      expect(directory).toBeTruthy();
    }
  });

  it('accepts every shipped application against the running host capability', () => {
    for (const { manifest } of manifests) {
      const result = checkNativeAppHostCapability({
        declaration: manifest.hostCapability,
        universalIdentifier: manifest.universalIdentifier,
        appVersion: manifest.version,
      });

      expect(result.compatible).toBe(true);
    }
  });

  it('publishes a compatibility matrix that matches the shipped manifest', () => {
    for (const { directory, manifest } of manifests) {
      const matrixPath = path.join(
        repositoryRoot,
        directory,
        'compatibility.json',
      );

      expect(existsSync(matrixPath)).toBe(true);

      const matrix = JSON.parse(
        readFileSync(matrixPath, 'utf8'),
      ) as NativeAppCompatibilityFixture;

      expect(matrix.applicationUniversalIdentifier).toBe(
        manifest.universalIdentifier,
      );
      expect(matrix.applicationVersion).toBe(manifest.version);
      expect(matrix.hostCapability).toBe(manifest.hostCapability);
      expect(matrix.supportedTwentyVersions.length).toBeGreaterThan(0);

      for (const twentyVersion of matrix.supportedTwentyVersions) {
        expect(semver.valid(twentyVersion)).not.toBeNull();
      }

      expect(matrix.hostSupportedRange).toBe(NATIVE_APP_HOST_SUPPORTED_RANGE);
    }
  });

  it('rejects capabilities the host does not fully cover', () => {
    expect(isNativeAppHostCapabilitySupported('native-app-host@^1')).toBe(true);
    expect(isNativeAppHostCapabilitySupported('native-app-host@1')).toBe(true);
    expect(isNativeAppHostCapabilitySupported('native-app-host@^2')).toBe(
      false,
    );
    expect(isNativeAppHostCapabilitySupported('native-app-host@>=1.0.0')).toBe(
      false,
    );
    expect(isNativeAppHostCapabilitySupported('other-host@^1')).toBe(false);
    expect(isNativeAppHostCapabilitySupported('native-app-host')).toBe(false);
    expect(isNativeAppHostCapabilitySupported('native-app-host@')).toBe(false);
  });

  it('explains the failure instead of loading a partially supported app', () => {
    expect(
      checkNativeAppHostCapability({
        declaration: undefined,
        universalIdentifier: 'application-a',
        appVersion: '1.0.0',
      }),
    ).toMatchObject({
      compatible: false,
      reason: 'NATIVE_APP_CAPABILITY_MISSING',
    });

    expect(
      checkNativeAppHostCapability({
        declaration: 'native-app-host@not-a-range',
        universalIdentifier: 'application-a',
        appVersion: '1.0.0',
      }),
    ).toMatchObject({
      compatible: false,
      reason: 'NATIVE_APP_CAPABILITY_INVALID',
    });

    const unsupported = checkNativeAppHostCapability({
      declaration: 'native-app-host@^3',
      universalIdentifier: 'application-b',
      appVersion: '2.0.0',
    });

    expect(unsupported).toMatchObject({
      compatible: false,
      reason: 'NATIVE_APP_CAPABILITY_UNSUPPORTED',
    });
    expect(unsupported.compatible === false && unsupported.message).toContain(
      'application-b@2.0.0',
    );
    expect(unsupported.compatible === false && unsupported.message).toContain(
      NATIVE_APP_HOST_CAPABILITY_NAME,
    );
  });
});
