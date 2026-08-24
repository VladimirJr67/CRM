let contacts = [];
let currentContactsSubsection = 'internal';

// Инициализация контактов из localStorage при загрузке модуля
(function initContactsModule() {
  const stored = localStorage.getItem('alvid_crm_contacts');
  if (stored) {
    try {
      contacts = JSON.parse(stored);
    } catch(e) {
      contacts = [];
    }
  }
})();

function escapeHtml(s) { if (!s) return ''; return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }

// Глобальные переменные для раздела контактов
let contactsSplitPosition = 50; // процент высоты верхней панели
let isDragging = false;
let selectedClientId = null;

function renderContacts() {
  const main = document.getElementById('mainContent');
  
  main.innerHTML = `
    <div class="contacts-split-container" style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <!-- Верхняя панель - список компаний -->
      <div class="contacts-top-panel" id="contactsTopPanel" style="height:${contactsSplitPosition}%;overflow:hidden;display:flex;flex-direction:column;border-bottom:2px solid #e5e7eb;">
        <div class="panel-header" style="padding:15px 20px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
          <h2 style="font-size:18px;font-weight:600;color:#1a3a5c;">Компании</h2>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-sm btn-secondary" onclick="exportClientsToCSV()">Экспорт CSV</button>
            <button class="btn btn-sm btn-secondary" onclick="document.getElementById('importClientsFile').click()">Импорт CSV</button>
            <input type="file" id="importClientsFile" style="display:none" accept=".csv" onchange="importClientsFromCSV(event)">
            <button class="btn btn-sm" onclick="openClientModal()">Добавить компанию</button>
          </div>
        </div>
        <input type="text" class="search-bar" id="clientsSearch" placeholder="Поиск по компаниям..." oninput="renderClientsList()" style="margin:10px 20px;width:calc(100% - 40px);">
        <div class="clients-list-container" id="clientsListContainer" style="flex:1;overflow-y:auto;padding:0 20px;"></div>
      </div>
      
      <!-- Разделитель -->
      <div class="contacts-resizer" id="contactsResizer" style="height:6px;cursor:ns-resize;background:#e5e7eb;display:flex;align-items:center;justify-content:center;flex-shrink:0;" onmousedown="startContactsResize(event)">
        <div style="width:40px;height:3px;background:#9ca3af;border-radius:2px;"></div>
      </div>
      
      <!-- Нижняя панель - контакты и история -->
      <div class="contacts-bottom-panel" id="contactsBottomPanel" style="height:${100 - contactsSplitPosition}%;overflow:hidden;display:flex;flex-direction:column;">
        <div class="panel-header" style="padding:15px 20px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
          <h2 style="font-size:18px;font-weight:600;color:#1a3a5c;">Контакты и история</h2>
          <button class="btn btn-sm" id="addContactBtn" onclick="openContactModal(selectedClientId)" style="display:none;">Добавить контакт</button>
        </div>
        <div class="client-detail-container" id="clientDetailContainer" style="flex:1;overflow-y:auto;padding:20px;">
          <div class="empty-state" style="padding:60px 20px;"><p>Выберите компанию для просмотра контактов</p></div>
        </div>
      </div>
    </div>`;
  
  renderClientsList();
  setupContactsResize();
}

function renderClientsList() {
  const search = (document.getElementById('clientsSearch')?.value || '').toLowerCase();
  const filtered = clients.filter(c =>
    (c.orgName || '').toLowerCase().includes(search) ||
    (c.contactName || '').toLowerCase().includes(search) ||
    (c.orgCity || '').toLowerCase().includes(search) ||
    (c.orgPhones || '').toLowerCase().includes(search)
  );
  
  const container = document.getElementById('clientsListContainer');
  if (!container) return;
  
  if (filtered.length === 0) { 
    container.innerHTML = `<div class="empty-state" style="padding:40px 20px"><p>${clients.length === 0 ? 'Список компаний пуст' : 'Ничего не найдено'}</p></div>`; 
    return; 
  }
  
  container.innerHTML = `<div class="clients-list" style="display:flex;flex-direction:column;gap:8px;">` + filtered.map(c => `
    <div class="client-row ${selectedClientId === c.id ? 'selected' : ''}" onclick="selectClientForContacts(${c.id})" style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;cursor:pointer;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;align-items:center;">
      <div style="font-weight:600;color:#1a3a5c;">${escapeHtml(c.orgName)}</div>
      <div style="color:#6b7280;font-size:12px;">${escapeHtml(c.orgCity || '—')}</div>
      <div style="color:#6b7280;font-size:12px;">${escapeHtml(c.contactName || '—')}</div>
      <div style="color:#6b7280;font-size:12px;">${escapeHtml((c.orgPhones || '').split(',')[0] || '—')}</div>
    </div>
  `).join('') + `</div>`;
}

