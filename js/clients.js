let clients = [];
let selectedClientId = null;
let historyFilter = 'all';

function renderClientsTable() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const filtered = clients.filter(c =>
    c.orgName.toLowerCase().includes(search) ||
    (c.contactName || '').toLowerCase().includes(search) ||
    (c.orgPhones || '').toLowerCase().includes(search) ||
    (c.orgCity || '').toLowerCase().includes(search)
  );
  const wrap = document.getElementById('tableWrap');
  if (!wrap) return;
  if (filtered.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><p>${clients.length === 0 ? 'Список клиентов пуст' : 'Ничего не найдено'}</p></div>`;
    return;
  }
  let html = `<table><thead><tr><th>ID</th><th>Организация</th><th>Город</th><th>Контакт</th><th>Телефон</th></tr></thead><tbody>`;
  filtered.forEach(c => {
    const phones = (c.orgPhones || '').split(',').map(p => p.trim()).filter(Boolean);
    html += `<tr onclick="selectClient(${c.id})" class="${selectedClientId === c.id ? 'selected' : ''}">
      <td style="color:#9ca3af;font-size:11px">#${c.id}</td>
      <td><strong>${escapeHtml(c.orgName)}</strong></td>
      <td>${escapeHtml(c.orgCity || '—')}</td>
      <td>${escapeHtml(c.contactName || '—')}</td>
      <td>${phones.length ? escapeHtml(phones[0]) : '—'}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function selectClient(id) {
  selectedClientId = id;
  historyFilter = 'all';
  renderClientsTable();
  renderClientDetail(id);
}

function renderClientDetail(id) {
  const client = clients.find(c => c.id === id);
  if (!client) return;
  const panel = document.getElementById('clientDetailPanel');
  if (!panel) return;
  const clientContacts = client.contacts || [];
  const history = client.history || [];
  const phones = (client.orgPhones || '').split(',').map(p => p.trim()).filter(Boolean);
  const emails = (client.orgEmails || '').split(',').map(e => e.trim()).filter(Boolean);
  const filteredHistory = historyFilter === 'all' ? history : history.filter(h => h.contactPerson === historyFilter);
  const sortedHistory = [...filteredHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  let html = `
    <div class="client-detail active">
      <div class="detail-header">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h2>${escapeHtml(client.orgName)}</h2>
            <div class="meta">ID: ${client.id} | ${escapeHtml(client.orgCity || '—')} | ${escapeHtml(client.orgDirection || '—')}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-sm btn-secondary" onclick="openTaskModal(null, ${client.id}, null, true)">Задача</button>
            <button class="btn btn-sm btn-secondary" onclick="openReminderModal(null, ${client.id})">Напоминание</button>
          </div>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-header"><h3>Информация об организации</h3>
          <button class="btn btn-sm btn-secondary" onclick="openClientModal(clients.find(c=>c.id===${client.id}))">Редактировать</button>
        </div>
        <div class="info-grid">
          <div class="info-item"><label>Адрес</label><value>${escapeHtml(client.orgAddress || '—')}</value></div>
          <div class="info-item"><label>Направление</label><value>${escapeHtml(client.orgDirection || '—')}</value></div>
          <div class="info-item"><label>Телефоны</label><value>${phones.length ? phones.map(escapeHtml).join(', ') : '—'}</value></div>
          <div class="info-item"><label>Email</label><value>${emails.length ? emails.map(escapeHtml).join(', ') : '—'}</value></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-header">
          <h3>Контактные лица (${clientContacts.length})</h3>
          <button class="btn btn-sm" onclick="openContactModal(${client.id})">Добавить</button>
        </div>
        ${clientContacts.length === 0 ? '<p style="color:#9ca3af;font-size:12px;padding:10px 0">Нет контактных лиц</p>' : `
        <div class="scrollable-table">
          <div class="table-header"><table><thead><tr><th>ФИО</th><th>Должность</th><th>Рабочий тел.</th><th>Сотовый</th><th>Email</th><th style="width:80px"></th></tr></thead></table></div>
          <div class="table-body"><table><tbody>
            ${clientContacts.map((ct, idx) => `<tr>
              <td><strong>${escapeHtml(ct.name || '—')}</strong></td>
              <td>${escapeHtml(ct.position || '—')}</td>
              <td>${escapeHtml(ct.phoneWork || '—')}</td>
              <td>${escapeHtml(ct.phoneMobile || '—')}</td>
              <td>${escapeHtml(ct.email || '—')}</td>
              <td style="display:flex;gap:4px;">
                <button class="btn btn-sm btn-secondary btn-icon" onclick="editClientContact(${client.id}, ${idx})">Редактировать</button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="deleteContact(${client.id}, ${idx})">×</button>
              </td>
            </tr>`).join('')}
          </tbody></table></div>
        </div>`}
      </div>
      <div class="detail-section">
        <div class="section-header">
          <h3>История взаимодействий (${sortedHistory.length})</h3>
          <button class="btn btn-sm" onclick="openHistoryModal(${client.id})">Добавить</button>
        </div>
        <div class="filter-bar">
          <label style="font-size:12px;color:#6b7280">Фильтр:</label>
          <select onchange="changeHistoryFilter(this.value)">
            <option value="all" ${historyFilter === 'all' ? 'selected' : ''}>Все контакты</option>
            ${clientContacts.map(ct => `<option value="${escapeHtml(ct.name)}" ${historyFilter === ct.name ? 'selected' : ''}>${escapeHtml(ct.name)}</option>`).join('')}
          </select>
        </div>
        ${sortedHistory.length === 0 ? '<p style="color:#9ca3af;font-size:12px;padding:10px 0">Нет записей</p>' : `
        <div class="scrollable-table history-table">
          <div class="table-header"><table><thead><tr><th style="width:120px">Дата</th><th style="width:130px">Тип</th><th style="width:150px">Контакт</th><th>Комментарий</th></tr></thead></table></div>
          <div class="table-body"><table><tbody>
            ${sortedHistory.map(h => `<tr>
              <td>${formatDate(h.date)}</td>
              <td><span class="badge">${escapeHtml(h.type)}</span></td>
              <td>${escapeHtml(h.contactPerson || '—')}</td>
              <td><div class="history-comment">${escapeHtml(h.comment)}</div></td>
            </tr>`).join('')}
          </tbody></table></div>
        </div>`}
      </div>
    </div>`;
  panel.innerHTML = html;
}

function changeHistoryFilter(value) { historyFilter = value; renderClientDetail(selectedClientId); }

function openClientModal(client = null) {
  document.getElementById('clientModalTitle').textContent = client ? 'Редактировать клиента' : 'Новый клиент';
  document.getElementById('clientId').value = client?.id || '';
  document.getElementById('orgName').value = client?.orgName || '';
  document.getElementById('orgCity').value = client?.orgCity || '';
  document.getElementById('orgDirection').value = client?.orgDirection || '';
  document.getElementById('orgAddress').value = client?.orgAddress || '';
  document.getElementById('orgPhones').value = client?.orgPhones || '';
  document.getElementById('orgEmails').value = client?.orgEmails || '';
  document.getElementById('contactName').value = client?.contactName || '';
  document.getElementById('contactPosition').value = client?.contactPosition || '';
  document.getElementById('contactPhoneWork').value = client?.contactPhoneWork || '';
  document.getElementById('contactPhoneMobile').value = client?.contactPhoneMobile || '';
  document.getElementById('contactEmail').value = client?.contactEmail || '';
  document.getElementById('clientModal').classList.add('active');
}

function saveClient(e) {
  e.preventDefault();
  const id = document.getElementById('clientId').value;
  const data = {
    orgName: document.getElementById('orgName').value.trim(),
    orgCity: document.getElementById('orgCity').value.trim(),
    orgDirection: document.getElementById('orgDirection').value.trim(),
    orgAddress: document.getElementById('orgAddress').value.trim(),
    orgPhones: document.getElementById('orgPhones').value.trim(),
    orgEmails: document.getElementById('orgEmails').value.trim(),
    contactName: document.getElementById('contactName').value.trim(),
    contactPosition: document.getElementById('contactPosition').value.trim(),
    contactPhoneWork: document.getElementById('contactPhoneWork').value.trim(),
    contactPhoneMobile: document.getElementById('contactPhoneMobile').value.trim(),
    contactEmail: document.getElementById('contactEmail').value.trim(),
  };
  if (id) {
    const idx = clients.findIndex(c => c.id === parseInt(id));
    if (idx !== -1) {
      data.id = clients[idx].id; data.contacts = clients[idx].contacts || []; data.history = clients[idx].history || [];
      clients[idx] = data;
    }
  } else {
    const maxId = clients.reduce((m, c) => Math.max(m, c.id || 0), 0);
    data.id = maxId + 1; data.contacts = []; data.history = [];
    clients.push(data);
  }
  saveClients(clients);
  closeModal('clientModal');
  renderClientsTable();
  if (selectedClientId) renderClientDetail(selectedClientId);
}

function openContactModal(clientId) {
  document.getElementById('contactClientId').value = clientId;
  document.getElementById('contactModalTitle').textContent = 'Добавить контактное лицо';
  document.getElementById('editContactIdx').value = '';
  document.getElementById('newContactName').value = '';
  document.getElementById('newContactPosition').value = '';
  document.getElementById('newContactPhoneWork').value = '';
  document.getElementById('newContactPhoneMobile').value = '';
  document.getElementById('newContactEmail').value = '';
  document.getElementById('contactModal').classList.add('active');
}

function editClientContact(clientId, idx) {
  const client = clients.find(c => c.id === clientId);
  if (!client || !client.contacts[idx]) return;
  const ct = client.contacts[idx];
  document.getElementById('contactClientId').value = clientId;
  document.getElementById('contactModalTitle').textContent = 'Редактировать контактное лицо';
  document.getElementById('editContactIdx').value = idx;
  document.getElementById('newContactName').value = ct.name || '';
  document.getElementById('newContactPosition').value = ct.position || '';
  document.getElementById('newContactPhoneWork').value = ct.phoneWork || '';
  document.getElementById('newContactPhoneMobile').value = ct.phoneMobile || '';
  document.getElementById('newContactEmail').value = ct.email || '';
  document.getElementById('contactModal').classList.add('active');
}

function saveContact(e) {
  e.preventDefault();
  const clientId = parseInt(document.getElementById('contactClientId').value);
  const editIdx = document.getElementById('editContactIdx').value;
  const client = clients.find(c => c.id === clientId);
  if (!client) return;
  if (!client.contacts) client.contacts = [];
  const contactData = {
    name: document.getElementById('newContactName').value.trim(),
    position: document.getElementById('newContactPosition').value.trim(),
    phoneWork: document.getElementById('newContactPhoneWork').value.trim(),
    phoneMobile: document.getElementById('newContactPhoneMobile').value.trim(),
    email: document.getElementById('newContactEmail').value.trim()
  };
  if (editIdx !== '') client.contacts[parseInt(editIdx)] = contactData;
  else client.contacts.push(contactData);
  saveClients(clients);
  closeModal('contactModal');
  renderClientDetail(clientId);
}

function deleteContact(clientId, idx) {
  if (!confirm('Удалить контактное лицо?')) return;
  const client = clients.find(c => c.id === clientId);
  client.contacts.splice(idx, 1);
  saveClients(clients);
  renderClientDetail(clientId);
}

function openHistoryModal(clientId) {
  document.getElementById('historyClientId').value = clientId;
  const client = clients.find(c => c.id === clientId);
  const select = document.getElementById('historyContactPerson');
  select.innerHTML = '<option value="">—</option>';
  if (client && client.contacts) {
    client.contacts.forEach(ct => {
      const opt = document.createElement('option');
      opt.value = ct.name; opt.textContent = ct.name || '—';
      select.appendChild(opt);
    });
  }
  document.getElementById('historyModal').classList.add('active');
}

function saveHistory(e) {
  e.preventDefault();
  const clientId = parseInt(document.getElementById('historyClientId').value);
  const client = clients.find(c => c.id === clientId);
  if (!client) return;
  if (!client.history) client.history = [];
  client.history.push({
    date: new Date().toISOString(),
    type: document.getElementById('historyType').value,
    contactPerson: document.getElementById('historyContactPerson').value,
    comment: document.getElementById('historyComment').value.trim()
  });
  saveClients(clients);
  closeModal('historyModal');
  renderClientDetail(clientId);
  e.target.reset();
}

function closeModal(id) { const modal = document.getElementById(id); if (modal) modal.classList.remove('active'); }
function formatDate(isoString) { if (!isoString) return '—'; const d = new Date(isoString); return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
function escapeHtml(s) { if (!s) return ''; return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function openTaskModalWithClient(clientId) {
  document.getElementById('taskModalTitle').textContent = 'Новая задача';
  document.getElementById('taskId').value = '';
  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDescription').value = '';
  document.getElementById('taskDeadline').value = '';
  document.getElementById('taskClientId').value = clientId;
  document.getElementById('taskClientSelect').value = clientId;
  onTaskClientChange();
  
  const prioritySelect = document.getElementById('taskPriority');
  prioritySelect.innerHTML = TASK_PRIORITIES.map(p => `<option value="${p.value}">${p.name}</option>`).join('');
  const columnSelect = document.getElementById('taskColumn');
  const sortedCols = [...taskColumns].sort((a, b) => a.order - b.order);
  columnSelect.innerHTML = sortedCols.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  
  document.getElementById('taskAssignMe').checked = false;
  document.getElementById('taskAssignees').innerHTML = contacts.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.department || '—')})</option>`).join('');
  document.getElementById('taskClientRow').style.display = 'none';
  document.getElementById('taskModal').classList.add('active');
}