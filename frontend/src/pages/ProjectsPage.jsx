import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Briefcase, Search as SearchIcon, Trash2 } from 'lucide-react';

const API_URL = "/api/v1/projects";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/dashboard`);
      setProjects(res.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar el proyecto? Todo el historial desaparecerá para siempre.")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        loadProjects();
      } catch (err) {
        alert("Error al eliminar (Verifica permisos)");
      }
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.client_name.toLowerCase().includes(search.toLowerCase()) ||
    p.client_ci_rif.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={28} color="var(--primary-blue)" /> Historial de Proyectos
        </h1>
        <Link to="/projects/new" className="btn-primary" style={{ textDecoration: 'none' }}>+ Nuevo Proyecto</Link>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <SearchIcon size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Buscar por Nombre de Proyecto, Cliente o RIF/Cédula..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', marginLeft: '12px', fontSize: '15px', outline: 'none' }}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando proyectos...</div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron proyectos.</div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px' }}>ID</th>
                <th style={{ padding: '16px' }}>Nombre Proyecto</th>
                <th style={{ padding: '16px' }}>Cliente</th>
                <th style={{ padding: '16px' }}>C.I / R.I.F</th>
                <th style={{ padding: '16px' }}>Área (m²)</th>
                <th style={{ padding: '16px' }}>Estado</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>#{p.id}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold' }}>{p.name}</td>
                  <td style={{ padding: '16px' }}>{p.client_name}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{p.client_ci_rif}</td>
                  <td style={{ padding: '16px' }}>{p.total_area} m²</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      background: p.status === 'Completado' ? 'rgba(16,185,129,0.2)' : (p.status === 'Cancelado' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,112,243,0.2)'), 
                      color: p.status === 'Completado' ? 'var(--success-green)' : (p.status === 'Cancelado' ? '#ef4444' : 'var(--primary-blue)'),
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'inline-block', minWidth: '80px', textAlign: 'center'
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link to={`/projects/${p.id}`} className="btn-outline" style={{ padding: '6px 16px', fontSize: '12px', textDecoration: 'none' }}>Entrar</Link>
                      <button onClick={() => handleDelete(p.id)} className="btn-outline" style={{ padding: '6px 12px', color: '#fca5a5', borderColor: 'transparent', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
