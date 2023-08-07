import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// spy on fetch, because we want to mock out responses anyways. Save real responses for
// e2e

// beforeAll(() => {jest.spyOn(window, 'fetch')});

afterEach(() => {
  cleanup();
});
