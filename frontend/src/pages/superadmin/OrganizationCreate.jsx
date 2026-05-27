import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, UserPlus, KeyRound, Mail, Hash } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../lib/axios';
import { Button, Card, Input, SectionHeader } from '../../components/ui';

const initialForm = {
  name: '',
  slug: '',
  owner_first_name: '',
  owner_last_name: '',
  owner_email: '',
  owner_password: '',
  confirm_password: '',
};

export default function OrganizationCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.owner_password !== form.confirm_password) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseñas distintas',
        text: 'La contraseña y su confirmación deben coincidir.',
        confirmButtonColor: '#0f172a',
      });
      return;
    }

    setLoading(true);

    try {
      await api.post('/organizations', {
        name: form.name,
        slug: form.slug,
        owner_first_name: form.owner_first_name,
        owner_last_name: form.owner_last_name,
        owner_email: form.owner_email,
        owner_password: form.owner_password,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Negocio creado',
        text: 'El negocio y su dueño quedaron registrados correctamente.',
        confirmButtonColor: '#0f172a',
      });

      navigate('/superadmin/organizations');
    } catch (error) {
      const message =
        error?.response?.data?.message || 'No se pudo crear el negocio.';

      Swal.fire({
        icon: 'error',
        title: 'Error al crear',
        text: message,
        confirmButtonColor: '#0f172a',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-section px-layout py-layout animate-in fade-in duration-500">
      <SectionHeader
        eyebrow="Super Admin"
        title="Crear nuevo negocio"
        description="Registra la organización y su dueño inicial en una sola operación."
        actions={(
          <Link
            to="/superadmin/organizations"
            className="inline-flex items-center text-sm font-medium text-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a negocios
          </Link>
        )}
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border bg-surface-muted px-6 py-5">
          <div className="rounded-panel bg-primary-50 p-2 text-primary-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-section-title text-ink">Datos del negocio</h2>
            <p className="text-body text-muted">Estos campos identifican la organización dentro de la plataforma.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-section p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Nombre del negocio"
                required
                placeholder="DentalCare Centro"
                value={form.name}
                onChange={updateField('name')}
              />

              <Input
                label="Slug / identificador"
                required
                placeholder="dentalcare-centro"
                value={form.slug}
                onChange={updateField('slug')}
                prefix={<Hash className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Nombre del dueño"
                required
                placeholder="Ana"
                value={form.owner_first_name}
                onChange={updateField('owner_first_name')}
                prefix={<UserPlus className="h-4 w-4" />}
              />

              <Input
                label="Apellido del dueño"
                required
                placeholder="García"
                value={form.owner_last_name}
                onChange={updateField('owner_last_name')}
                prefix={<UserPlus className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Input
                label="Correo del dueño"
                required
                type="email"
                placeholder="dueno@negocio.com"
                value={form.owner_email}
                onChange={updateField('owner_email')}
                prefix={<Mail className="h-4 w-4" />}
              />

              <Input
                label="Contraseña"
                required
                type="password"
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={form.owner_password}
                onChange={updateField('owner_password')}
                prefix={<KeyRound className="h-4 w-4" />}
              />
            </div>

            <Input
              label="Confirmar contraseña"
              required
              type="password"
              minLength={8}
              placeholder="Repite la contraseña"
              value={form.confirm_password}
              onChange={updateField('confirm_password')}
              prefix={<KeyRound className="h-4 w-4" />}
              containerClassName="max-w-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border bg-surface-muted px-6 py-4">
            <Button as={Link} to="/superadmin/organizations" variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Crear negocio y dueño'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}