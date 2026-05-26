import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary-100 p-3">
            <Activity className="h-12 w-12 text-primary-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-page-title text-ink">
          Clínica Inteligente
        </h2>
        <p className="mt-2 text-center text-body text-muted">
          Ingresa a tu cuenta para continuar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-8 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-card bg-danger-50 p-4 border border-danger-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-danger-600" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-danger-900">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <Input
              id="email"
              name="email"
              type="email"
              required
              label="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="password"
              name="password"
              type="password"
              required
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
