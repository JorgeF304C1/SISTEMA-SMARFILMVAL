import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Trash2, AlertTriangle } from 'lucide-react';

const API_URL = "/api/v1/inventory";

export default function InventoryPage() {
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', roll_width: 1.5, total_meters: 50 });
  const [error, setError] = useState('');

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/`);
      setRolls(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post(`${API_URL}/`, formData);
      setShowModal(false);
      setFormData({ name: '', roll_width: 1.5, total_meters: 50 });
      loadInventory();
    } catch (err) {
      setError(err.response?.data?.detail || "Error al registrar la bobina");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar el registro de esta bobina?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        loadInventory();
      } catch (err) {
        alert("Error o no tienes permisos (Solo Admin)");
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={28} color="var(--primary-blue)" /> Inventario de Bodega
        </h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} style={{ marginRight: '8px' }} /> Ingresar Bobina
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando stock...</div>
        ) : rolls.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay bobinas registradas.</div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px' }}>Identificador</th>
                <th style={{ padding: '16px' }}>Ancho de Rollo</th>
                <th style={{ padding: '16px' }}>Mts Restantes</th>
                <th style={{ padding: '16px' }}>Estado</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rolls.map(roll => {
                const percent = (roll.current_meters / roll.total_meters) * 100;
                const isLow = percent <= 20 && roll.status !== "Agotado";
                
                return (
                <tr key={roll.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', background: isLow ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{roll.name}</td>
                  <td style={{ padding: '16px' }}>{roll.roll_width} m</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{roll.current_meters.toFixed(2)} / {roll.total_meters}</span>
                      {isLow && <AlertTriangle size={16} color="#ef4444" title="Stock Bajo" />}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      background: roll.status === 'Activo' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', 
                      color: roll.status === 'Activo' ? 'var(--success-green)' : '#ef4444',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                    }}>
                      {roll.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(roll.id)} className="btn-outline" style={{ padding: '6px 12px', color: '#fca5a5', borderColor: 'transparent', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '400px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Registrar Nueva Bobina</h2>
            
            {error && <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Identificador / Mote</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} placeholder="Bobina 1 B-Series" />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Ancho del Rollo (m)</label>
                <input type="number" step="0.01" required value={formData.roll_width} onChange={e => setFormData({...formData, roll_width: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Total Metros Lineales Orig.</label>
                <input type="number" step="0.1" required value={formData.total_meters} onChange={e => setFormData({...formData, total_meters: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
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
