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

function escapeHtml(s) { if (!s) return ''; return s.replace(/[&<>"'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"':"'&#39;'})[m]); }


function renderContacts() {
  const main = document.getElementById('mainContent');
  const filteredContacts = contacts.filter(c => c.type === currentContactsSubsection);
  const titles = { internal: 'Внутренние номера', mobile: 'Мобильные телефоны' };
  
  main.innerHTML = `
    <div class="main-right" style="width:100%">
      <div class="main-right-content" style="padding:20px 30px;">
        <div class="contacts-header-wrapper">
          <h2 style="font-size:20px;font-weight:600;color:#1a3a5c;">${currentContactsSubsection === 'internal' ? 'Внутренние номера' : 'Мобильные телефоны'}</h2>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-sm btn-secondary" onclick="exportContactsToExcel()">Экспорт CSV</button>
            <button class="btn btn-sm btn-secondary" onclick="document.getElementById('importContactsFile').click()">Импорт CSV</button>
            <input type="file" id="importContactsFile" style="display:none" accept=".csv" onchange="importContactsFromExcel(event)">
            <button class="btn" onclick="openContactItemModal()">Добавить контакт</button>
          </div>
        </div>
        
        <div class="stats-bar" style="margin:15px 0;">
          <div class="stat-card"><div class="stat-value">${filteredContacts.length}</div><div class="stat-label">Всего контактов</div></div>
          <div class="stat-card"><div class="stat-value">${new Set(filteredContacts.map(c => c.department).filter(Boolean)).size}</div><div class="stat-label">Отделов</div></div>
        </div>
        
        <input type="text" class="search-bar" id="contactsSearch" placeholder="Поиск по имени, отделу или номеру..." oninput="renderContactsList()">
        <div class="contacts-list" id="contactsList" style="margin-top:15px;"></div>
      </div>
    </div>`;
  renderContactsList();
}

function renderContactsList() {
  const search = (document.getElementById('contactsSearch')?.value || '').toLowerCase();
  const filtered = contacts.filter(c => 
    c.type === currentContactsSubsection &&
    (c.name.toLowerCase().includes(search) || 
     (c.department || '').toLowerCase().includes(search) ||
     (c.position || '').toLowerCase().includes(search) ||
     c.number.toLowerCase().includes(search))
  );
  
  const list = document.getElementById('contactsList');
  if (filtered.length === 0) { 
    list.innerHTML = `<div class="empty-state" style="padding:60px 20px"><p>Ничего не найдено</p></div>`; 
    return; 
  }
  
  list.innerHTML = filtered.map(c => `
    <div class="contact-item">
      <div class="contact-info">
        <div class="contact-field">
          <span class="contact-field-label">ФИО</span>
          <span class="contact-field-value contact-name">${escapeHtml(c.name)}</span>
        </div>
        <div class="contact-field">
          <span class="contact-field-label">Должность</span>
          <span class="contact-field-value contact-position">${escapeHtml(c.position || '—')}</span>
        </div>
        <div class="contact-field">
          <span class="contact-field-label">Отдел</span>
          <span class="contact-field-value contact-department">${escapeHtml(c.department || '—')}</span>
        </div>
        <div class="contact-field">
          <span class="contact-field-label">Номер</span>
          <span class="contact-field-value contact-number">${escapeHtml(c.number)}</span>
        </div>
      </div>
      <div class="contact-actions">
        <button class="btn btn-sm btn-secondary" onclick="editContactItem(${c.id})">Редактировать</button>
        <button class="btn btn-sm btn-danger" onclick="deleteContactItem(${c.id})">Удалить</button>
      </div>
    </div>
  `).join('');
}

function openContactItemModal(contact = null) {
  document.getElementById('contactItemModalTitle').textContent = contact ? 'Редактировать контакт' : 'Добавить контакт';
  document.getElementById('contactItemId').value = contact?.id || '';
  document.getElementById('contactItemType').value = currentContactsSubsection;
  document.getElementById('newContactName').value = contact?.name || '';
  document.getElementById('newContactPosition').value = contact?.position || '';
  document.getElementById('newContactDept').value = contact?.department || '';
  document.getElementById('newContactNumber').value = contact?.number || '';
  document.getElementById('contactItemModal').classList.add('active');
}

function saveContactItem(e) {
  e.preventDefault();
  const id = document.getElementById('contactItemId').value;
  const type = document.getElementById('contactItemType').value;
  const data = { 
    name: document.getElementById('newContactName').value.trim(), 
    position: document.getElementById('newContactPosition').value.trim(), 
    department: document.getElementById('newContactDept').value.trim(), 
    number: document.getElementById('newContactNumber').value.trim(), 
    type: type 
  };
  
  if (id) { 
    const idx = contacts.findIndex(c => c.id === parseInt(id)); 
    if (idx !== -1) contacts[idx] = { ...contacts[idx], ...data }; 
  } else { 
    const maxId = contacts.reduce((m, c) => Math.max(m, c.id || 0), 0); 
    data.id = maxId + 1; 
    contacts.push(data); 
  }
  
  saveContacts(contacts);
  closeModal('contactItemModal');
  renderContactsList();
}

function editContactItem(id) { 
  const c = contacts.find(x => x.id === id); 
  if (c) openContactItemModal(c); 
}

function deleteContactItem(id) { 
  if (!confirm('Удалить контакт?')) return; 
  contacts = contacts.filter(c => c.id !== id); 
  saveContacts(contacts); 
  renderContactsList(); 
}