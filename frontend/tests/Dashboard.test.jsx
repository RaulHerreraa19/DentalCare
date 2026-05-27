import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// @vitest-environment jsdom
import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('../src/lib/axios', () => ({
  default: {
    get: vi.fn(),
  }
}));

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { organization_id: 'org-test', role: 'DOCTOR' } }),
}));

import api from '../src/lib/axios';
import DoctorDashboard from '../src/pages/doctor/Dashboard.jsx';

describe('Doctor Dashboard patient total', () => {
  beforeEach(() => vi.resetAllMocks());

  it('fetches appointments and patient count metadata', async () => {
    api.get.mockImplementation((url, opts) => {
      if (url.startsWith('/appointments')) {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/patients') {
        return Promise.resolve({ data: { data: { items: [], page:1, pageSize:1, total: 42, totalPages:42 } } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<DoctorDashboard />, { wrapper: MemoryRouter });

    await waitFor(() => expect(api.get).toHaveBeenCalled());
    // patient count fetch should be invoked
    expect(api.get.mock.calls.some(c => c[0] === '/patients')).toBeTruthy();
  });
});
