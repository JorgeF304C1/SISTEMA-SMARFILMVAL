import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Shield, Trash2 } from 'lucide-react';

const API_URL = "http://localhost:8000/api/v1/auth";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'Asistente' });
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios. Verifica tus permisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${API_URL}/users`, formData);
      setShowModal(false);
      setFormData({ username: '', password: '', role: 'Asistente' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al crear usuario");
    }
  };

  const handleDelete = async (id, username) => {
    if (username === 'admin') {
      alert("No puedes eliminar al administrador principal.");
      return;
    }
    if (window.confirm(`¿Seguro que deseas eliminar al usuario ${username}?`)) {
      try {
        await axios.delete(`${API_URL}/users/${id}`);
        loadUsers();
      } catch (err) {
        alert("Error al eliminar usuario.");
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={28} color="var(--primary-blue)" /> Control de Usuarios
        </h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={20} style={{ marginRight: '8px' }} /> Nuevo Usuario
        </button>
      </div>

      {error && !showModal && <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      <div className="glass-card" style={{ padding: '0' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando usuarios...</div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px' }}>Nombre de Usuario</th>
                <th style={{ padding: '16px' }}>Rol Asignado</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{user.username}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      background: user.role === 'Admin' ? 'rgba(0,112,243,0.2)' : 'rgba(16,185,129,0.2)', 
                      color: user.role === 'Admin' ? 'var(--primary-blue)' : 'var(--success-green)',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {user.username !== 'admin' && (
                      <button onClick={() => handleDelete(user.id, user.username)} className="btn-outline" style={{ padding: '6px 12px', color: '#fca5a5', borderColor: 'transparent', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '400px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Registrar Nuevo Usuario</h2>
            
            {error && <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Usuario</label>
                <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} placeholder="Ej. vendedor1" />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Contraseña</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Rol / Permisos</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', appearance: 'none' }}>
                  <option value="Asistente">Asistente / Ventas</option>
                  <option value="Admin">Administrador Total</option>
                </select>
                <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formData.role === 'Admin' ? 'Tendrá acceso al inventario, gastos, ajustes globales y usuarios.' : 'Solo podrá ver, crear y cotizar proyectos.'}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
