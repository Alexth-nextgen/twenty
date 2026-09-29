import { type ComponentType } from 'react';

type NativeComponentLoader<TProps = Record<string, never>> = () => Promise<{
  default: ComponentType<TProps>;
}>;
export type NativeRecordSectionProps = {
  sourceRecordId: string;
  parentObjectMetadataId: string;
};
export type NativeAppDefinition = {
  universalIdentifier: string;
  version: string;
  routes: { path: string; load: NativeComponentLoader }[];
  navigation: { id: string; position: number; load: NativeComponentLoader }[];
  recordSections: {
    id: string;
    position: number;
    objectNames: string[];
    load: NativeComponentLoader<NativeRecordSectionProps>;
  }[];
  commands: {
    key: string;
    label?: string;
    shortLabel?: string;
    load: NativeComponentLoader;
  }[];
};
