import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import vi from 'vitest';

vi.mock('../../../lib/axios', () => ({
  get: async (url) => {
    if (url.includes('/appointments')) {
      return { data: { data: [
        { id: 'a1', doctor: { id: 'doc-1' }, patient: { first_name: 'P' } },
        { id: 'a2', doctor: { id: 'doc-2' }, patient: { first_name: 'Q' } },
        { id: 'a3', doctor: { id: 'doc-1' }, patient: { first_name: 'R' } }
      ] } };
    }
    if (url.includes('/patients')) return { data: { data: [] } };
    return { data: { data: [] } };
  }
}));

vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'doc-1' } }) }));

import DoctorDashboard from '../Dashboard';

describe('DoctorDashboard', () => {
  it('counts only appointments for current doctor', async () => {
    render(React.createElement(DoctorDashboard));

    await waitFor(() => {
      expect(screen.getByText('Citas Hoy')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('does not crash when user or doctor missing', async () => {
    // simulate missing doctor on some appointments
    vi.mock('../../../lib/axios', () => ({
      get: async (url) => ({ data: { data: [ { id: 'a1', doctor: null } ] } })
    }));
    vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
    const { container } = render(React.createElement(DoctorDashboard));
    await waitFor(() => {
      // should render without throwing
      expect(container).toBeDefined();
    });
  });
});
