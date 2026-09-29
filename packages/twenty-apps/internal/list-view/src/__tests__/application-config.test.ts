import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { describe, expect, it } from 'vitest';

describe('application identifiers', () => {
  it('exposes stable application metadata constants', () => {
    expect(APP_DISPLAY_NAME).toBe('Lists');
    expect(APP_DESCRIPTION).toBeTruthy();
    expect(APPLICATION_UNIVERSAL_IDENTIFIER).toBe(
      'ac8f2b7a-15d3-47fa-a06c-2bfc6d85ec72',
    );
    expect(DEFAULT_ROLE_UNIVERSAL_IDENTIFIER).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
