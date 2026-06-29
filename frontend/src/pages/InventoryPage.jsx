import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Trash2, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

const API_URL = "/api/v1/inventory";

const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '8px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', boxSizing: 'border-box',
};

export default function InventoryPage() {
  const isAdmin = JSON.parse(localStorage.getItem('user') || '{}').role === 'Admin';

  // ── Bobinas ──────────────────────────────────────────────────────────────────
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
      } catch {
        alert("Error o no tienes permisos (Solo Admin)");
      }
    }
  };

  // ── Ítems Generales ───────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', initial_quantity: 0 });
  const [itemError, setItemError] = useState('');
  const [adjustModal, setAdjustModal] = useState(null); // { item, mode: 'cargar'|'descargar' }
  const [adjustQty, setAdjustQty] = useState('');

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/items`);
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInventory();
    fetchItems();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setItemError('');
    try {
      await axios.post(`${API_URL}/items`, {
        name: newItem.name,
        initial_quantity: parseFloat(newItem.initial_quantity) || 0,
      });
      setShowItemModal(false);
      setNewItem({ name: '', initial_quantity: 0 });
      fetchItems();
    } catch (err) {
      setItemError(err.response?.data?.detail || "Error al crear el ítem");
    }
  };

  const handleAdjust = async () => {
    const qty = parseFloat(adjustQty);
    if (!qty || qty <= 0) return;
    try {
      await axios.put(`${API_URL}/items/${adjustModal.item.id}/${adjustModal.mode}`, { quantity: qty });
      setAdjustModal(null);
      setAdjustQty('');
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al ajustar el ítem");
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("¿Eliminar este ítem del inventario?")) {
      try {
        await axios.delete(`${API_URL}/items/${id}`);
        fetchItems();
      } catch {
        alert("Error o no tienes permisos (Solo Admin)");
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── Cabecera Bobinas ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={28} color="var(--primary-blue)" /> Inventario de Bodega
        </h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} style={{ marginRight: '8px' }} /> Ingresar Bobina
          </button>
        )}
      </div>

      {/* ── Tabla Bobinas ── */}
      <div className="glass-card" style={{ padding: '0', marginBottom: '40px' }}>
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
                {isAdmin && <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {rolls.map(roll => {
                const percent = (roll.current_meters / roll.total_meters) * 100;
                const isLow = percent <= 20 && roll.status !== "Agotado";
                return (
                  <tr key={roll.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isLow ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
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
                      }}>{roll.status}</span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button onClick={() => handleDelete(roll.id)} className="btn-outline" style={{ padding: '6px 12px', color: '#fca5a5', borderColor: 'transparent' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Sección Otros Ítems ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '22px', margin: 0 }}>Otros Ítems de Inventario</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setShowItemModal(true); setItemError(''); }}>
            <Plus size={18} style={{ marginRight: '6px' }} /> Nuevo Ítem
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        {items.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay ítems registrados. {isAdmin && 'Crea el primero con el botón "Nuevo Ítem".'}
          </div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px' }}>Nombre</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Cantidad Actual</th>
                {isAdmin && <th style={{ padding: '16px', textAlign: 'center' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '22px', fontWeight: 'bold', color: item.current_quantity <= 0 ? '#ef4444' : 'white' }}>
                    {item.current_quantity % 1 === 0 ? item.current_quantity : item.current_quantity.toFixed(2)}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="btn-outline" style={{ color: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px' }}
                          onClick={() => { setAdjustModal({ item, mode: 'cargar' }); setAdjustQty(''); }}>
                          <ArrowUp size={14} /> Cargar
                        </button>
                        <button className="btn-outline" style={{ color: '#f59e0b', borderColor: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px' }}
                          onClick={() => { setAdjustModal({ item, mode: 'descargar' }); setAdjustQty(''); }}>
                          <ArrowDown size={14} /> Descargar
                        </button>
                        <button className="btn-outline" style={{ color: '#fca5a5', borderColor: 'transparent', padding: '6px 12px' }}
                          onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Bobina ── */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '400px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Registrar Nueva Bobina</h2>
            {error && <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Identificador / Mote</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder="Bobina 1 B-Series" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Ancho del Rollo (m)</label>
                <input type="number" step="0.01" required value={formData.roll_width} onChange={e => setFormData({ ...formData, roll_width: parseFloat(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Total Metros Lineales Orig.</label>
                <input type="number" step="0.1" required value={formData.total_meters} onChange={e => setFormData({ ...formData, total_meters: parseFloat(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Nuevo Ítem ── */}
      {showItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '400px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Nuevo Ítem de Inventario</h2>
            {itemError && <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '14px' }}>{itemError}</div>}
            <form onSubmit={handleCreateItem}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Nombre del Ítem</label>
                <input type="text" required value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} style={inputStyle} placeholder="Ej. Módulo Estándar, Tornillos, Kit Herramientas" />
              </div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Cantidad Inicial</label>
                <input type="number" min="0" step="1" value={newItem.initial_quantity} onChange={e => setNewItem({ ...newItem, initial_quantity: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowItemModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={!newItem.name.trim()}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Cargar / Descargar ── */}
      {adjustModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card animate-fade-in" style={{ width: '360px', padding: '32px' }}>
            <h2 style={{ marginBottom: '8px' }}>
              {adjustModal.mode === 'cargar' ? '+ Cargar' : '− Descargar'}: {adjustModal.item.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: '24px' }}>
              Stock actual: <strong style={{ color: 'white' }}>{adjustModal.item.current_quantity % 1 === 0 ? adjustModal.item.current_quantity : adjustModal.item.current_quantity.toFixed(2)}</strong>
            </p>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                Cantidad a {adjustModal.mode === 'cargar' ? 'agregar' : 'restar'}
              </label>
              <input
                type="number" min="0.01" step="1" autoFocus
                value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdjust()}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setAdjustModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAdjust} disabled={!adjustQty || parseFloat(adjustQty) <= 0}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
