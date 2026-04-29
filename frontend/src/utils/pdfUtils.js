/**
 * pdfUtils.js
 * Utilidades centralizadas para generar y guardar PDFs.
 * 
 * Flujo:
 * 1. El frontend genera el PDF con html2pdf.js → obtiene un Blob
 * 2. El Blob se convierte a base64 y se envía al backend
 * 3. El backend lo guarda en la carpeta correcta dentro de local_storage/documentos/
 * 4. El backend abre el explorador de Windows mostrando el archivo generado
 */

const API_URL = "/api/v1";

/**
 * Convierte un Blob a string base64.
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // El resultado es "data:application/pdf;base64,XXXXX..."
      // Necesitamos solo la parte después de la coma
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Genera un PDF desde un elemento HTML y lo guarda en el servidor.
 *
 * @param {Object} options
 * @param {HTMLElement} options.element - Elemento HTML fuente del PDF
 * @param {string} options.filename - Nombre de archivo sugerido (sin extensión)
 * @param {'express'|'cotizacion'|'nota_entrega'} options.docType - Tipo de documento
 * @param {number|null} options.projectId - ID del proyecto (null para express)
 * @param {string|null} options.projectName - Nombre del proyecto
 * @param {string} options.clientName - Nombre del cliente
 * @param {Function} options.onStart - Callback al iniciar
 * @param {Function} options.onSuccess - Callback al éxito con { filename, folder_path }
 * @param {Function} options.onError - Callback al error con mensaje
 */
export async function generateAndSavePDF({
  element,
  filename,
  docType,
  projectId = null,
  projectName = null,
  clientName = "Cliente",
  onStart,
  onSuccess,
  onError,
}) {
  try {
    if (onStart) onStart();

    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generar el PDF como Blob
    const blob = await html2pdf().set(opt).from(element).output('blob');

    // Convertir a base64
    const pdf_base64 = await blobToBase64(blob);

    // Enviar al backend para guardar en carpeta
    const response = await fetch(`${API_URL}/documents/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doc_type: docType,
        pdf_base64,
        project_id: projectId,
        project_name: projectName,
        client_name: clientName,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Error al guardar el documento');
    }

    const result = await response.json();

    // Pedir al backend que abra la carpeta en el explorador de Windows
    await fetch(`${API_URL}/documents/open-folder-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_path: result.folder_path }),
    });

    if (onSuccess) onSuccess(result);

  } catch (err) {
    if (onError) onError(err.message || 'Error desconocido al generar el PDF');
    console.error('[generateAndSavePDF]', err);
  }
}
