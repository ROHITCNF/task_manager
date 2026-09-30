import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../../src/mocks/node.js';
import { db } from '../../src/mocks/db.js';

export const TEST_BASE_URL = 'http://localhost/api/v1';

/** Starts the MSW node server for the current test file and resets mock data between tests. */
export function setupMockServer() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    db.reset();
  });
  afterAll(() => server.close());
  return server;
}

/** Signs the mock server's session in as a fixture user by email (e.g. the workspace owner). */
export const signInAs = (email) => db.signIn(email);

export const testConfig = Object.freeze({ apiMode: 'mock', apiBaseUrl: TEST_BASE_URL, authMode: 'mock', requestTimeoutMs: 2000 });
