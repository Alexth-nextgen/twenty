import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { appDevOnce, appUninstall } from 'twenty-sdk/cli';

const APP_PATH = process.cwd();
const CONFIG_DIR = path.join(os.homedir(), '.twenty');

const validateEnvironment = (): { apiUrl: string; apiKey: string } => {
  const apiUrl = process.env.TWENTY_API_URL;
  const apiKey = process.env.TWENTY_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      'TWENTY_API_URL and TWENTY_API_KEY must be set. Start a local server with yarn twenty docker:start or provide a remote.',
    );
  }

  return { apiUrl, apiKey };
};

const checkServer = async (apiUrl: string) => {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/healthz`);
  } catch {
    throw new Error(`Twenty server is not reachable at ${apiUrl}.`);
  }

  if (!response.ok) {
    throw new Error(`Server at ${apiUrl} returned ${response.status}`);
  }
};

const writeConfig = (apiUrl: string, apiKey: string) => {
  const payload = JSON.stringify(
    {
      remotes: {
        local: { apiUrl, apiKey, accessToken: apiKey },
      },
      defaultRemote: 'local',
    },
    null,
    2,
  );

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONFIG_DIR, 'config.test.json'), payload);
};

export const setup = async () => {
  const { apiUrl, apiKey } = validateEnvironment();

  await checkServer(apiUrl);
  writeConfig(apiUrl, apiKey);
  await appUninstall({ appPath: APP_PATH }).catch(() => {});

  const result = await appDevOnce({ appPath: APP_PATH });

  if (!result.success) {
    throw new Error(
      `Dev sync failed: ${result.error?.message ?? 'Unknown error'}`,
    );
  }
};

export const teardown = async () => {
  const result = await appUninstall({ appPath: APP_PATH });

  if (!result.success) {
    console.warn(
      `App uninstall failed: ${result.error?.message ?? 'Unknown error'}`,
    );
  }
};