function selectClientForContacts(id) {
  selectedClientId = id;
  renderClientsList();
  renderClientDetailForContacts(id);
}

function renderClientDetailForContacts(id) {
  const client = clients.find(c => c.id === id);
  if (!client) return;
  
  const container = document.getElementById('clientDetailContainer');
  const addContactBtn = document.getElementById('addContactBtn');
  if (!container) return;
  if (addContactBtn) addContactBtn.style.display = 'block';
  
  const clientContacts = client.contacts || [];
  const history = client.history || [];
  const phones = (client.orgPhones || '').split(',').map(p => p.trim()).filter(Boolean);
  const emails = (client.orgEmails || '').split(',').map(e => e.trim()).filter(Boolean);
  
  let html = `
    <div class="client-detail-full">
      <div class="detail-section" style="margin-bottom:25px;">
        <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:16px;color:#1a3a5c;font-weight:600;">${escapeHtml(client.orgName)}</h3>
          <button class="btn btn-sm btn-secondary" onclick="openClientModal(clients.find(c=>c.id===${client.id}))">Редактировать компанию</button>
        </div>
        <div class="info-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
          <div class="info-item"><label style="font-size:11px;color:#6b7280;text-transform:uppercase;">Город</label><div style="font-size:13px;color:#111;">${escapeHtml(client.orgCity || '—')}</div></div>
          <div class="info-item"><label style="font-size:11px;color:#6b7280;text-transform:uppercase;">Направление</label><div style="font-size:13px;color:#111;">${escapeHtml(client.orgDirection || '—')}</div></div>
          <div class="info-item"><label style="font-size:11px;color:#6b7280;text-transform:uppercase;">Адрес</label><div style="font-size:13px;color:#111;">${escapeHtml(client.orgAddress || '—')}</div></div>
          <div class="info-item"><label style="font-size:11px;color:#6b7280;text-transform:uppercase;">Телефоны</label><div style="font-size:13px;color:#111;">${phones.length ? phones.map(escapeHtml).join(', ') : '—'}</div></div>
          <div class="info-item"><label style="font-size:11px;color:#6b7280;text-transform:uppercase;">Email</label><div style="font-size:13px;color:#111;">${emails.length ? emails.map(escapeHtml).join(', ') : '—'}</div></div>
        </div>
      </div>
      
      <div class="detail-section" style="margin-bottom:25px;">
        <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:14px;color:#374151;font-weight:600;">Контактные лица (${clientContacts.length})</h3>
          <button class="btn btn-sm" onclick="openContactModal(${client.id})">Добавить контакт</button>
        </div>
        ${clientContacts.length === 0 ? '<p style="color:#9ca3af;font-size:12px;padding:10px 0">Нет контактных лиц</p>' : `
        <div class="contacts-table" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <div class="table-header" style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><table style="width:100%;"><thead><tr><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;">ФИО</th><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;">Должность</th><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;">Рабочий тел.</th><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;">Сотовый</th><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;">Email</th><th style="padding:10px;width:120px;"></th></tr></thead></table></div>
          <div class="table-body"><table style="width:100%;">
            ${clientContacts.map((ct, idx) => `<tr style="border-bottom:1px solid #f0f0f0;">
              <td style="padding:10px;font-size:13px;"><strong>${escapeHtml(ct.name || '—')}</strong></td>
              <td style="padding:10px;font-size:13px;color:#6b7280;">${escapeHtml(ct.position || '—')}</td>
              <td style="padding:10px;font-size:13px;color:#6b7280;">${escapeHtml(ct.phoneWork || '—')}</td>
              <td style="padding:10px;font-size:13px;color:#6b7280;">${escapeHtml(ct.phoneMobile || '—')}</td>
              <td style="padding:10px;font-size:13px;color:#6b7280;">${escapeHtml(ct.email || '—')}</td>
              <td style="padding:10px;display:flex;gap:6px;">
                <button class="btn btn-sm btn-secondary" onclick="editClientContact(${client.id}, ${idx})">Ред.</button>
                <button class="btn btn-sm btn-danger" onclick="deleteContact(${client.id}, ${idx})">×</button>
              </td>
            </tr>`).join('')}
          </table></div>
        </div>`}
      </div>
      
      <div class="detail-section">
        <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:14px;color:#374151;font-weight:600;">История взаимодействий (${history.length})</h3>
          <button class="btn btn-sm" onclick="openHistoryModal(${client.id})">Добавить запись</button>
        </div>
        ${history.length === 0 ? '<p style="color:#9ca3af;font-size:12px;padding:10px 0">Нет записей</p>' : `
        <div class="history-table" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <div class="table-header" style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><table style="width:100%;"><thead><tr><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;width:120px;">Дата</th><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;width:130px;">Тип</th><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;width:150px;">Контакт</th><th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;">Комментарий</th></tr></thead></table></div>
          <div class="table-body" style="max-height:300px;overflow-y:auto;"><table style="width:100%;">
            ${[...history].sort((a, b) => new Date(b.date) - new Date(a.date)).map(h => `<tr style="border-bottom:1px solid #f0f0f0;">
              <td style="padding:10px;font-size:12px;">${formatDate(h.date)}</td>
              <td style="padding:10px;"><span class="badge">${escapeHtml(h.type)}</span></td>
              <td style="padding:10px;font-size:12px;">${escapeHtml(h.contactPerson || '—')}</td>
              <td style="padding:10px;font-size:12px;"><div style="background:#f9fafb;padding:6px 8px;border-radius:4px;">${escapeHtml(h.comment)}</div></td>
            </tr>`).join('')}
          </table></div>
        </div>`}
      </div>
    </div>`;
  
  container.innerHTML = html;
}

