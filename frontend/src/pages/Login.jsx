import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, AlertCircle, ShieldCheck, Stethoscope, Sparkles } from 'lucide-react';
import { isValidEmail, normalizeEmail } from '../lib/validators';
import { Button, Card, Input } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const safeEmail = normalizeEmail(email);
    if (!isValidEmail(safeEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!password.trim()) {
      setError('Ingresa una contraseña válida.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(safeEmail, password);
      if (user.role === 'SUPER_ADMIN') {
        navigate('/superadmin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_28%),linear-gradient(to_bottom,_rgba(255,255,255,0.72),_rgba(255,255,255,0.96))]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-layout py-layout lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="hidden lg:flex lg:items-center">
          <Card className="relative w-full overflow-hidden p-8 xl:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.10),_transparent_30%)]" />
            <div className="relative space-y-8">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary-50 p-4 text-primary-600">
                  <Activity className="h-12 w-12" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-label text-muted">DentalCare</p>
                  <h1 className="text-page-title text-ink">Clínica Inteligente</h1>
                </div>
              </div>

              <div className="space-y-4">
                <p className="max-w-xl text-body text-muted">
                  Accede a un tablero clínico y operativo diseñado para escaneo rápido, flujos predecibles y atención continua.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-panel border border-border bg-surface-muted p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-label text-ink">Acceso seguro</p>
                        <p className="text-caption text-muted">Sesión protegida por rol</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-panel border border-border bg-surface-muted p-4">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="h-5 w-5 text-success-600" />
                      <div>
                        <p className="text-label text-ink">Flujo clínico</p>
                        <p className="text-caption text-muted">Operación consistente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-panel border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
                <Sparkles className="h-4 w-4 text-accent-600" />
                Interfaz calmada, tokenizada y pensada para trabajo administrativo continuo.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md overflow-hidden p-4 sm:p-6 lg:p-8">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-4 flex justify-center lg:hidden">
                <div className="rounded-full bg-primary-50 p-3 text-primary-600">
                  <Activity className="h-10 w-10" aria-hidden="true" />
                </div>
              </div>
              <p className="text-label text-muted">Ingreso seguro</p>
              <h2 className="mt-1 text-page-title text-ink">Clínica Inteligente</h2>
              <p className="mt-2 text-body text-muted">Ingresa a tu cuenta para continuar.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error ? (
                <div role="alert" className="rounded-panel border border-danger-100 bg-danger-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-danger-600" aria-hidden="true" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-danger-900">{error}</h3>
                    </div>
                  </div>
                </div>
              ) : null}

              <Input
                id="email"
                name="email"
                type="email"
                required
                label="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <Input
                id="password"
                name="password"
                type="password"
                required
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Iniciando...' : 'Iniciar sesión'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
