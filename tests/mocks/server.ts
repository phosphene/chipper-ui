import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// MSW server for all API mocking in tests
// All handlers are written against the openapi.yaml spec shapes
export const server = setupServer(...handlers);
