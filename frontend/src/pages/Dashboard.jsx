import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, TrendingUp, Layers, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = "/api/v1";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({ active: 0, m2: 0, revenue: 0 });

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/dashboard`);
      setProjects(res.data.projects);
      setMetrics(res.data.metrics);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proyecto de manera permanente?")) {
      try {
        await axios.delete(`${API_URL}/projects/${id}`);
        fetchDashboardData();
      } catch (err) {
        console.error("Error deleting project", err);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Dashboard General</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas e información de proyectos Smart Film</p>
        </div>
        <Link to="/projects/new" className="btn-primary" style={{ textDecoration: 'none' }}>
          + Crear Proyecto
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(0, 112, 243, 0.2)', padding: '16px', borderRadius: '12px', color: 'var(--primary-blue)' }}>
            <FileText size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Proyectos Activos</p>
            <h2 style={{ fontSize: '28px' }}>{metrics.active}</h2>
          </div>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(34, 211, 238, 0.2)', padding: '16px', borderRadius: '12px', color: 'var(--accent-cyan)' }}>
            <Layers size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Total m² Histórico</p>
            <h2 style={{ fontSize: '28px' }}>{metrics.m2} <span style={{fontSize: '14px', color: 'var(--text-muted)'}}>m²</span></h2>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px', color: 'var(--success-green)' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Ingresos Brutos</p>
            <h2 style={{ fontSize: '28px' }}>${metrics.revenue.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px)', gap: '24px', justifyContent: 'center' }}>
        {/* Panel izquierdo */}
        <div className="glass-card" style={{ height: 'fit-content', width: '100%' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Rendimiento</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-muted)' }}>
            <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Completados</span>
              <strong style={{color: 'white'}}>{projects.filter(p => p.status === 'Completado').length}</strong>
            </li>
            <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>En Progreso</span>
              <strong style={{color: 'white'}}>{projects.filter(p => p.status === 'En Ejecución' || p.status === 'Aprobado').length}</strong>
            </li>
            <li style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span>En Cotización</span>
              <strong style={{color: 'white'}}>{projects.filter(p => p.status === 'Prospecto' || p.status === 'Cotizado').length}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
