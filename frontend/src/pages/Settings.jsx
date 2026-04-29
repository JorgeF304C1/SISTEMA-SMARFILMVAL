import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Settings as SettingsIcon } from 'lucide-react';

const API_URL = "/api/v1";

export default function Settings() {
  const [settings, setSettings] = useState({
    default_price_per_sqm: 200,
    default_roll_width: 1.5,
    default_base_cost_per_sqm: 70.0,
    default_labor_cost_per_sqm: 10.0,
    delivery_note_warranty_months: 3
  });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Marketing' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [setRes, expRes] = await Promise.all([
        axios.get(`${API_URL}/settings`).catch(err => { console.error(err); return { data: settings }; }),
        axios.get(`${API_URL}/expenses/`).catch(err => { console.error(err); return { data: [] }; })
      ]);
      setSettings(setRes.data);
      setExpenses(expRes.data);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const res = await axios.get(`${API_URL}/expenses/`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/settings`, settings);
      setMessage('✅ Configuraciones guardadas exitosamente.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('❌ Error al guardar configuraciones.');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/expenses/`, newExpense);
      setNewExpense({ description: '', amount: 0, category: 'Marketing' });
      loadExpenses();
    } catch (err) {
      alert("Error al cargar gasto global.");
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`${API_URL}/expenses/${id}`);
      loadExpenses();
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Cargando configuraciones...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={28} color="var(--primary-blue)" />
          Configuración del Sistema y Empresa
        </h1>
      </div>

      {message && (
        <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '8px', background: message.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('✅') ? 'var(--success-green)' : '#ef4444', border: `1px solid ${message.includes('✅') ? 'var(--success-green)' : '#ef4444'}` }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '32px' }}>
        
        {/* Formularios Settings */}
        <form onSubmit={handleSave} className="glass-card">
          <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Ajustes del Software</h2>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Precio Base Predeterminado ($/m²)</label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Este será el precio inicial que tendrán todos los proyectos nuevos que crees.</p>
          <input 
            type="number" 
            step="0.01" 
            required 
            value={settings.default_price_per_sqm} 
            onChange={e => setSettings({...settings, default_price_per_sqm: parseFloat(e.target.value)})} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Costo de Material Base ($/m²)</label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>El costo predeterminado de 1 m² de bobina real consumida.</p>
          <input 
            type="number" 
            step="0.01" 
            required 
            value={settings.default_base_cost_per_sqm} 
            onChange={e => setSettings({...settings, default_base_cost_per_sqm: parseFloat(e.target.value)})} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Ancho de Bobina Estándar (Metros)</label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>El ancho del rollo de Smart Film usado para calcular los metros lineales.</p>
          <input 
            type="number" 
            step="0.1" 
            required 
            value={settings.default_roll_width} 
            onChange={e => setSettings({...settings, default_roll_width: parseFloat(e.target.value)})} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Costo de Personal Estándar ($/m²)</label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>El costo predeterminado de mano de obra por cada 1 m² instalado.</p>
          <input 
            type="number" 
            step="0.01" 
            required 
            value={settings.default_labor_cost_per_sqm} 
            onChange={e => setSettings({...settings, default_labor_cost_per_sqm: parseFloat(e.target.value)})} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Garantía Nota de Entrega (Meses)</label>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Los meses de garantía que aparecerán automáticamente en el PDF.</p>
          <input 
            type="number" 
            required 
            value={settings.delivery_note_warranty_months} 
            onChange={e => setSettings({...settings, delivery_note_warranty_months: parseInt(e.target.value)})} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
          <Save size={20} style={{ marginRight: '8px' }} />
          Guardar Cambios
        </button>
      </form>

      {/* Gastos Globales */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Gastos Globales y Operativos</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Publicidad (Ads), marketing o gastos empresariales que no son de un proyecto.</p>
        
        <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', marginBottom: '24px' }}>
          <input 
            type="text" 
            required 
            placeholder="Descripción (ej. Facebook Ads)"
            value={newExpense.description} 
            onChange={e => setNewExpense({...newExpense, description: e.target.value})} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
          <input 
            type="number" 
            step="0.1" 
            placeholder="Monto $"
            required 
            value={newExpense.amount || ''} 
            onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          />
          <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1', padding: '12px', justifyContent: 'center' }}>Añadir Gasto Operativo</button>
        </form>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {expenses.length === 0 ? (
           <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No hay gastos globales registrados.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {expenses.map(exp => (
                <li key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <strong style={{ display: 'block' }}>{exp.description}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.category} - {new Date(exp.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ color: '#ef4444' }}>${exp.amount.toFixed(2)}</strong>
                    <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
     </div>
    </div>
  );
}
