import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Box, DollarSign, FileDown, Plus, Trash2, Camera, Upload } from 'lucide-react';
import { generateAndSavePDF } from '../utils/pdfUtils';

const API_URL = "/api/v1";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [consumptionBreakdown, setConsumptionBreakdown] = useState([]);
  const [areas, setAreas] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('resumen');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  
  const [newArea, setNewArea] = useState({ name: '', width: '', height: '' });
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', expense_type: 'Variable' });
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState("");
  const [isEditingRollWidth, setIsEditingRollWidth] = useState(false);
  const [tempRollWidth, setTempRollWidth] = useState("");
  const [isEditingBaseCost, setIsEditingBaseCost] = useState(false);
  const [tempBaseCost, setTempBaseCost] = useState("");
  const [isEditingLaborCost, setIsEditingLaborCost] = useState(false);
  const [tempLaborCost, setTempLaborCost] = useState("");
  const [isEditingInstDate, setIsEditingInstDate] = useState(false);
  const [tempInstDate, setTempInstDate] = useState("");
  const [pdfStates, setPdfStates] = useState({
    cotizacion: { generating: false, feedback: null },
    nota_entrega: { generating: false, feedback: null },
  });

  const setPdfState = (type, updates) => {
    setPdfStates(prev => ({ ...prev, [type]: { ...prev[type], ...updates } }));
  };

  const loadData = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/${id}`);
      setProject(res.data.project);
      setTempPrice(res.data.project.price_per_ml.toString());
      setTempRollWidth(res.data.project.roll_width.toString());
      setTempBaseCost(res.data.project.base_cost_per_ml.toString());
      setTempLaborCost(res.data.project.labor_cost_per_sqm.toString());
      setTempInstDate(res.data.project.installation_date || "");
      setAreas(res.data.areas);
      setExpenses(res.data.expenses);
      setPhotos(res.data.photos || []);
      setConsumptionBreakdown(res.data.consumption_breakdown || []);
      setMetrics(res.data.metrics);
    } catch {
      setProject({ id, name: "Proyecto Demo", client_name: "Cliente X", status: "Cotizado", price_per_ml: 200, roll_width: 1.5 });
      setMetrics({ total_area_sqm: 10, total_material_sqm: 15, waste_m2: 5, efficiency_percentage: 66, linear_meters: 10, net_profit: 1500, total_expenses: 500, total_income: 2000 });
      setConsumptionBreakdown([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddArea = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/projects/${id}/areas`, {
        name: newArea.name,
        width: parseFloat(newArea.width),
        height: parseFloat(newArea.height)
      });
      setNewArea({ name: '', width: '', height: '' });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteArea = async (areaId) => {
    if (window.confirm("¿Seguro que deseas eliminar esta área?")) {
      try {
        await axios.delete(`${API_URL}/projects/${id}/areas/${areaId}`);
        loadData();
      } catch (err) {
        console.error(err);
        alert("Error al eliminar el área.");
      }
    }
  };

  const handleAdvanceStatus = async (newStatus) => {
    let payload = { status: newStatus };
    if (newStatus === 'Aprobado') {
      const dateStr = window.prompt("Ingresa la fecha de pago o aprobación (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
      if (!dateStr) return;
      payload.approved_date = dateStr;
    }
    if (newStatus === 'Completado') {
      const dateStr = window.prompt("Ingresa la fecha de finalización física (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
      if (!dateStr) return;
      payload.completed_date = dateStr;
    }

    try {
      await axios.put(`${API_URL}/projects/${id}/status`, payload);
      setProject({ ...project, status: newStatus, ...payload });
      loadData();
    } catch (err) { console.error("Error updating status:", err); }
  };

  const renderStatusActions = () => {
    switch (project.status) {
      case 'Prospecto':
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleAdvanceStatus('Cotizado')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Avanzar a Cotizado</button>
            <button onClick={() => handleAdvanceStatus('Cancelado')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: '#fca5a5', borderColor: '#fca5a5' }}>Cancelar</button>
          </div>
        );
      case 'Cotizado':
        return (
           <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleAdvanceStatus('Aprobado')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success-green)', borderColor: 'var(--success-green)' }}>Aprobar Proyecto</button>
            <button onClick={() => handleAdvanceStatus('Cancelado')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: '#fca5a5', borderColor: '#fca5a5' }}>Cancelar</button>
          </div>
        );
      case 'Aprobado':
        return <button onClick={() => handleAdvanceStatus('En Ejecución')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Iniciar Ejecución</button>;
      case 'En Ejecución':
        return <button onClick={() => handleAdvanceStatus('Completado')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success-green)', borderColor: 'var(--success-green)' }}>Finalizar Obra</button>;
      case 'Completado':
        return <span style={{ color: 'var(--success-green)', fontSize: '14px', fontWeight: 'bold' }}>✓ Obra finalizada</span>;
      case 'Cancelado':
        return <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>🚫 Proyecto Cancelado</span>;
      default:
        return null;
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/projects/${id}/expenses`, {
        ...newExpense, amount: parseFloat(newExpense.amount)
      });
      setNewExpense({ description: '', amount: '', expense_type: 'Variable' });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleToggleExpense = async (expenseId) => {
    try {
      await axios.put(`${API_URL}/projects/${id}/expenses/${expenseId}/nullify`);
      loadData();
    } catch (err) { console.error("Error toggling expense", err); }
  };

  const handleUpdatePrice = async () => {
    try {
      await axios.put(`${API_URL}/projects/${id}/price`, { price_per_ml: parseFloat(tempPrice) });
      setIsEditingPrice(false);
      loadData();
    } catch (err) { console.error("Error updating price", err); }
  };

  const handleUpdateRollWidth = async () => {
    try {
      await axios.put(`${API_URL}/projects/${id}/roll_width`, { roll_width: parseFloat(tempRollWidth) });
      setIsEditingRollWidth(false);
      loadData();
    } catch (err) { console.error("Error updating roll width", err); }
  };

  const handleUpdateBaseCost = async () => {
    try {
      await axios.put(`${API_URL}/projects/${id}/base_cost`, { base_cost_per_ml: parseFloat(tempBaseCost) });
      setIsEditingBaseCost(false);
      loadData();
    } catch (err) { console.error("Error updating base cost", err); }
  };

  const handleUpdateLaborCost = async () => {
    try {
      await axios.put(`${API_URL}/projects/${id}/labor_cost`, { labor_cost_per_sqm: parseFloat(tempLaborCost) });
      setIsEditingLaborCost(false);
      loadData();
    } catch (err) { console.error("Error updating labor cost", err); }
  };

  const handleUpdateInstDate = async () => {
    try {
      await axios.put(`${API_URL}/projects/${id}/installation_date`, { installation_date: tempInstDate || null });
      setIsEditingInstDate(false);
      loadData();
    } catch (err) { console.error("Error updating installation date", err); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingPhoto(true);
    try {
      await axios.post(`${API_URL}/projects/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || "Error al subir foto.";
      alert(msg);
      console.error(err);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const generateQuotePDF = async () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; background: white;">
        <div style="text-align: center; border-bottom: 2px solid #0070f3; padding-bottom: 20px; margin-bottom: 30px;">
          <img src="/logo.png" style="max-height: 60px; margin-bottom: 10px;" crossorigin="anonymous" />
          <p style="margin:0; color:#777;">Innovación en Vidrios Inteligentes</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h2>COTIZACIÓN</h2>
            <p><strong>Cliente:</strong> ${project.client_name}</p>
            <p><strong>Teléfono:</strong> ${project.client_phone || 'N/A'}</p>
            <p><strong>Dirección:</strong> ${project.address || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>ID Proyecto:</strong> #${project.id}</p>
            <p><strong>Metros Totales:</strong> ${metrics.total_area_sqm} m²</p>
            <p><strong>Estado:</strong> ${project.status}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr style="background: #f4f4f4;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Concepto</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Instalación SmartFilm (${metrics.linear_meters} ml x Precio $${project.price_per_ml})</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 18px;"><strong>$${metrics.total_income}</strong></td>
          </tr>
        </table>
        <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>Smart Film Valencia</p>
          <p>Los precios expresados están sujetos a cambio sin previo aviso.</p>
        </div>
      </div>
    `;

    await generateAndSavePDF({
      element,
      filename: `Cotizacion_${project.client_name}`,
      docType: 'cotizacion',
      projectId: project.id,
      projectName: project.name,
      clientName: project.client_name,
      onStart: () => setPdfState('cotizacion', { generating: true, feedback: null }),
      onSuccess: (result) => {
        setPdfState('cotizacion', { generating: false, feedback: { type: 'success', msg: `✅ Guardado: ${result.filename}` } });
        setTimeout(() => setPdfState('cotizacion', { feedback: null }), 5000);
      },
      onError: (msg) => setPdfState('cotizacion', { generating: false, feedback: { type: 'error', msg: `❌ ${msg}` } }),
    });
  };

  const generateDeliveryNote = async () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; background: white;">
        <div style="text-align: center; border-bottom: 2px solid #0070f3; padding-bottom: 20px; margin-bottom: 30px;">
          <img src="/logo.png" style="max-height: 60px; margin-bottom: 10px;" crossorigin="anonymous" />
          <p style="margin:0; color:#777;">Innovación en Vidrios Inteligentes</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h2>NOTA DE ENTREGA</h2>
            <p><strong>Cliente:</strong> ${project.client_name}</p>
            <p><strong>Teléfono:</strong> ${project.client_phone || 'N/A'}</p>
            <p><strong>Dirección:</strong> ${project.address || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>ID Proyecto:</strong> #${project.id}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr style="background: #f4f4f4;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Concepto</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Instalación SmartFilm (${metrics.linear_meters} ml x $${project.price_per_ml})</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 18px;"><strong>$${metrics.total_income}</strong></td>
          </tr>
        </table>
        <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
          <h3 style="margin-top:0; color: #0070f3;">CERTIFICADO DE CONFORMIDAD</h3>
          <p style="line-height: 1.5; font-size: 14px;">Las áreas acordadas han sido revestidas con la tecnología Smart Film y probadas operativamente de forma satisfactoria.</p>
          <p style="line-height: 1.5; font-size: 14px; margin-top: 15px;"><strong>Términos de Garantía:</strong></p>
          <ul style="font-size: 14px;">
            <li>Se otorga una garantía de <strong>3 meses</strong> por defectos de fábrica comprobables.</li>
            <li>Esta garantía NO cubre daños por picos de voltaje, humedad o químicos abrasivos.</li>
            <li>Toda manipulación del cableado por personal externo anulará la garantía.</li>
          </ul>
        </div>
        <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>Smart Film Valencia</p>
        </div>
      </div>
    `;

    await generateAndSavePDF({
      element,
      filename: `NotaEntrega_${project.client_name}`,
      docType: 'nota_entrega',
      projectId: project.id,
      projectName: project.name,
      clientName: project.client_name,
      onStart: () => setPdfState('nota_entrega', { generating: true, feedback: null }),
      onSuccess: (result) => {
        setPdfState('nota_entrega', { generating: false, feedback: { type: 'success', msg: `✅ Guardado: ${result.filename}` } });
        setTimeout(() => setPdfState('nota_entrega', { feedback: null }), 5000);
      },
      onError: (msg) => setPdfState('nota_entrega', { generating: false, feedback: { type: 'error', msg: `❌ ${msg}` } }),
    });
  };


  if (!project) return <div style={{ padding: '40px' }}>Cargando...</div>;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ArrowLeft size={20} /></button>
        <div>
          <h1 style={{ fontSize: '28px' }}>{project.name}</h1>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>Cliente: {project.client_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Estado: <strong style={{ color: 'white', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{project.status}</strong></span>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '16px' }}>
               {renderStatusActions()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        {['resumen', 'áreas', 'gastos', 'fotos', 'documentos'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'var(--primary-blue)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-muted)',
              border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Resumen Tab */}
      {activeTab === 'resumen' && metrics && (
        <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-blue)' }}>Resumen Financiero</h3>
            <p style={{ marginBottom: '8px' }}>Área Total: <strong>{metrics.total_area_sqm} m²</strong></p>
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Precio por metro lineal:</span>
              {isEditingPrice ? (
                <>
                  <input 
                    type="number" 
                    value={tempPrice} 
                    onChange={e => setTempPrice(e.target.value)}
                    style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '4px 8px', width: '80px', outline: 'none' }}
                  />
                  <button onClick={handleUpdatePrice} style={{ background: 'var(--success-green)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Guardar</button>
                  <button onClick={() => { setIsEditingPrice(false); setTempPrice(project.price_per_ml.toString()); }} style={{ background: 'transparent', color: '#fca5a5', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>X</button>
                </>
              ) : (
                <>
                  <strong>${project.price_per_ml}</strong>
                  <button onClick={() => setIsEditingPrice(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Editar</button>
                </>
              )}
            </div>
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Ancho Bobina:</span>
              {isEditingRollWidth ? (
                <>
                  <input 
                    type="number" step="0.1" 
                    value={tempRollWidth} 
                    onChange={e => setTempRollWidth(e.target.value)}
                    style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '4px 8px', width: '80px', outline: 'none' }}
                  />
                  <button onClick={handleUpdateRollWidth} style={{ background: 'var(--success-green)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Guardar</button>
                  <button onClick={() => { setIsEditingRollWidth(false); setTempRollWidth(project.roll_width.toString()); }} style={{ background: 'transparent', color: '#fca5a5', border: '1px solid #fca5a5', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>X</button>
                </>
              ) : (
                <>
                  <strong>{project.roll_width}m</strong>
                  <button onClick={() => setIsEditingRollWidth(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Editar</button>
                </>
              )}
            </div>
            
            <p style={{ marginBottom: '16px' }}>Metros Lineales (Real): <strong style={{color: 'var(--accent-cyan)'}}>{metrics.linear_meters} ml</strong></p>
            
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />
            <h4 style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>Desglose Contable</h4>
            <p style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Ingreso Bruto (Venta):</span>
              <strong>${metrics.total_income}</strong>
            </p>
            <p style={{ marginBottom: '8px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Costo de Material:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditingBaseCost ? (
                  <span style={{ display: 'flex', gap: '4px' }}>
                    <input 
                      type="number" step="0.1" 
                      value={tempBaseCost} 
                      onChange={e => setTempBaseCost(e.target.value)}
                      style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '2px 4px', width: '60px', outline: 'none', fontSize: '13px' }}
                    />
                    <button onClick={handleUpdateBaseCost} style={{ background: 'var(--success-green)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px' }}>OK</button>
                    <button onClick={() => { setIsEditingBaseCost(false); setTempBaseCost(project.base_cost_per_ml.toString()); }} style={{ background: 'transparent', color: '#fca5a5', border: '1px solid #fca5a5', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer', fontSize: '11px' }}>X</button>
                  </span>
                ) : (
                  <span>
                    (${project.base_cost_per_ml}/ml) <button onClick={() => setIsEditingBaseCost(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}>Editar</button>
                  </span>
                )}
                <span>${metrics.material_cost}</span>
              </span>
            </p>
            <p style={{ marginBottom: '8px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Costo de Personal (Instalación):</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditingLaborCost ? (
                  <span style={{ display: 'flex', gap: '4px' }}>
                    <input 
                      type="number" step="0.1" 
                      value={tempLaborCost} 
                      onChange={e => setTempLaborCost(e.target.value)}
                      style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '2px 4px', width: '60px', outline: 'none', fontSize: '13px' }}
                    />
                    <button onClick={handleUpdateLaborCost} style={{ background: 'var(--success-green)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px' }}>OK</button>
                    <button onClick={() => { setIsEditingLaborCost(false); setTempLaborCost(project.labor_cost_per_sqm.toString()); }} style={{ background: 'transparent', color: '#fca5a5', border: '1px solid #fca5a5', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer', fontSize: '11px' }}>X</button>
                  </span>
                ) : (
                  <span>
                    (${project.labor_cost_per_sqm}/m²) <button onClick={() => setIsEditingLaborCost(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}>Editar</button>
                  </span>
                )}
                <span>${metrics.labor_cost}</span>
              </span>
            </p>
            <p style={{ marginBottom: '8px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Otros Gastos (Variables):</span>
              <span>${metrics.variable_expenses}</span>
            </p>
            <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', marginTop: '8px' }}>
              <p style={{ display: 'flex', justifyContent: 'space-between', color: '#ff7b7b' }}>
                <span>Egresos Totales:</span>
                <strong>${metrics.total_expenses}</strong>
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-green)', padding: '32px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ color: 'var(--success-green)', marginBottom: '12px', fontSize: '24px' }}>Ganancia Neta</h3>
            <h1 style={{ fontSize: '56px', color: 'var(--success-green)', margin: 0 }}>${metrics.net_profit}</h1>
          </div>
        </div>
      )}

      {/* Areas Tab */}
      {activeTab === 'áreas' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          <form onSubmit={handleAddArea} className="glass-card">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Box size={20} /> Registrar Área</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Identificador (Opcional)</label>
              <input type="text" value={newArea.name} onChange={e => setNewArea({...newArea, name: e.target.value})} placeholder="Ej. Cristalera Frontal" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Ancho Total (m)</label>
              <input type="number" step="0.01" required value={newArea.width} onChange={e => setNewArea({...newArea, width: e.target.value})} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Alto Total (m)</label>
              <input type="number" step="0.01" required value={newArea.height} onChange={e => setNewArea({...newArea, height: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>+ Añadir</button>
          </form>
          
          <div className="glass-card">
            <h3 style={{ marginBottom: '16px' }}>Áreas Instaladas</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px' }}>Identificador</th>
                  <th style={{ padding: '12px' }}>Ancho</th>
                  <th style={{ padding: '12px' }}>Alto</th>
                  <th style={{ padding: '12px' }}>Área m²</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a, i) => (
                  <tr key={a.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{a.name || '-'}</td>
                    <td style={{ padding: '12px' }}>{a.width}m</td>
                    <td style={{ padding: '12px' }}>{a.height}m</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{(a.width * a.height).toFixed(2)} m²</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteArea(a.id)}
                        className="btn-outline" 
                        style={{ padding: '4px', color: '#fca5a5', borderColor: 'transparent', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Renderizar Breakdown de Materiales y Diagrama de Corte si hay areas */}
      {activeTab === 'áreas' && consumptionBreakdown.length > 0 && (
        <div className="glass-card animate-fade-in" style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Diagrama Operativo de Corte</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            El sistema ha calculado el acomodo óptimo (packing) para el rollo de {project.roll_width}m de ancho intentando minimizar el desperdicio. Las láminas más anchas han sido particionadas.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {consumptionBreakdown.map((row, index) => (
               <div key={index} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                     <h4 style={{ color: 'var(--accent-cyan)' }}>Fila {index + 1}</h4>
                     <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>M. Lineales a Cortar (Altura de Fila): <strong style={{color: 'white'}}>{row.max_height} m</strong></span>
                  </div>
                  
                  {/* Visualización del Rollo */}
                  <div style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden', display: 'flex' }}>
                     {row.pieces.map((piece, pIndex) => {
                        const widthPercentage = (piece.width / project.roll_width) * 100;
                        return (
                           <div key={pIndex} style={{ width: `${widthPercentage}%`, height: '100%', borderRight: '1px solid rgba(255,255,255,0.2)', background: 'rgba(14, 165, 233, 0.2)', position: 'relative' }}>
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '11px', textAlign: 'center', padding: '4px' }}>
                                 <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{piece.original_area_name}</strong>
                                 <span style={{ opacity: 0.8 }}>{piece.width}m x {piece.height}m</span>
                              </div>
                           </div>
                        );
                     })}
                     {/* Espacio vacío / Desperdicio */}
                     {row.current_width < project.roll_width && (
                       <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '11px', color: '#fca5a5' }}>Libre: {(project.roll_width - row.current_width).toFixed(2)}m</span>
                       </div>
                     )}
                  </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Gastos Tab */}
      {activeTab === 'gastos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          <form onSubmit={handleAddExpense} className="glass-card">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={20} /> Registrar Gasto</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Descripción</label>
              <input type="text" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Monto ($)</label>
              <input type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>+ Guardar Gasto</button>
          </form>

          <div className="glass-card">
            <h3 style={{ marginBottom: '16px' }}>Historial de Gastos Extra</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px' }}>Descripción</th>
                  <th style={{ padding: '12px' }}>Monto ($)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={e.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: e.is_nullified ? 0.5 : 1 }}>
                    <td style={{ padding: '12px' }}>
                      {e.is_nullified ? <s>{e.description} (Anulado)</s> : e.description}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: e.is_nullified ? 'var(--text-muted)' : '#fca5a5' }}>
                      {e.is_nullified ? <s>-${e.amount}</s> : `-$${e.amount}`}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleToggleExpense(e.id)} 
                        className="btn-outline" 
                        style={{ padding: '4px 8px', fontSize: '11px', color: e.is_nullified ? 'var(--success-green)' : '#fca5a5', borderColor: 'transparent' }}
                      >
                        {e.is_nullified ? 'Restaurar' : 'Anular'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fotos Tab */}
      {activeTab === 'fotos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Camera size={20} /> Galería del Proyecto</h3>
            <div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <button 
                className="btn-primary" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadingPhoto}
              >
                <Upload size={16} style={{ marginRight: '8px' }} /> 
                {uploadingPhoto ? 'Subiendo...' : 'Subir Foto'}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {(!photos || photos.length === 0) ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No hay fotos subidas para este proyecto.
              </div>
            ) : (
              photos.map((p, i) => {
                const url = `/${p.file_path.replace(/\\/g, '/')}`;
                return (
                  <div key={p.id || i} className="glass-card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.5)' }}>
                      <img src={url} alt={`Proyecto ${project?.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Docs Tab */}
      {activeTab === 'documentos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

          {/* Cotización Formal */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <FileDown size={48} color="var(--primary-blue)" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Cotización Formal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Documento con los cálculos de costo según los m² registrados. Se guarda en la carpeta del proyecto.</p>
            {pdfStates.cotizacion.feedback && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                background: pdfStates.cotizacion.feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: pdfStates.cotizacion.feedback.type === 'success' ? 'var(--success-green)' : '#ef4444',
                border: `1px solid ${pdfStates.cotizacion.feedback.type === 'success' ? 'var(--success-green)' : '#ef4444'}`,
                width: '100%', textAlign: 'left'
              }}>{pdfStates.cotizacion.feedback.msg}</div>
            )}
            <button
              onClick={generateQuotePDF}
              disabled={pdfStates.cotizacion.generating}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <FileDown size={16} style={{ marginRight: '8px' }} />
              {pdfStates.cotizacion.generating ? 'Generando...' : 'Generar Cotización'}
            </button>
          </div>

          {/* Nota de Entrega */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            opacity: (project.status === 'Prospecto' || project.status === 'Cotizado') ? 0.5 : 1
          }}>
            <FileDown size={48} color="var(--accent-cyan)" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Nota de Entrega</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Documento de cierre de obra con políticas de garantía y conformidad. Se guarda en la carpeta del proyecto.</p>
            {pdfStates.nota_entrega.feedback && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                background: pdfStates.nota_entrega.feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: pdfStates.nota_entrega.feedback.type === 'success' ? 'var(--success-green)' : '#ef4444',
                border: `1px solid ${pdfStates.nota_entrega.feedback.type === 'success' ? 'var(--success-green)' : '#ef4444'}`,
                width: '100%', textAlign: 'left'
              }}>{pdfStates.nota_entrega.feedback.msg}</div>
            )}
            {(project.status === 'Prospecto' || project.status === 'Cotizado' || project.status === 'Cancelado') ? (
              <button disabled className="btn-outline" style={{ width: '100%', justifyContent: 'center', cursor: 'not-allowed', color: 'gray', borderColor: 'gray' }}>
                Bloqueado (Requiere Aprobación)
              </button>
            ) : (
              <button
                onClick={generateDeliveryNote}
                disabled={pdfStates.nota_entrega.generating}
                className="btn-outline"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FileDown size={16} style={{ marginRight: '8px' }} />
                {pdfStates.nota_entrega.generating ? 'Generando...' : 'Generar Nota de Entrega'}
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
