import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultsPanel } from './ResultsPanel';
import type { ServiceResult } from './service-board.schema';

/**
 * ResultsPanel — RTL snapshot tests.
 *
 * Covers: 1 result, 3 results. Asserts testid presence and snapshot stability.
 *
 * @ticket T-382
 */

const mockResult1: ServiceResult = {
  serviceType: 'spellcheck',
  output: 'Corrected 5 spelling errors: "recieve" → "receive", "occured" → "occurred", "seperate" → "separate", "definately" → "definitely", "accomodate" → "accommodate".',
  outputType: 'corrected-paper',
  changesCount: 5,
};

const mockResult2: ServiceResult = {
  serviceType: 'edit-abstract',
  output: 'Revised abstract for clarity. Reduced word count from 312 to 248. Strengthened opening thesis statement and tightened concluding implications.',
  outputType: 'corrected-paper',
  changesCount: 12,
};

const mockResult3: ServiceResult = {
  serviceType: 'doi-metadata',
  output: '{"title":"On the Substrate Logic of Bio-Computing","authors":[{"given":"J.","family":"Frel"}],"type":"journal-article","DOI":"10.1234/example.2026"}',
  outputType: 'metadata',
};

describe('ResultsPanel', () => {
  it('renders with 1 result', () => {
    const { container, getByTestId } = render(
      <ResultsPanel
        results={[mockResult1]}
        workText="Sample paper text for testing."
        evaluationBand="strong"
      />,
    );
    expect(getByTestId('results-panel')).not.toBeNull();
    expect(getByTestId('results-download-paper')).not.toBeNull();
    expect(getByTestId('results-download-receipt')).not.toBeNull();
    expect(getByTestId('results-service-spellcheck')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('renders with 3 results', () => {
    const { container, getByTestId } = render(
      <ResultsPanel
        results={[mockResult1, mockResult2, mockResult3]}
        workText="Sample paper text for testing."
        evaluationBand="strong"
      />,
    );
    expect(getByTestId('results-panel')).not.toBeNull();
    expect(getByTestId('results-service-spellcheck')).not.toBeNull();
    expect(getByTestId('results-service-edit-abstract')).not.toBeNull();
    expect(getByTestId('results-service-doi-metadata')).not.toBeNull();
    expect(container).toMatchSnapshot();
  });
});
