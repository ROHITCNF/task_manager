/**
 * Mock server ↔ OpenAPI contract check: every response body the mocks produce must validate
 * against docs/lld/api/openapi.yaml (plan: Verification).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { setupMockServer, TEST_BASE_URL } from '../../tests/setup/mockServer.js';

setupMockServer();

const spec = YAML.parse(readFileSync(new URL('../../docs/lld/api/openapi.yaml', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema({ $id: 'openapi', components: spec.components });

/** Validator for `{ data: <schema> }` or a list envelope. */
function envelope(ref, { list = false, paged = list } = {}) {
  const item = { $ref: `openapi#/components/schemas/${ref}` };
  return ajv.compile({
    type: 'object',
    required: paged ? ['data', 'meta'] : ['data'],
    properties: {
      data: list ? { type: 'array', items: item } : item,
      ...(paged ? { meta: { $ref: 'openapi#/components/schemas/CursorMeta' } } : {}),
    },
  });
}

const WS = 'wsp_01J8Z000000000000000000001';
let cookieless = null;

async function call(method, path, body) {
  const res = await fetch(`${TEST_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'dmt-web' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
}

function expectValid(validate, body) {
  const ok = validate(body);
  expect(ok, JSON.stringify(validate.errors?.slice(0, 3), null, 2)).toBe(true);
}

describe('mock responses match openapi.yaml', () => {
  it('auth, me and workspaces', async () => {
    cookieless = await call('GET', '/auth/session');
    expect(cookieless.status).toBe(401);
    expectValid(ajv.compile({ $ref: 'openapi#/components/schemas/Problem' }), cookieless.body);

    expectValid(envelope('Session'), (await call('POST', '/auth/mock-login', {})).body);
    expectValid(envelope('Session'), (await call('GET', '/auth/session')).body);
    expectValid(envelope('User'), (await call('GET', '/me')).body);
    expectValid(envelope('Workspace', { list: true, paged: false }), (await call('GET', '/me/workspaces')).body);
    expectValid(envelope('Member', { list: true }), (await call('GET', `/workspaces/${WS}/members`)).body);
    expectValid(envelope('Workspace'), (await call('POST', '/workspaces', { name: 'X' })).body);
  });

  it('tasks, stats, dashboard, clients, labels, quick capture', async () => {
    await call('POST', '/auth/mock-login', {});
    expectValid(envelope('Task', { list: true }), (await call('GET', `/workspaces/${WS}/tasks?limit=200`)).body);
    expectValid(envelope('TaskCalendarItem', { list: true }), (await call('GET', `/workspaces/${WS}/tasks?view=calendar&limit=200`)).body);
    expectValid(envelope('TaskStats'), (await call('GET', `/workspaces/${WS}/tasks/stats?groupBy=status`)).body);
    expectValid(envelope('TaskStats'), (await call('GET', `/workspaces/${WS}/tasks/stats?groupBy=assignee&statusGroup=open`)).body);
    expectValid(envelope('Dashboard'), (await call('GET', `/workspaces/${WS}/dashboard?tz=Asia/Kolkata`)).body);
    expectValid(envelope('Client', { list: true }), (await call('GET', `/workspaces/${WS}/clients?limit=200`)).body);
    expectValid(envelope('Label', { list: true, paged: false }), (await call('GET', `/workspaces/${WS}/labels`)).body);
    expectValid(envelope('Doc', { list: true }), (await call('GET', `/workspaces/${WS}/docs`)).body);

    const created = await call('POST', `/workspaces/${WS}/tasks`, { title: 'New one', dueDate: '2026-10-02' });
    expect(created.status).toBe(201);
    expectValid(envelope('Task'), created.body);

    const [first] = (await call('GET', `/workspaces/${WS}/tasks?status=backlog&limit=1`)).body.data;
    expectValid(envelope('Task'), (await call('GET', `/workspaces/${WS}/tasks/${first.id}`)).body);
    expectValid(envelope('TaskHistory'), (await call('GET', `/workspaces/${WS}/tasks/${first.id}/history`)).body);

    const split = await call('POST', `/workspaces/${WS}/quick-capture/split`, { text: '- a\n- b', source: 'meeting' });
    expect(split.body.data.drafts).toEqual([{ title: 'a' }, { title: 'b' }]);
  });
});
