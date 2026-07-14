import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ServiceType, ServiceNodeState, ServiceResult } from './service-board.schema';

/**
 * service-board.view — RTL snapshot tests.
 *
 * Mocks useMachine to return controlled state snapshots for key machine states:
 * idle, processing (with mock nodeStates), all_complete.
 *
 * @ticket T-382
 */

// ── Mock @xstate/react ────────────────────────────────────────

const mockSend = vi.fn();

// Default: idle state
let mockSnapshot: {
  value: string;
  context: {
    selectedServices: ServiceType[];
    paperText: string;
    nodeStates: Record<string, ServiceNodeState>;
    results: ServiceResult[];
  };
} = {
  value: 'idle',
  context: {
    selectedServices: [],
    paperText: '',
    nodeStates: {},
    results: [],
  },
};

vi.mock('@xstate/react', () => ({
  useMachine: vi.fn(() => [mockSnapshot, mockSend]),
}));

// Also mock the machine and logic modules to prevent import errors
vi.mock('./service-board.machine', () => ({
  serviceBoardMachine: {},
}));

vi.mock('./service-board.logic', () => ({
  requestAllServices: vi.fn(),
}));

describe('ServiceBoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSnapshot = {
      value: 'idle',
      context: {
        selectedServices: [],
        paperText: '',
        nodeStates: {},
        results: [],
      },
    };
  });

  // We dynamically import after mocks are set up
  async function renderView(overrides?: Partial<typeof mockSnapshot>) {
    if (overrides) {
      mockSnapshot = { ...mockSnapshot, ...overrides };
      if (overrides.context) {
        mockSnapshot.context = { ...mockSnapshot.context, ...overrides.context };
      }
    }
    const { ServiceBoardView } = await import('./service-board.view');
    return render(
      <ServiceBoardView
        woodchipperReading={{ band: 'strong' }}
        workText="Test paper content."
        workType="journal-article"
        standing="postdoctoral"
      />,
    );
  }

  it('renders idle state with ServiceOptions', async () => {
    const { container, getByTestId } = await renderView({
      value: 'idle',
      context: {
        selectedServices: [],
        paperText: '',
        nodeStates: {},
        results: [],
      },
    });
    expect(getByTestId('service-board')).not.toBeNull();
    expect(getByTestId('service-request-btn')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('renders processing state with ServiceNodes', async () => {
    const { container, getByTestId } = await renderView({
      value: 'processing',
      context: {
        selectedServices: ['spellcheck', 'edit-abstract'],
        paperText: 'My paper.',
        nodeStates: {
          spellcheck: { status: 'active', statusText: 'Running spellcheck…' },
          'edit-abstract': { status: 'pending' },
        },
        results: [],
      },
    });
    expect(getByTestId('service-board')).not.toBeNull();
    expect(getByTestId('service-node-spellcheck')).not.toBeNull();
    expect(getByTestId('service-node-edit-abstract')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('renders all_complete state with ResultsPanel', async () => {
    const { container, getByTestId } = await renderView({
      value: 'all_complete',
      context: {
        selectedServices: ['spellcheck'],
        paperText: 'My paper.',
        nodeStates: {
          spellcheck: {
            status: 'complete',
            result: {
              serviceType: 'spellcheck',
              output: 'Fixed 3 errors.',
              outputType: 'corrected-paper',
              changesCount: 3,
            },
          },
        },
        results: [
          {
            serviceType: 'spellcheck',
            output: 'Fixed 3 errors.',
            outputType: 'corrected-paper',
            changesCount: 3,
          },
        ],
      },
    });
    expect(getByTestId('service-board')).not.toBeNull();
    expect(getByTestId('results-panel')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });
});
