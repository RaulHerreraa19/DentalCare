import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'doc-1' } }) }));

vi.mock('../../../lib/axios', () => ({
  get: async (url) => {
    if (url.startsWith('/appointments/')) {
      const err = new Error('Not Found');
      err.response = { status: 404, data: { message: 'Cita no encontrada.' } };
      throw err;
    }
    if (url.startsWith('/patients/')) return { data: { data: { id: 'pt1', first_name: 'Paciente' } } };
    if (url.startsWith('/medical-records/') && url.endsWith('/consents')) return { data: { data: [] } };
    if (url.startsWith('/medical-records/')) return { data: { data: null } };
    return { data: { data: null } };
  }
}));

import MedicalRecordWizard from '../MedicalRecordWizard';

describe('MedicalRecordWizard appointment 404 handling', () => {
  it('tolerates 404 from appointment fetch and renders patient info', async () => {
    render(
      <MemoryRouter initialEntries={["/doctor/medical-records/pt1?appointmentId=apt1"]}>
        <Routes>
          <Route path="/doctor/medical-records/:patientId" element={<MedicalRecordWizard />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait until loading finishes
    await waitFor(() => expect(screen.queryByText('Cargando...')).toBeNull());

    // Patient name should be rendered even if appointment 404
    expect(screen.getByText(/Paciente:/)).toBeTruthy();
  });
});
