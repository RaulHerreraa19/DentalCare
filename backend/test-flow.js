async function test() {
  const baseURL = 'http://localhost:3000/api/v1';

  async function apiFetch(path, options = {}) {
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    const res = await fetch(`${baseURL}${path}`, options);
    const contentType = res.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    return { status: res.status, data };
  }

  try {
    // 1. Login as receptionist
    let res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'recep1m@dentalsmile.com', password: 'password123' })
    });
    
    if (res.status !== 200) throw new Error(JSON.stringify(res.data));
    const token = res.data.data.token;
    const orgId = res.data.data.user.organization_id;
    const userRole = res.data.data.user.role;
    
    // We can just use clinicId from getting clinics
    const headers = { Authorization: `Bearer ${token}` };
    res = await apiFetch('/clinics', { headers });
    const clinicId = res.data.data[0].id;
    
    // 2. Fetch doctors 
    res = await apiFetch('/users/team', { headers });
    const doctor = res.data.data.find(u => u.role === 'DOCTOR');
    
    // 3. Fetch patients
    res = await apiFetch('/patients', { headers });
    const patient = res.data.data[0];
    
    // 4. Fetch offices
    res = await apiFetch(`/clinics/${clinicId}/offices`, { headers });
    const office = res.data.data[0];
    
    // 5. Create appointment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    res = await apiFetch('/appointments', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clinic_id: clinicId,
        office_id: office.id,
        doctor_id: doctor.id,
        patient_id: patient.id,
        start_time: tomorrow.toISOString(),
        end_time: new Date(tomorrow.getTime() + 60*60000).toISOString(),
        reason: 'Checkup'
      })
    });
    const appointmentId = res.data.data.id;
    console.log('1. Created appointment:', appointmentId);
    
    // 6. Login as doctor (to mark as IN_PROGRESS)
    let resDoc = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: doctor.email, password: 'password123' })
    });
    const docToken = resDoc.data.data.token;
    const docHeaders = { Authorization: `Bearer ${docToken}` };
    
    await apiFetch(`/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: docHeaders,
      body: JSON.stringify({ status: 'IN_PROGRESS', total_amount: 500 })
    });
    console.log('2. Doctor marked as IN_PROGRESS with 500');
    
    // 7. Receptionist collects payment with different amount (e.g., empty string which causes undefined if missing, or specific value)
    console.log('Sending finalAmount: 850');
    res = await apiFetch(`/billing/collect/${appointmentId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ finalAmount: '850.50' }) // sending as string since that's what input provides
    });
    
    if (res.status === 200) {
      console.log('3. Receptionist collected payment. Result:', res.data.data.total_amount);
    } else {
      console.log('3. Failed to collect:', res.data);
    }
    
    // 8. Verify the CashRegister
    // To do this, login as owner
    let resOwner = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'owner1@dentalsmile.com', password: 'password123' })
    });
    const ownerToken = resOwner.data.data.token;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    
    res = await apiFetch('/billing/history', { headers: ownerHeaders });
    const cashEntry = res.data.data.find(c => c.appointment_id === appointmentId);
    console.log('4. CashRegister entry amount:', cashEntry ? cashEntry.amount : 'Not found');
    
  } catch (err) {
    console.error(err);
  }
}
test();
