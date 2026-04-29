import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

const API_URL = "/api/v1/projects";

export default function CalendarPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/dashboard`);
        // Solo traemos proyectos que tengan una fecha y no estén cancelados ni completados
        const activeProjects = res.data.projects.filter(p => p.installation_date && p.status !== 'Cancelado' && p.status !== 'Completado');
        setProjects(activeProjects);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  // Agrupar por fecha
  const groupedProjects = projects.reduce((acc, curr) => {
    const date = curr.installation_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {});

  // Ordenar fechas de la más próxima a la más lejana
  const sortedDates = Object.keys(groupedProjects).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={28} color="var(--primary-blue)" /> Agenda de Instalaciones
        </h1>
      </div>

      <div style={{ padding: '16px', background: 'rgba(0,112,243,0.1)', border: '1px solid rgba(0,112,243,0.3)', borderRadius: '8px', marginBottom: '24px', color: 'var(--text-light)', fontSize: '14px' }}>
        Aquí se visualizan los proyectos que tienen asignada una <strong>Fecha de Instalación Proyectada</strong> y se encuentran en estado Cotizado o Aprobado.
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando agenda...</div>
      ) : sortedDates.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CalendarIcon size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <h3>No hay instalaciones programadas</h3>
          <p style={{ marginTop: '8px' }}>Edita la fecha de instalación desde los detalles de un proyecto para que aparezca aquí.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sortedDates.map(date => {
            const dateObj = new Date(date + 'T12:00:00'); // Evadir zona horaria offset
            const isPast = dateObj < new Date(new Date().setHours(0,0,0,0));
            
            return (
              <div key={date} className="glass-card" style={{ padding: '0', overflow: 'hidden', borderLeft: isPast ? '4px solid #ef4444' : '4px solid var(--accent-cyan)' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <Clock size={20} color={isPast ? '#ef4444' : 'var(--accent-cyan)'} />
                  <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {isPast && <span style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', textTransform: 'uppercase' }}>Atrasado</span>}
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', padding: '20px' }}>
                  {groupedProjects[date].map(p => (
                    <Link key={p.id} to={`/projects/${p.id}`} style={{ display: 'block', textDecoration: 'none', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                      <div style={{ color: 'var(--primary-blue)', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>PRJ #{p.id}</div>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cliente: {p.client_name}</div>
                      <div style={{ color: 'var(--text-light)', fontSize: '13px', marginTop: '8px', display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{p.status}</div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
