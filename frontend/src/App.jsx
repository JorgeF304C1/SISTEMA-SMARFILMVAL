import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home, Settings as SettingsIcon, Plus, X, LogOut, Users, Search as SearchIcon, Calculator, Briefcase, FileDown, Shield, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import ProjectDetail from './pages/ProjectDetail';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import InventoryPage from './pages/InventoryPage';
import UsersPage from './pages/UsersPage';
import ProjectsPage from './pages/ProjectsPage';
import CalendarPage from './pages/CalendarPage';
import { Package, Calendar as CalendarIcon } from 'lucide-react';
import { generateAndSavePDF } from './utils/pdfUtils';

const API_URL = "http://localhost:8000/api/v1/system/network";

function App() {
  const [user, setUser] = useState(null);
  
  // Quick Quote state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteParams, setQuoteParams] = useState({ width: '', height: '', basePrice: 200 });
  const [basePriceLoading, setBasePriceLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState(null); // { type: 'success'|'error', msg }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const openQuoteModal = async () => {
    setQuoteModalOpen(true);
    setBasePriceLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/v1/settings");
      setQuoteParams(prev => ({...prev, basePrice: res.data.default_price_per_sqm}));
    } catch (err) {
      console.error("No se pudo cargar precio base");
    } finally {
      setBasePriceLoading(false);
    }
  };

  const handleDownloadQuote = async () => {
    const area = parseFloat(quoteParams.width || 0) * parseFloat(quoteParams.height || 0);
    const total = area * quoteParams.basePrice;
    
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; background: white;">
        <h1 style="color: #0070f3; margin-bottom: 5px;">Smart Film Valencia</h1>
        <p style="color: #666; margin-top: 0; font-size: 14px;">Cotización Express - Sin compromiso</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr style="background: #f4f4f4;">
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Descripción</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Área</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Total Estimado</th>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">
              Suministro e instalación de Vinilo Inteligente Smart Film.<br/>
              <span style="font-size: 12px; color: #666;">Precio Base aplicado: $${quoteParams.basePrice.toFixed(2)}/m²</span>
            </td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">
              <strong>${area.toFixed(2)} m²</strong><br/>
              <span style="font-size: 11px;">(${quoteParams.width}m x ${quoteParams.height}m)</span>
            </td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 18px;">
              <strong>$${total.toFixed(2)}</strong>
            </td>
          </tr>
        </table>
        
        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #999;">
          <p>Validez de la cotización: 15 días.</p>
          <p>Esta es una estimación rápida, el precio final podría variar tras la visita técnica.</p>
        </div>
      </div>
    `;

    setPdfFeedback(null);
    await generateAndSavePDF({
      element,
      filename: 'Cotizacion_Express_SmartFilm',
      docType: 'express',
      projectId: null,
      projectName: null,
      clientName: 'Express',
      onStart: () => setPdfGenerating(true),
      onSuccess: (result) => {
        setPdfGenerating(false);
        setPdfFeedback({ type: 'success', msg: `✅ Guardado: ${result.filename}` });
        setTimeout(() => setPdfFeedback(null), 4000);
      },
      onError: (msg) => {
        setPdfGenerating(false);
        setPdfFeedback({ type: 'error', msg: `❌ ${msg}` });
      },
    });
  };


  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Sidebar */}
      <nav style={{ 
        width: '260px', background: 'rgba(15, 23, 42, 0.9)', 
        borderRight: '1px solid rgba(255,255,255,0.1)', padding: '24px',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <img src="/logo.png" alt="SmartFilm Valencia" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link to="/" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', border: 'none', justifyContent: 'flex-start' }}>
            <Home size={20} /> Dashboard
          </Link>
          <Link to="/calendar" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', border: 'none', justifyContent: 'flex-start' }}>
             <CalendarIcon size={20} /> Agenda Instalaciones
          </Link>
          <Link to="/projects/list" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', border: 'none', justifyContent: 'flex-start' }}>
             <Briefcase size={20} /> Historial Proyectos
          </Link>
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
          
          <Link to="/projects/new" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', border: 'none', justifyContent: 'flex-start' }}>
            <Plus size={20} /> Nuevo Proyecto
          </Link>
          <button onClick={openQuoteModal} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', border: 'none', textAlign: 'left', color: 'var(--accent-cyan)' }}>
            <Calculator size={20} /> Cotizador Express
          </button>
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
          
          {user.role === 'Admin' && (
            <>
              <Link to="/inventory" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', border: 'none', justifyContent: 'flex-start' }}>
                <Package size={20} /> Bodega e Inventario
              </Link>
              <Link to="/users" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', border: 'none', justifyContent: 'flex-start' }}>
                <Shield size={20} /> Control de Usuarios
              </Link>
              <Link to="/settings" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', border: 'none', justifyContent: 'flex-start' }}>
                <SettingsIcon size={20} /> Configuración
              </Link>
            </>
          )}
          
          <button onClick={handleLogout} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', borderColor: 'transparent', textAlign: 'left', marginTop: '4px' }}>
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/projects/list" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Quote Modal */}
      {quoteModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-card animate-fade-in" style={{ padding: '32px', width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calculator size={24} color="var(--accent-cyan)" /> Cotizador Express</h2>
              <button onClick={() => { setQuoteModalOpen(false); setQuoteParams({width:'', height:'', basePrice: quoteParams.basePrice})}} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>Cotiza rápidamente sin registrar nada en la base de datos.</p>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Ancho (m)</label>
                <input type="number" step="0.01" value={quoteParams.width} onChange={e => setQuoteParams({...quoteParams, width: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Alto (m)</label>
                <input type="number" step="0.01" value={quoteParams.height} onChange={e => setQuoteParams({...quoteParams, height: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
               <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Precio Base ($/m²)</label>
               <input type="number" step="0.1" value={quoteParams.basePrice} onChange={e => setQuoteParams({...quoteParams, basePrice: parseFloat(e.target.value)})} disabled={basePriceLoading} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
            
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-green)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--success-green)', marginBottom: '4px', fontSize: '14px' }}>Costo Estimado</h4>
              <h1 style={{ fontSize: '36px', color: 'white', marginBottom: '8px' }}>
                ${ (parseFloat(quoteParams.width || 0) * parseFloat(quoteParams.height || 0) * quoteParams.basePrice).toFixed(2) }
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Total Área: {(parseFloat(quoteParams.width || 0) * parseFloat(quoteParams.height || 0)).toFixed(2)} m²</p>
            </div>
            
            {pdfFeedback && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                background: pdfFeedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: pdfFeedback.type === 'success' ? 'var(--success-green)' : '#ef4444',
                border: `1px solid ${pdfFeedback.type === 'success' ? 'var(--success-green)' : '#ef4444'}`,
              }}>
                {pdfFeedback.msg}
              </div>
            )}
            <button
              onClick={handleDownloadQuote}
              disabled={pdfGenerating}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
            >
              <FileDown size={16} style={{ marginRight: '8px' }} />
              {pdfGenerating ? 'Generando...' : 'Generar Cotización Express'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
