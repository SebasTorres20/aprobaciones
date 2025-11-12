// URL base del backend (ajústala si usas otro puerto)
const API = 'http://localhost:4000/api';

// Utilidad: obtener JSON y manejar errores
async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const t = await res.json().catch(() => ({ error: 'unknown' }));
    throw new Error(t.error || res.statusText);
  }
  return res.json();
}

// Cargar usuarios y tipos en los selectores
async function loadMeta() {
  const users = await fetchJSON(API + '/users');
  const types = await fetchJSON(API + '/types');

  const requester = document.getElementById('requester');
  const approver = document.getElementById('approver');
  const inboxUser = document.getElementById('inboxUser');
  const decisionUser = document.getElementById('decisionUser');

  [requester, approver, inboxUser, decisionUser].forEach(sel => {
    sel.innerHTML = users
      .map(u => `<option value="${u.username}">${u.display_name} (${u.username})</option>`)
      .join('');
  });

  document.getElementById('type').innerHTML = types
    .map(t => `<option value="${t.id}">${t.name}</option>`)
    .join('');
}

// Crear una nueva solicitud
document.getElementById('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    requester: document.getElementById('requester').value,
    approver: document.getElementById('approver').value,
    type_id: parseInt(document.getElementById('type').value)
  };

  try {
    const res = await fetchJSON(API + '/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    document.getElementById('createMsg').innerText = 'Solicitud creada con ID: ' + res.id;
    document.getElementById('createForm').reset();
  } catch (err) {
    document.getElementById('createMsg').innerText = 'Error: ' + err.message;
  }
});

// Refrescar bandeja
document.getElementById('refreshInbox').addEventListener('click', loadInbox);

async function loadInbox() {
  const approver = document.getElementById('inboxUser').value;
  const list = document.getElementById('requestsList');
  list.innerHTML = 'Cargando...';
  try {
    const reqs = await fetchJSON(API + `/requests?approver=${encodeURIComponent(approver)}&status=PENDIENTE`);
    if (reqs.length === 0) {
      list.innerHTML = '<li>No hay solicitudes pendientes</li>';
    } else {
      list.innerHTML = reqs
        .map(r => `<li data-id="${r.id}"><strong>${r.title}</strong> — ${r.type_name || ''} — ${new Date(r.created_at).toLocaleString()} — Solicitante: ${r.requester_name}</li>`)
        .join('');
      document.querySelectorAll('#requestsList li').forEach(li =>
        li.addEventListener('click', () => openDetail(li.dataset.id))
      );
    }
  } catch (err) {
    list.innerHTML = 'Error cargando bandeja: ' + err.message;
  }
}

// Ver detalle e historial
async function openDetail(id) {
  const sec = document.getElementById('detail');
  sec.hidden = false;
  const container = document.getElementById('detailBox');
  const histBox = document.getElementById('historyBox');
  container.innerHTML = 'Cargando...';
  histBox.innerHTML = '';

  try {
    const data = await fetchJSON(API + '/requests/' + id);
    const r = data.request;
    container.innerHTML = `
      <p><strong>${r.title}</strong></p>
      <p>${r.description || ''}</p>
      <p>Solicitante: ${r.requester} — Responsable: ${r.approver}</p>
      <p>Tipo: ${r.type_name || ''}</p>
      <p>Estado: ${r.status}</p>
      <p>ID: ${r.id}</p>
    `;

    histBox.innerHTML = '<h4>Histórico</h4>' +
      (data.history.length
        ? data.history.map(h =>
          `<div><strong>${h.status}</strong> por ${h.changed_by} - ${new Date(h.changed_at).toLocaleString()}<div>${h.comment || ''}</div></div>`
        ).join('')
        : '<div>Sin historial</div>');

    document.getElementById('approveBtn').onclick = () => takeDecision(id, 'approve');
    document.getElementById('rejectBtn').onclick = () => takeDecision(id, 'reject');
  } catch (err) {
    container.innerText = 'Error cargando detalle: ' + err.message;
  }
}

document.getElementById('closeDetail').addEventListener('click', () => {
  document.getElementById('detail').hidden = true;
});

// Aprobar o rechazar
async function takeDecision(id, action) {
  const user = document.getElementById('decisionUser').value;
  const comment = document.getElementById('decisionComment').value;

  try {
    await fetchJSON(API + `/requests/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, user, comment })
    });
    alert('Decisión registrada');
    loadInbox();
    openDetail(id);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Carga inicial
loadMeta().then(() => loadInbox());
