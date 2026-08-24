function escapeHtml(s) { if (!s) return ''; return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function closeModal(id) { const modal = document.getElementById(id); if (modal) modal.classList.remove('active'); }

function injectModals() {
  const modalsHTML = `
    <div class="modal-overlay" id="clientModal">
      <div class="modal">
        <h2 id="clientModalTitle">Новый клиент</h2>
        <form onsubmit="saveClient(event)">
          <input type="hidden" id="clientId">
          <div class="form-section">
            <h3>Организация</h3>
            <div class="form-row"><div class="form-group"><label>Название *</label><input type="text" id="orgName" required></div></div>
            <div class="form-row"><div class="form-group"><label>Город</label><input type="text" id="orgCity"></div><div class="form-group"><label>Направление</label><input type="text" id="orgDirection"></div></div>
            <div class="form-row"><div class="form-group"><label>Адрес</label><input type="text" id="orgAddress"></div></div>
            <div class="form-row"><div class="form-group"><label>Телефоны</label><input type="text" id="orgPhones"></div></div>
            <div class="form-row"><div class="form-group"><label>Email</label><input type="text" id="orgEmails"></div></div>
          </div>
          <div class="form-section">
            <h3>Основной контакт</h3>
            <div class="form-row"><div class="form-group"><label>ФИО</label><input type="text" id="contactName"></div><div class="form-group"><label>Должность</label><input type="text" id="contactPosition"></div></div>
            <div class="form-row"><div class="form-group"><label>Рабочий тел.</label><input type="text" id="contactPhoneWork"></div><div class="form-group"><label>Сотовый</label><input type="text" id="contactPhoneMobile"></div></div>
            <div class="form-row"><div class="form-group"><label>Email</label><input type="email" id="contactEmail"></div></div>
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal('clientModal')">Отмена</button><button type="submit" class="btn">Сохранить</button></div>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="contactModal">
      <div class="modal">
        <h2 id="contactModalTitle">Добавить контактное лицо</h2>
        <form onsubmit="saveContact(event)">
          <input type="hidden" id="contactClientId">
          <input type="hidden" id="editContactIdx" value="">
          <div class="form-section">
            <div class="form-row"><div class="form-group"><label>ФИО *</label><input type="text" id="newContactName" required></div><div class="form-group"><label>Должность</label><input type="text" id="newContactPosition"></div></div>
            <div class="form-row"><div class="form-group"><label>Рабочий тел.</label><input type="text" id="newContactPhoneWork"></div><div class="form-group"><label>Сотовый</label><input type="text" id="newContactPhoneMobile"></div></div>
            <div class="form-row"><div class="form-group"><label>Email</label><input type="email" id="newContactEmail"></div></div>
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal('contactModal')">Отмена</button><button type="submit" class="btn">Сохранить</button></div>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="historyModal">
      <div class="modal">
        <h2>Добавить взаимодействие</h2>
        <form onsubmit="saveHistory(event)">
          <input type="hidden" id="historyClientId">
          <div class="form-section">
            <div class="form-row">
              <div class="form-group"><label>Тип</label><select id="historyType"><option>Звонок входящий</option><option>Звонок исходящий</option><option>Встреча</option><option>Email</option><option>Другое</option></select></div>
              <div class="form-group"><label>Контактное лицо</label><select id="historyContactPerson"></select></div>
            </div>
            <div class="form-row"><div class="form-group"><label>Комментарий *</label><textarea id="historyComment" rows="4" required></textarea></div></div>
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal('historyModal')">Отмена</button><button type="submit" class="btn">Добавить</button></div>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="contactItemModal">
      <div class="modal">
        <h2 id="contactItemModalTitle">Добавить контакт</h2>
        <form onsubmit="saveContactItem(event)">
          <input type="hidden" id="contactItemId">
          <input type="hidden" id="contactItemType">
          <div class="form-section">
            <div class="form-row"><div class="form-group"><label>ФИО *</label><input type="text" id="newContactName" required></div></div>
            <div class="form-row"><div class="form-group"><label>Должность</label><input type="text" id="newContactPosition"></div><div class="form-group"><label>Отдел</label><input type="text" id="newContactDept"></div></div>
            <div class="form-row"><div class="form-group"><label>Номер *</label><input type="text" id="newContactNumber" required></div></div>
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal('contactItemModal')">Отмена</button><button type="submit" class="btn">Сохранить</button></div>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="reminderModal">
      <div class="modal">
        <h2 id="reminderModalTitle">Новое напоминание</h2>
        <form onsubmit="saveReminder(event)">
          <input type="hidden" id="reminderId">
          <input type="hidden" id="reminderClientId">
          <div class="form-section">
            <div class="form-row"><div class="form-group"><label>Название *</label><input type="text" id="reminderTitle" required></div></div>
            <div class="form-row"><div class="form-group"><label>Описание</label><textarea id="reminderDescription" rows="3"></textarea></div></div>
            <div class="form-row"><div class="form-group"><label>Дата *</label><input type="date" id="reminderDate" required></div><div class="form-group"><label>Время *</label><input type="time" id="reminderTime" required></div></div>
            <div class="form-row"><div class="form-group"><label>Цвет</label><select id="reminderColor"></select></div></div>
            <div class="form-row">
              <div class="form-group">
                <label>Назначить</label>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><input type="checkbox" id="reminderAssignMe" style="width:16px;height:16px;"><label for="reminderAssignMe" style="margin:0;font-size:13px;cursor:pointer;">Я (Admin)</label></div>
                <select id="reminderAssignees" multiple style="min-height:100px;"></select>
                <div style="font-size:11px;color:#9ca3af;margin-top:4px;">Ctrl+клик для нескольких</div>
              </div>
            </div>
            <div id="reminderClientLink" style="display:none;font-size:13px;color:#6b7280;padding:8px;background:#f9fafb;border-radius:6px;margin-top:8px;"></div>
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal('reminderModal')">Отмена</button><button type="submit" class="btn">Сохранить</button></div>
        </form>
      </div>
    </div>

    <div class="modal-overlay" id="taskModal">
      <div class="modal" style="width:650px;">
        <h2 id="taskModalTitle">Новая задача</h2>
        <form onsubmit="saveTask(event)">
          <input type="hidden" id="taskId">
          <input type="hidden" id="taskClientId">
          <div class="form-section">
            <div class="form-row"><div class="form-group"><label>Название *</label><input type="text" id="taskTitle" required></div></div>
            <div class="form-row"><div class="form-group"><label>Описание</label><textarea id="taskDescription" rows="3"></textarea></div></div>
            <div class="form-row"><div class="form-group"><label>Дедлайн</label><input type="date" id="taskDeadline"></div><div class="form-group"><label>Приоритет</label><select id="taskPriority"></select></div></div>
            <div class="form-row"><div class="form-group"><label>Тип задачи (колонка)</label><select id="taskColumn"></select></div></div>
            <div class="form-row" id="taskClientRow">
              <div class="form-group">
                <label>Клиент (компания)</label>
                <select id="taskClientSelect" onchange="onTaskClientChange()" style="width:100%;padding:7px 9px;border:1px solid #d0d5dd;border-radius:5px;font-size:12px;"></select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Назначить</label>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><input type="checkbox" id="taskAssignMe" style="width:16px;height:16px;"><label for="taskAssignMe" style="margin:0;font-size:13px;cursor:pointer;">Я (Admin)</label></div>
                <select id="taskAssignees" multiple style="min-height:100px;"></select>
                <div style="font-size:11px;color:#9ca3af;margin-top:4px;">Ctrl+клик для нескольких</div>
              </div>
            </div>
          </div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" onclick="closeModal('taskModal')">Отмена</button><button type="submit" class="btn">Сохранить</button></div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalsHTML);
}

function initApp() {
  const data = loadData();
  clients = data.clients;
  contacts = data.contacts;
  loadReminders();
  loadTasks();
  injectModals();
  fetchCurrencyRates();
  renderSection('clients');

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('#contactsArrow') || e.target.closest('#adminArrow')) return;
      if (item.dataset.section === 'contacts' || item.dataset.section === 'admin') return;
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('contactsSubmenu').classList.remove('show');
      document.getElementById('adminSubmenu').classList.remove('show');
      renderSection(item.dataset.section);
    });
  });
}

function renderSection(section) {
  const main = document.getElementById('mainContent');
  if (section === 'clients') {
    main.innerHTML = `
      <div class="main-left">
        <div class="main-left-header">
          <div class="main-header"><h1>Клиенты</h1><button class="btn" onclick="openClientModal()">Добавить</button></div>
          <input type="text" class="search-bar" id="searchInput" placeholder="Поиск..." oninput="renderClientsTable()">
        </div>
        <div class="main-left-content" id="tableWrap"></div>
      </div>
      <div class="main-right"><div class="main-right-content" id="clientDetailPanel"><div class="placeholder"><h2>Выберите клиента</h2><p>Кликните на строку в таблице слева</p></div></div></div>`;
    renderClientsTable();
  } else if (section === 'contacts') { renderContacts(); }
  else if (section === 'tasks') { renderTasks(); }
  else if (section === 'reminders') { renderReminders(); }
  else if (section === 'basket') { renderBasket(); }
  else if (section === 'admin') { renderAdminStats(); }
  else { main.innerHTML = `<div class="placeholder" style="width:100%"><h2>${section === 'orders' ? 'Заказы' : 'Раздел'}</h2><p>Скоро здесь что-то появится</p></div>`; }
}

function toggleContactsSubmenu() {
  const submenu = document.getElementById('contactsSubmenu');
  const arrow = document.getElementById('contactsArrow');
  submenu.classList.toggle('show');
  arrow.style.transform = submenu.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
  if (submenu.classList.contains('show')) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-section="contacts"]').classList.add('active');
    renderContacts();
  }
}

function showContactsSubsection(subsection) {
  currentContactsSubsection = subsection;
  document.querySelectorAll('#contactsSubmenu .submenu-item').forEach(item => { item.classList.toggle('active', item.dataset.subsection === subsection); });
  renderContacts();
}

function toggleAdminSubmenu() {
  const submenu = document.getElementById('adminSubmenu');
  const arrow = document.getElementById('adminArrow');
  submenu.classList.toggle('show');
  arrow.style.transform = submenu.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
  if (submenu.classList.contains('show')) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-section="admin"]').classList.add('active');
    renderAdminStats();
  }
}

function showAdminSubsection(subsection) {
  document.querySelectorAll('#adminSubmenu .submenu-item').forEach(item => { item.classList.toggle('active', item.dataset.subsection === subsection); });
  if (subsection === 'stats') renderAdminStats();
  if (subsection === 'reports') renderAdminReports();
  if (subsection === 'users') renderAdminUsers();
}

function onTaskClientChange() {
  const clientId = parseInt(document.getElementById('taskClientSelect').value);
  document.getElementById('taskClientId').value = clientId || '';
}

// Basket functionality
let basketItems = [];

function renderBasket() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="main-left" style="width:50%">
      <div class="main-left-header">
        <div class="main-header"><h1>Корзина</h1><button class="btn" onclick="openBasketItemModal()">Добавить</button></div>
        <input type="text" class="search-bar" id="basketSearchInput" placeholder="Поиск..." oninput="renderBasketList()">
      </div>
      <div class="main-left-content" id="basketListWrap"></div>
    </div>
    <div class="main-right" style="width:50%"><div class="main-right-content" id="basketDetailPanel"><div class="placeholder"><h2>Выберите элемент из корзины</h2><p>Кликните на строку в списке слева</p></div></div></div>`;
  renderBasketList();
}

function renderBasketList() {
  const wrap = document.getElementById('basketListWrap');
  const search = (document.getElementById('basketSearchInput')?.value || '').toLowerCase();
  const filtered = basketItems.filter(item => !item.deleted && (!search || item.name.toLowerCase().includes(search) || (item.note||'').toLowerCase().includes(search)));
  
  if (filtered.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><p>Корзина пуста</p></div>`;
    return;
  }
  
  let html = `<table><thead><tr><th>Название</th><th>Дата добавления</th></tr></thead><tbody>`;
  filtered.forEach((item, idx) => {
    const realIdx = basketItems.indexOf(item);
    const dateStr = item.date ? new Date(item.date).toLocaleDateString('ru-RU') : '';
    html += `<tr onclick="showBasketItem(${realIdx})"><td>${escapeHtml(item.name)}</td><td>${dateStr}</td></tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

function openBasketItemModal() {
  document.getElementById('basketItemId').value = '';
  document.getElementById('basketItemName').value = '';
  document.getElementById('basketItemNote').value = '';
  document.getElementById('basketItemDate').value = '';
  document.getElementById('basketItemModalTitle').textContent = 'Добавить в корзину';
  document.getElementById('basketItemModal').classList.add('active');
}

function saveBasketItem(e) {
  e.preventDefault();
  const id = document.getElementById('basketItemId').value;
  const name = document.getElementById('basketItemName').value.trim();
  const note = document.getElementById('basketItemNote').value.trim();
  const date = document.getElementById('basketItemDate').value;
  
  if (!name) return alert('Введите название');
  
  if (id) {
    const idx = parseInt(id);
    basketItems[idx] = { ...basketItems[idx], name, note, date };
  } else {
    basketItems.push({ name, note, date, deleted: false });
  }
  
  closeModal('basketItemModal');
  renderBasketList();
}

function showBasketItem(idx) {
  const item = basketItems[idx];
  if (!item) return;
  
  const panel = document.getElementById('basketDetailPanel');
  const dateStr = item.date ? new Date(item.date).toLocaleDateString('ru-RU') : '';
  
  panel.innerHTML = `
    <div class="client-detail active">
      <div class="detail-header">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2>${escapeHtml(item.name)}</h2>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-secondary" onclick="editBasketItem(${idx})">Редактировать</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBasketItem(${idx})">Удалить</button>
          </div>
        </div>
        <div class="meta">Добавлено: ${dateStr}</div>
      </div>
      <div class="detail-section">
        <h3>Примечание</h3>
        <p style="color:#4b5563;line-height:1.6;">${item.note ? escapeHtml(item.note) : '<em>Нет примечания</em>'}</p>
      </div>
    </div>
  `;
}

function editBasketItem(idx) {
  const item = basketItems[idx];
  document.getElementById('basketItemId').value = idx;
  document.getElementById('basketItemName').value = item.name;
  document.getElementById('basketItemNote').value = item.note || '';
  document.getElementById('basketItemDate').value = item.date || '';
  document.getElementById('basketItemModalTitle').textContent = 'Редактировать элемент';
  document.getElementById('basketItemModal').classList.add('active');
}

function deleteBasketItem(idx) {
  if (!confirm('Удалить этот элемент из корзины?')) return;
  basketItems[idx].deleted = true;
  renderBasketList();
  document.getElementById('basketDetailPanel').innerHTML = `<div class="placeholder"><h2>Элемент удален</h2><p>Выберите другой элемент или добавьте новый</p></div>`;
}

function openBasketItemModal() {
  document.getElementById('basketItemId').value = '';
  document.getElementById('basketItemName').value = '';
  document.getElementById('basketItemNote').value = '';
  document.getElementById('basketItemDate').value = '';
  document.getElementById('basketItemModalTitle').textContent = 'Добавить в корзину';
  document.getElementById('basketItemModal').classList.add('active');
}