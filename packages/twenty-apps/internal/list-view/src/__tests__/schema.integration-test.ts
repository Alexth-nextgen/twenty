import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { describe, expect, it } from 'vitest';

describe('Lists app installation', () => {
  it('registers the standard application', async () => {
    const client = new MetadataApiClient();
    const result = await client.query({
      findManyApplications: {
        id: true,
        name: true,
        universalIdentifier: true,
      },
    });

    const application = result.findManyApplications.find(
      (item: { universalIdentifier: string }) =>
        item.universalIdentifier === APPLICATION_UNIVERSAL_IDENTIFIER,
    );

    expect(application).toBeDefined();
  });
});
