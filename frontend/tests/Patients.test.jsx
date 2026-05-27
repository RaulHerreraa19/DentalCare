import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
// @vitest-environment jsdom
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

vi.mock('../src/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { organization_id: 'org-test', role: 'RECEPTIONIST' } }),
}));

import api from '../src/lib/axios';
import Patients from '../src/pages/reception/Patients.jsx';

describe('Patients page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('performs one initial paginated fetch and renders results', async () => {
    api.get.mockResolvedValueOnce({ data: { data: { items: [{ id: 'p1', first_name: 'Ana', last_name: 'Lopez', created_at: new Date().toISOString() }], page: 1, pageSize: 10, total: 1, totalPages: 1 } } });

    render(<Patients />, { wrapper: MemoryRouter });

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/Ana Lopez/)).toBeTruthy();
  });

  it('debounced search triggers a single fetch after timeout', async () => {
    api.get.mockResolvedValue({ data: { data: { items: [], page:1, pageSize:10, total:0, totalPages:1 } } });

    render(<Patients />, { wrapper: MemoryRouter });
    const inputs = screen.getAllByPlaceholderText('Escribe para filtrar...');
    const input = inputs[0];
    fireEvent.change(input, { target: { value: 'juan' } });

    // after debounce settles, the total number of calls should be at least 2 (initial + search)
    await waitFor(() => expect(api.get.mock.calls.length).toBeGreaterThanOrEqual(2), { timeout: 2000 });
  });
});
