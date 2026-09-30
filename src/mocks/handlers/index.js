/** MSW handlers implementing docs/lld/api/openapi.yaml against the in-memory db. */
import { authHandlers } from './auth.js';
import { workspaceHandlers } from './workspaces.js';
import { taskHandlers } from './tasks.js';
import { miscHandlers } from './misc.js';

export const handlers = [...authHandlers, ...workspaceHandlers, ...taskHandlers, ...miscHandlers];