function startContactsResize(e) {
  isDragging = true;
  document.addEventListener('mousemove', handleContactsResize);
  document.addEventListener('mouseup', stopContactsResize);
  e.preventDefault();
}

function handleContactsResize(e) {
  if (!isDragging) return;
  const container = document.querySelector('.contacts-split-container');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const newY = ((e.clientY - rect.top) / rect.height) * 100;
  contactsSplitPosition = Math.max(20, Math.min(80, newY));
  document.getElementById('contactsTopPanel').style.height = contactsSplitPosition + '%';
  document.getElementById('contactsBottomPanel').style.height = (100 - contactsSplitPosition) + '%';
}

function stopContactsResize() {
  isDragging = false;
  document.removeEventListener('mousemove', handleContactsResize);
  document.removeEventListener('mouseup', stopContactsResize);
}

function setupContactsResize() {
  // Инициализация обработчиков
}

function formatDate(isoString) { 
  if (!isoString) return '—'; 
  const d = new Date(isoString); 
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); 
}

// Экспорт/импорт клиентов в CSV
function exportClientsToCSV() {
  if (clients.length === 0) { alert('Нет данных для экспорта'); return; }
  const headers = ['ID,Организация,Город,Направление,Адрес,Телефоны,Email,Контакт,Должность'];
  const rows = clients.map(c => [
    c.id,
    `"${(c.orgName || '').replace(/"/g, '""')}"`,
    `"${(c.orgCity || '').replace(/"/g, '""')}"`,
    `"${(c.orgDirection || '').replace(/"/g, '""')}"`,
    `"${(c.orgAddress || '').replace(/"/g, '""')}"`,
    `"${(c.orgPhones || '').replace(/"/g, '""')}"`,
    `"${(c.orgEmails || '').replace(/"/g, '""')}"`,
    `"${(c.contactName || '').replace(/"/g, '""')}"`,
    `"${(c.contactPosition || '').replace(/"/g, '""')}"`
  ].join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clients_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function importClientsFromCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n').slice(1);
    let count = 0;
    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const clean = parts.map(p => p ? p.replace(/^"|"$/g, '').replace(/""/g, '"') : '');
      if (clean.length >= 2) {
        const maxId = clients.reduce((m, c) => Math.max(m, c.id || 0), 0);
        clients.push({
          id: maxId + 1,
          orgName: clean[1] || '',
          orgCity: clean[2] || '',
          orgDirection: clean[3] || '',
          orgAddress: clean[4] || '',
          orgPhones: clean[5] || '',
          orgEmails: clean[6] || '',
          contactName: clean[7] || '',
          contactPosition: clean[8] || '',
          contacts: [],
          history: []
        });
        count++;
      }
    });
    saveClients(clients);
    renderClientsList();
    alert(`Импортировано ${count} компаний`);
  };
  reader.readAsText(file);
  event.target.value = '';
}
