import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = "http://localhost:8000/api/v1";

export default function NewProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    ci_rif: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    address: '',
    installation_date: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const projectRes = await axios.post(`${API_URL}/projects/`, {
        name: formData.name,
        client_name: formData.client_name,
        client_ci_rif: formData.ci_rif,
        client_phone: formData.client_phone,
        client_email: formData.client_email,
        client_address: formData.address,
        installation_date: formData.installation_date || null
      });
      navigate(`/projects/${projectRes.data.id}`);
      
    } catch (err) {
      console.error(err);
      alert("Error al procesar: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: '28px' }}>Nuevo Proyecto Smart Film</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Mote/Identificación del Proyecto</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Oficina Principal Clínica 2" />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '10px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Cédula / RIF (Opcional)</label>
            <input type="text" name="ci_rif" value={formData.ci_rif} onChange={handleChange} placeholder="Ej. J-12345678-9" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Nombre o Razón Social</label>
            <input required type="text" name="client_name" value={formData.client_name} onChange={handleChange} placeholder="Ej. Constructora Andina" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Teléfono (Opcional)</label>
            <input type="text" name="client_phone" value={formData.client_phone} onChange={handleChange} placeholder="Ej. 0414..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Correo (Opcional)</label>
            <input type="email" name="client_email" value={formData.client_email} onChange={handleChange} placeholder="Ej. juan@..." />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Dirección de Instalación</label>
          <textarea rows="3" name="address" value={formData.address} onChange={handleChange} placeholder="Ej. Calle Principal..."></textarea>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Fecha de Instalación Proyectada (Opcional)</label>
          <input type="date" name="installation_date" value={formData.installation_date} onChange={handleChange} style={{ colorScheme: 'dark' }} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '16px', justifyContent: 'center', padding: '14px', fontSize: '16px' }}>
          <Save size={20} /> {loading ? "Procesando..." : "Crear Proyecto"}
        </button>
      </form>
    </div>
  );
}
