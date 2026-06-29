import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';

const API_URL = "/api/v1/inventory/movements";

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function MovementsPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos'); // 'todos' | 'cargo' | 'descargo'

  useEffect(() => {
    axios.get(API_URL)
      .then(res => setMovements(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'todos'
    ? movements
    : movements.filter(m => m.movement_type === filter);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={28} color="var(--primary-blue)" /> Movimientos de Inventario
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['todos', 'cargo', 'descargo'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '6px 16px', fontSize: '13px', textTransform: 'capitalize' }}
            >
              {f === 'todos' ? 'Todos' : f === 'cargo' ? '↑ Cargos' : '↓ Descargos'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando movimientos...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay movimientos registrados aún.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>Fecha / Hora</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Tipo</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>Origen</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Cantidad</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>Nota</th>
                <th style={{ padding: '14px 16px', textAlign: 'left' }}>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const isCargo = m.movement_type === 'cargo';
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(m.created_at)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        background: isCargo ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                        color: isCargo ? 'var(--success-green)' : '#ef4444',
                      }}>
                        {isCargo
                          ? <><ArrowUpCircle size={12} /> Cargo</>
                          : <><ArrowDownCircle size={12} /> Descargo</>}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 7px', borderRadius: '8px', marginRight: '8px',
                        background: m.source_type === 'bobina' ? 'rgba(0,112,243,0.15)' : 'rgba(139,92,246,0.15)',
                        color: m.source_type === 'bobina' ? 'var(--primary-blue)' : '#a78bfa',
                        fontWeight: 600,
                      }}>
                        {m.source_type === 'bobina' ? 'Bobina' : 'Ítem'}
                      </span>
                      {m.source_name}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px',
                      color: isCargo ? 'var(--success-green)' : '#ef4444' }}>
                      {isCargo ? '+' : '-'}{m.quantity % 1 === 0 ? m.quantity : m.quantity.toFixed(2)} {m.unit}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontStyle: m.note ? 'normal' : 'italic' }}>
                      {m.note || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {m.username || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
