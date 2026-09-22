import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Box, DollarSign, FileDown, Plus, Trash2, Camera, Upload, Scissors, TrendingDown, Pencil, Check, X } from 'lucide-react';
import { generateAndSavePDF } from '../utils/pdfUtils';

const API_URL = "/api/v1";

export default function ProjectDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'Admin';
  const [project, setProject] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [consumptionBreakdown, setConsumptionBreakdown] = useState([]);
  const [areas, setAreas] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('resumen');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  
  const [newArea, setNewArea] = useState({ name: '', width: '', height: '', quantity: 1 });
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', expense_type: 'Variable', category: '', quantity: 1 });
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [tempClient, setTempClient] = useState("");
  const [pdfStates, setPdfStates] = useState({
    cotizacion: { generating: false, feedback: null },
    nota_entrega: { generating: false, feedback: null },
    cortes: { generating: false, feedback: null },
    desperdicio: { generating: false, feedback: null },
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
        height: parseFloat(newArea.height),
        quantity: parseInt(newArea.quantity) || 1
      });
      setNewArea({ name: '', width: '', height: '', quantity: 1 });
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al añadir el área");
      console.error(err);
    }
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
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        quantity: newExpense.expense_type === 'Recargo' ? (parseInt(newExpense.quantity) || 1) : 1,
      });
      setNewExpense({ description: '', amount: '', expense_type: 'Variable', category: '', quantity: 1 });
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
    const width = parseFloat(tempRollWidth);
    if (!(width > 0)) {
      alert("El ancho de bobina debe ser un número mayor a 0 (ej. 1.54).");
      return;
    }
    try {
      await axios.put(`${API_URL}/projects/${id}/roll_width`, { roll_width: width });
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

  const handleUpdateName = async () => {
    const name = tempName.trim();
    if (!name) { setIsEditingName(false); return; }
    try {
      await axios.put(`${API_URL}/projects/${id}/details`, { name });
      setIsEditingName(false);
      loadData();
    } catch (err) { console.error("Error updating name", err); }
  };

  const handleUpdateClient = async () => {
    try {
      await axios.put(`${API_URL}/projects/${id}/details`, { client_name: tempClient.trim() });
      setIsEditingClient(false);
      loadData();
    } catch (err) { console.error("Error updating client", err); }
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
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Cant.</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">P. Unit.</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Instalación SmartFilm</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${metrics.linear_meters} ml</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${project.price_per_ml}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>$${metrics.base_income}</strong></td>
          </tr>
          ${expenses.filter(e => e.expense_type === 'Recargo' && !e.is_nullified).map(e => {
            const qty = e.quantity || 1;
            const total = (e.amount * qty).toFixed(2);
            return `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${e.description}${e.category ? ` <span style="color:#666;font-size:12px;">(${e.category})</span>` : ''}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color:#666;">${qty > 1 ? `×${qty}` : '—'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color:#666;">${qty > 1 ? `$${e.amount}` : '—'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>$${total}</strong></td>
          </tr>`;
          }).join('')}
          <tr style="background: #f0f7ff;">
            <td colspan="3" style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 15px;">TOTAL</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 20px; color: #0070f3;"><strong>$${metrics.total_income}</strong></td>
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
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Cant.</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">P. Unit.</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Instalación SmartFilm</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${metrics.linear_meters} ml</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${project.price_per_ml}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>$${metrics.base_income}</strong></td>
          </tr>
          ${expenses.filter(e => e.expense_type === 'Recargo' && !e.is_nullified).map(e => {
            const qty = e.quantity || 1;
            const total = (e.amount * qty).toFixed(2);
            return `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${e.description}${e.category ? ` <span style="color:#666;font-size:12px;">(${e.category})</span>` : ''}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color:#666;">${qty > 1 ? `×${qty}` : '—'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color:#666;">${qty > 1 ? `$${e.amount}` : '—'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;"><strong>$${total}</strong></td>
          </tr>`;
          }).join('')}
          <tr style="background: #f0f7ff;">
            <td colspan="3" style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 15px;">TOTAL</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 20px; color: #0070f3;"><strong>$${metrics.total_income}</strong></td>
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

  const generateCutDiagramPDF = async () => {
    const blockTag = `Proyecto: ${project.name} · #${project.id}`;
    const rowsHtml = consumptionBreakdown.map((row, index) => {
      const columnsHtml = (row.columns || []).map(col => {
        const colWidthPct = (col.width / project.roll_width) * 100;
        const leftoverH = row.max_height - col.used_height;
        const piecesStack = col.pieces.map(piece => {
          const hPct = (piece.height / row.max_height) * 100;
          return `<div style="height:${hPct}%;background:rgba(14,165,233,0.25);border-bottom:1px solid rgba(0,0,0,0.2);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;text-align:center;padding:1px;overflow:hidden;">
            <strong style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${piece.original_area_name}</strong>
            <span style="white-space:nowrap;">${piece.width}m × ${piece.height}m</span>
          </div>`;
        }).join('');
        const leftoverHtml = leftoverH > 0.001
          ? `<div style="height:${(leftoverH / row.max_height) * 100}%;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;font-size:9px;color:#cc0000;text-align:center;overflow:hidden;">Retazo ${col.width}×${leftoverH.toFixed(2)}m</div>`
          : '';
        return `<div style="width:${colWidthPct}%;height:100%;border-right:1px solid rgba(0,0,0,0.25);display:inline-block;vertical-align:top;">${piecesStack}${leftoverHtml}</div>`;
      }).join('');
      const freeWidth = project.roll_width - row.current_width;
      const freePct = (freeWidth / project.roll_width) * 100;
      const freeHtml = freeWidth > 0.001
        ? `<div style="width:${freePct}%;height:100%;background:rgba(239,68,68,0.15);display:inline-block;vertical-align:top;"><div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:#cc0000;">Libre: ${freeWidth.toFixed(3)}m</div></div>`
        : '';
      const separator = index > 0 ? '<div style="border-top:2px dashed #bbb;margin:0 0 16px;text-align:right;color:#bbb;font-size:11px;">✂ - - - - - - - - - - - - - - - - - - - - - - - - - -</div>' : '';
      return `${separator}
        <div style="page-break-inside:avoid;margin-bottom:28px;border:1px solid #ddd;border-radius:6px;padding:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <strong style="color:#0070f3;">Fila ${index + 1} de ${consumptionBreakdown.length}</strong>
            <span style="font-size:11px;color:#888;">${blockTag}</span>
          </div>
          <div style="font-size:12px;color:#666;margin-bottom:8px;">Metro Lineal a Cortar: <strong>${row.max_height} m</strong></div>
          <div style="width:100%;height:90px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;overflow:hidden;white-space:nowrap;">
            ${columnsHtml}${freeHtml}
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;">
            <tr style="background:#f4f4f4;"><th style="padding:6px;border:1px solid #ddd;">Pieza</th><th style="padding:6px;border:1px solid #ddd;">Ancho</th><th style="padding:6px;border:1px solid #ddd;">Alto</th><th style="padding:6px;border:1px solid #ddd;">m²</th></tr>
            ${row.pieces.map(p => `<tr><td style="padding:6px;border:1px solid #ddd;">${p.original_area_name}</td><td style="padding:6px;border:1px solid #ddd;">${p.width}m</td><td style="padding:6px;border:1px solid #ddd;">${p.height}m</td><td style="padding:6px;border:1px solid #ddd;">${(p.width * p.height).toFixed(3)} m²</td></tr>`).join('')}
          </table>
        </div>`;
    }).join('');

    const totalPieces = consumptionBreakdown.reduce((acc, r) => acc + r.pieces.length, 0);
    const areasTableHtml = areas.map(a => `<tr><td style="padding:8px;border:1px solid #ddd;">${a.name || '—'}</td><td style="padding:8px;border:1px solid #ddd;">${a.width}m</td><td style="padding:8px;border:1px solid #ddd;">${a.height}m</td><td style="padding:8px;border:1px solid #ddd;">${(a.width * a.height).toFixed(2)} m²</td></tr>`).join('');

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family:Arial,sans-serif;padding:32px;color:#333;background:white;">
        <div style="text-align:center;border-bottom:2px solid #0070f3;padding-bottom:16px;margin-bottom:24px;">
          <img src="/logo.png" style="max-height:50px;margin-bottom:8px;" crossorigin="anonymous" />
          <h1 style="color:#0070f3;margin:4px 0 0;">PLANO DE CORTES OPERATIVOS</h1>
          <p style="margin:4px 0;color:#666;font-size:13px;">${project.name} — Cliente: ${project.client_name}</p>
          <p style="margin:0;color:#999;font-size:12px;">Generado: ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="display:flex;gap:16px;margin-bottom:24px;">
          <div style="flex:1;background:#f0f7ff;border:1px solid #0070f3;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#0070f3;">${metrics.total_area_sqm} m²</div>
            <div style="font-size:12px;color:#666;">m² Instalados</div>
          </div>
          <div style="flex:1;background:#f0fff4;border:1px solid #10b981;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#10b981;">${metrics.linear_meters} ml</div>
            <div style="font-size:12px;color:#666;">Metros Lineales</div>
          </div>
          <div style="flex:1;background:#fff8f0;border:1px solid #f59e0b;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#f59e0b;">${metrics.efficiency_percentage}%</div>
            <div style="font-size:12px;color:#666;">Eficiencia</div>
          </div>
          <div style="flex:1;background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;">${consumptionBreakdown.length}</div>
            <div style="font-size:12px;color:#666;">Filas / Cortes</div>
          </div>
        </div>
        <h3 style="margin-bottom:8px;">Áreas del Proyecto (${areas.length} áreas, ${totalPieces} piezas)</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
          <tr style="background:#f4f4f4;"><th style="padding:8px;border:1px solid #ddd;">Identificador</th><th style="padding:8px;border:1px solid #ddd;">Ancho</th><th style="padding:8px;border:1px solid #ddd;">Alto</th><th style="padding:8px;border:1px solid #ddd;">Área m²</th></tr>
          ${areasTableHtml}
        </table>
        <div style="page-break-before:always;"></div>
        <h3 style="margin-bottom:16px;color:#0070f3;">Diagrama de Corte — Rollo ${project.roll_width}m de ancho</h3>
        ${rowsHtml}
        <div style="margin-top:32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:16px;">
          <p>Smart Film Valencia · Plano generado para uso operativo del instalador</p>
        </div>
      </div>
    `;

    await generateAndSavePDF({
      element,
      filename: `Cortes_${project.client_name}`,
      docType: 'cortes',
      projectId: project.id,
      projectName: project.name,
      clientName: project.client_name,
      pdfOptions: { pagebreak: { mode: ['avoid-all', 'css'] } },
      onStart: () => setPdfState('cortes', { generating: true, feedback: null }),
      onSuccess: (result) => {
        setPdfState('cortes', { generating: false, feedback: { type: 'success', msg: `✅ Guardado: ${result.filename}` } });
        setTimeout(() => setPdfState('cortes', { feedback: null }), 5000);
      },
      onError: (msg) => setPdfState('cortes', { generating: false, feedback: { type: 'error', msg: `❌ ${msg}` } }),
    });
  };

  const generateWasteReportPDF = async () => {
    const blockTag = `Proyecto: ${project.name} · #${project.id}`;
    let blockIndex = 0;
    const blocksHtml = consumptionBreakdown.map((row, r) => {
      const freeWidth = project.roll_width - row.current_width;

      const laminasHtml = row.pieces.map(p => {
        const pct = (p.width / project.roll_width) * 100;
        const separator = blockIndex++ > 0 ? '<div style="border-top:2px dashed #bbb;margin:0 0 16px;text-align:right;color:#bbb;font-size:11px;">✂ - - - - - - - - - - - - - - - - - - - - - - - - - -</div>' : '';
        return `${separator}
          <div style="page-break-inside:avoid;border:1px solid #ddd;border-radius:6px;padding:12px;margin-bottom:28px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <strong style="color:#0070f3;">LÁMINA — ${p.original_area_name} (Fila ${r + 1})</strong>
              <span style="font-size:11px;color:#888;">${blockTag}</span>
            </div>
            <div style="width:100%;height:70px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;overflow:hidden;white-space:nowrap;">
              <div style="width:${pct}%;height:100%;background:rgba(14,165,233,0.25);display:inline-block;vertical-align:top;position:relative;">
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;text-align:center;padding:2px;">
                  <strong>${p.original_area_name}</strong>
                  <span>${p.width}m × ${p.height}m</span>
                </div>
              </div>
            </div>
            <p style="margin:8px 0 0;font-size:13px;"><strong>Lámina:</strong> ${p.width}m × ${p.height}m = ${(p.width * p.height).toFixed(3)} m²</p>
          </div>`;
      }).join('');

      // Retazos reales de la fila: strip derecho + sobrante superior de cada columna apilada
      const scraps = [];
      if (freeWidth > 0.001) {
        scraps.push({ w: freeWidth, h: row.max_height });
      }
      (row.columns || []).forEach(col => {
        const leftoverH = row.max_height - col.used_height;
        if (leftoverH > 0.001) {
          scraps.push({ w: col.width, h: leftoverH });
        }
      });

      const renderScrap = (scrap) => {
        const sep = blockIndex++ > 0 ? '<div style="border-top:2px dashed #bbb;margin:0 0 16px;text-align:right;color:#bbb;font-size:11px;">✂ - - - - - - - - - - - - - - - - - - - - - - - - - -</div>' : '';
        const sobrPct = Math.min(100, (scrap.w / project.roll_width) * 100);
        const sqm = scrap.w * scrap.h;
        return `${sep}
          <div style="page-break-inside:avoid;border:1px solid #fca5a5;border-radius:6px;padding:12px;margin-bottom:28px;background:#fff8f8;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <strong style="color:#dc2626;">SOBRANTE — Fila ${r + 1}</strong>
              <span style="font-size:11px;color:#888;">${blockTag}</span>
            </div>
            <div style="width:100%;height:70px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;overflow:hidden;white-space:nowrap;">
              <div style="width:${sobrPct}%;height:100%;background:rgba(239,68,68,0.18);display:inline-block;vertical-align:top;position:relative;">
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#cc0000;text-align:center;">
                  ${scrap.w.toFixed(3)}m × ${scrap.h.toFixed(2)}m
                </div>
              </div>
            </div>
            <p style="margin:8px 0 0;font-size:13px;color:#dc2626;"><strong>Sobrante:</strong> ${scrap.w.toFixed(3)}m × ${scrap.h.toFixed(2)}m = ${sqm.toFixed(3)} m²</p>
          </div>`;
      };
      const sobranteHtml = scraps.map(renderScrap).join('');

      return laminasHtml + sobranteHtml;
    }).join('');

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family:Arial,sans-serif;padding:32px;color:#333;background:white;">
        <div style="text-align:center;border-bottom:2px solid #0070f3;padding-bottom:16px;margin-bottom:24px;">
          <img src="/logo.png" style="max-height:50px;margin-bottom:8px;" crossorigin="anonymous" />
          <h1 style="color:#0070f3;margin:4px 0 0;">REPORTE DE DESPERDICIO DE MATERIAL</h1>
          <p style="margin:4px 0;color:#666;font-size:13px;">${project.name} — Cliente: ${project.client_name}</p>
          <p style="margin:0;color:#999;font-size:12px;">Generado: ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="display:flex;gap:16px;margin-bottom:24px;">
          <div style="flex:1;background:#f0f7ff;border:1px solid #0070f3;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:bold;color:#0070f3;">${metrics.total_area_sqm} m²</div>
            <div style="font-size:12px;color:#666;">Material Instalado</div>
          </div>
          <div style="flex:1;background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:bold;">${metrics.total_material_sqm} m²</div>
            <div style="font-size:12px;color:#666;">Material Consumido</div>
          </div>
          <div style="flex:1;background:#fff0f0;border:2px solid #dc2626;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:bold;color:#dc2626;">${metrics.waste_m2} m²</div>
            <div style="font-size:12px;color:#666;">Total Desperdiciado</div>
          </div>
          <div style="flex:1;background:#f0fff4;border:1px solid #10b981;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:bold;color:#10b981;">${metrics.efficiency_percentage}%</div>
            <div style="font-size:12px;color:#666;">Eficiencia</div>
          </div>
        </div>

        <p style="font-size:13px;color:#555;background:#fffbeb;border:1px solid #f59e0b;padding:12px;border-radius:6px;margin-bottom:24px;">
          Este reporte detalla el desperdicio derivado del corte óptimo (bin-packing) del rollo de <strong>${project.roll_width}m de ancho</strong>.
          El material libre al final de cada fila no puede utilizarse sin generar cortes adicionales.
        </p>

        <h3 style="margin-bottom:16px;">Etiquetas de Corte — recortar por la línea punteada</h3>
        ${blocksHtml}
        <div style="border-top:1px solid #ddd;padding-top:12px;margin-top:8px;font-size:13px;font-weight:bold;color:#dc2626;text-align:right;">
          TOTAL DESPERDICIADO: ${metrics.waste_m2} m²
        </div>

        <div style="margin-top:32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:16px;">
          <p>Smart Film Valencia · Reporte generado automáticamente por el sistema de gestión</p>
        </div>
      </div>
    `;

    await generateAndSavePDF({
      element,
      filename: `Desperdicio_${project.client_name}`,
      docType: 'desperdicio',
      projectId: project.id,
      projectName: project.name,
      clientName: project.client_name,
      pdfOptions: { pagebreak: { mode: ['avoid-all', 'css'] } },
      onStart: () => setPdfState('desperdicio', { generating: true, feedback: null }),
      onSuccess: (result) => {
        setPdfState('desperdicio', { generating: false, feedback: { type: 'success', msg: `✅ Guardado: ${result.filename}` } });
        setTimeout(() => setPdfState('desperdicio', { feedback: null }), 5000);
      },
      onError: (msg) => setPdfState('desperdicio', { generating: false, feedback: { type: 'error', msg: `❌ ${msg}` } }),
    });
  };


  if (!project) return <div style={{ padding: '40px' }}>Cargando...</div>;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="btn-outline" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <input
                autoFocus type="text" value={tempName}
                onChange={e => setTempName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleUpdateName(); if (e.key === 'Escape') setIsEditingName(false); }}
                style={{ fontSize: '24px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', minWidth: '300px' }}
              />
              <button className="btn-outline" onClick={handleUpdateName} style={{ padding: '6px 10px', color: 'var(--success-green)', borderColor: 'transparent' }}><Check size={18} /></button>
              <button className="btn-outline" onClick={() => setIsEditingName(false)} style={{ padding: '6px 10px', color: '#fca5a5', borderColor: 'transparent' }}><X size={18} /></button>
            </div>
          ) : (
            <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {project.name}
              <button className="btn-outline" onClick={() => { setTempName(project.name); setIsEditingName(true); }} title="Editar nombre del proyecto" style={{ padding: '4px 8px', color: 'var(--text-muted)', borderColor: 'transparent' }}><Pencil size={16} /></button>
            </h1>
          )}
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isEditingClient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Cliente:</span>
                <input
                  autoFocus type="text" value={tempClient}
                  onChange={e => setTempClient(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateClient(); if (e.key === 'Escape') setIsEditingClient(false); }}
                  style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
                />
                <button className="btn-outline" onClick={handleUpdateClient} style={{ padding: '4px 8px', color: 'var(--success-green)', borderColor: 'transparent' }}><Check size={16} /></button>
                <button className="btn-outline" onClick={() => setIsEditingClient(false)} style={{ padding: '4px 8px', color: '#fca5a5', borderColor: 'transparent' }}><X size={16} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Cliente: {project.client_name}
                <button className="btn-outline" onClick={() => { setTempClient(project.client_name === 'Sin Cliente' ? '' : project.client_name); setIsEditingClient(true); }} title="Editar cliente" style={{ padding: '3px 6px', color: 'var(--text-muted)', borderColor: 'transparent' }}><Pencil size={14} /></button>
              </div>
            )}
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
        {['resumen', 'áreas', ...(isAdmin ? ['gastos'] : []), 'fotos', 'documentos'].map(tab => (
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
                    type="number" step="0.01" min="0.01"
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
            
            {isAdmin && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />
                <h4 style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>Desglose Contable</h4>
                <p style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Venta Base (ml × precio):</span>
                  <strong>${metrics.base_income}</strong>
                </p>
                {metrics.surcharges > 0 && (
                  <p style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', color: 'var(--accent-cyan)' }}>
                    <span>Recargos al Cliente:</span>
                    <strong>+${metrics.surcharges}</strong>
                  </p>
                )}
                <p style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                  <span>Total Cobrado al Cliente:</span>
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
              </>
            )}
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success-green)', padding: '32px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {isAdmin ? (
              <>
                <h3 style={{ color: 'var(--success-green)', marginBottom: '12px', fontSize: '24px' }}>Ganancia Neta</h3>
                <h1 style={{ fontSize: '56px', color: 'var(--success-green)', margin: 0 }}>${metrics.net_profit}</h1>
              </>
            ) : (
              <>
                <h3 style={{ color: 'var(--success-green)', marginBottom: '12px', fontSize: '24px' }}>Total</h3>
                <h1 style={{ fontSize: '56px', color: 'var(--success-green)', margin: 0 }}>${metrics.total_income}</h1>
              </>
            )}
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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Cantidad de Paneles</label>
              <input type="number" min="1" step="1" value={newArea.quantity} onChange={e => setNewArea({...newArea, quantity: parseInt(e.target.value) || 1})} />
              {newArea.quantity > 1 && (
                <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent-cyan)' }}>
                  Se crearán {newArea.quantity} paneles idénticos de {newArea.width || '?'}m × {newArea.height || '?'}m
                </p>
              )}
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
                  
                  {/* Visualización del Rollo: columnas con piezas apiladas */}
                  <div style={{ width: '100%', height: '110px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden', display: 'flex' }}>
                     {(row.columns || []).map((col, cIndex) => {
                        const colWidthPct = (col.width / project.roll_width) * 100;
                        const leftoverH = row.max_height - col.used_height;
                        return (
                           <div key={cIndex} style={{ width: `${colWidthPct}%`, height: '100%', borderRight: '1px solid rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column' }}>
                              {col.pieces.map((piece, pIndex) => {
                                 const hPct = (piece.height / row.max_height) * 100;
                                 return (
                                    <div key={pIndex} style={{ height: `${hPct}%`, background: 'rgba(14, 165, 233, 0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center', padding: '2px', overflow: 'hidden' }}>
                                       <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{piece.original_area_name}</strong>
                                       <span style={{ opacity: 0.8, whiteSpace: 'nowrap' }}>{piece.width}m x {piece.height}m</span>
                                    </div>
                                 );
                              })}
                              {leftoverH > 0.001 && (
                                 <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fca5a5', textAlign: 'center', overflow: 'hidden' }}>
                                    Retazo: {col.width}×{leftoverH.toFixed(2)}m
                                 </div>
                              )}
                           </div>
                        );
                     })}
                     {/* Espacio vacío / Desperdicio */}
                     {row.current_width < project.roll_width - 0.001 && (
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Tipo de Gasto</label>
              <select value={newExpense.expense_type} onChange={e => setNewExpense({...newExpense, expense_type: e.target.value, quantity: 1})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', appearance: 'none' }}>
                <option value="Variable">Variable (saca de ganancia)</option>
                <option value="Recargo">Recargo (cobrar al cliente)</option>
              </select>
              <p style={{ marginTop: '6px', fontSize: '11px', color: newExpense.expense_type === 'Recargo' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                {newExpense.expense_type === 'Recargo' ? '↑ Se suma al total cobrado en la cotización' : '↓ Baja tu ganancia neta'}
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Descripción</label>
              <input type="text" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="Ej. Andamio, Viáticos, Gasolina" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Categoría <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(opcional)</span></label>
              <input type="text" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} placeholder="Ej. Estructura, Materiales, Transporte" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Monto ($) {newExpense.expense_type === 'Recargo' && <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(precio unitario)</span>}</label>
              <input type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
            </div>
            {newExpense.expense_type === 'Recargo' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Cantidad</label>
                <input type="number" min="1" step="1" value={newExpense.quantity} onChange={e => setNewExpense({...newExpense, quantity: parseInt(e.target.value) || 1})} />
                {newExpense.amount && newExpense.quantity > 1 && (
                  <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent-cyan)' }}>
                    Total: ${(parseFloat(newExpense.amount) * newExpense.quantity).toFixed(2)}
                  </p>
                )}
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>+ Guardar Gasto</button>
          </form>

          <div className="glass-card">
            <h3 style={{ marginBottom: '16px' }}>Historial de Gastos</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px' }}>Descripción</th>
                  <th style={{ padding: '12px' }}>Tipo</th>
                  <th style={{ padding: '12px' }}>Monto ($)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={e.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: e.is_nullified ? 0.5 : 1 }}>
                    <td style={{ padding: '12px' }}>
                      {e.is_nullified ? <s>{e.description} (Anulado)</s> : e.description}
                      {(e.quantity || 1) > 1 && !e.is_nullified && <span style={{ display: 'block', fontSize: '11px', color: 'var(--accent-cyan)' }}>×{e.quantity} unidades</span>}
                      {e.category && !e.is_nullified && <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{e.category}</span>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        background: e.expense_type === 'Recargo' ? 'rgba(34,211,238,0.15)' : 'rgba(239,68,68,0.1)',
                        color: e.expense_type === 'Recargo' ? 'var(--accent-cyan)' : '#fca5a5',
                      }}>
                        {e.expense_type === 'Recargo' ? '↑ Recargo' : '↓ Variable'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: e.is_nullified ? 'var(--text-muted)' : (e.expense_type === 'Recargo' ? 'var(--accent-cyan)' : '#fca5a5') }}>
                      {(() => {
                        const qty = e.quantity || 1;
                        const total = (e.amount * qty).toFixed(2);
                        const sign = e.expense_type === 'Recargo' ? '+' : '-';
                        const display = qty > 1 ? `${sign}$${total} ($${e.amount}×${qty})` : `${sign}$${e.amount}`;
                        return e.is_nullified ? <s>{display}</s> : display;
                      })()}
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

          {/* Plano de Cortes */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            opacity: consumptionBreakdown.length === 0 ? 0.5 : 1
          }}>
            <Scissors size={48} color="var(--accent-cyan)" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Plano de Cortes</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Diagrama operativo para el instalador con dimensiones exactas de cada pieza y su posición en el rollo. Multi-página.</p>
            {pdfStates.cortes.feedback && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                background: pdfStates.cortes.feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: pdfStates.cortes.feedback.type === 'success' ? 'var(--success-green)' : '#ef4444',
                border: `1px solid ${pdfStates.cortes.feedback.type === 'success' ? 'var(--success-green)' : '#ef4444'}`,
                width: '100%', textAlign: 'left'
              }}>{pdfStates.cortes.feedback.msg}</div>
            )}
            {consumptionBreakdown.length === 0 ? (
              <button disabled className="btn-outline" style={{ width: '100%', justifyContent: 'center', cursor: 'not-allowed', color: 'gray', borderColor: 'gray' }}>
                Agrega áreas primero
              </button>
            ) : (
              <button
                onClick={generateCutDiagramPDF}
                disabled={pdfStates.cortes.generating}
                className="btn-outline"
                style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
              >
                <Scissors size={16} style={{ marginRight: '8px' }} />
                {pdfStates.cortes.generating ? 'Generando...' : 'Generar Plano de Cortes'}
              </button>
            )}
          </div>

          {/* Reporte de Desperdicio */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            opacity: consumptionBreakdown.length === 0 ? 0.5 : 1
          }}>
            <TrendingDown size={48} color="#fca5a5" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>Reporte de Desperdicio</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Análisis de eficiencia y m² sobrantes del rollo por fila de corte. Útil para auditoría de consumo de material.</p>
            {pdfStates.desperdicio.feedback && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                background: pdfStates.desperdicio.feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: pdfStates.desperdicio.feedback.type === 'success' ? 'var(--success-green)' : '#ef4444',
                border: `1px solid ${pdfStates.desperdicio.feedback.type === 'success' ? 'var(--success-green)' : '#ef4444'}`,
                width: '100%', textAlign: 'left'
              }}>{pdfStates.desperdicio.feedback.msg}</div>
            )}
            {consumptionBreakdown.length === 0 ? (
              <button disabled className="btn-outline" style={{ width: '100%', justifyContent: 'center', cursor: 'not-allowed', color: 'gray', borderColor: 'gray' }}>
                Agrega áreas primero
              </button>
            ) : (
              <button
                onClick={generateWasteReportPDF}
                disabled={pdfStates.desperdicio.generating}
                className="btn-outline"
                style={{ width: '100%', justifyContent: 'center', borderColor: '#fca5a5', color: '#fca5a5' }}
              >
                <TrendingDown size={16} style={{ marginRight: '8px' }} />
                {pdfStates.desperdicio.generating ? 'Generando...' : 'Generar Reporte de Desperdicio'}
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
