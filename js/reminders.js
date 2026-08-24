let reminders = [];
let currentReminderMonth = new Date().getMonth();
let currentReminderYear = new Date().getFullYear();

const REMINDER_COLORS = [
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Красный', value: '#ef4444' },
  { name: 'Зеленый', value: '#10b981' },
  { name: 'Серый', value: '#6b7280' },
  { name: 'Оранжевый', value: '#f59e0b' }
];

function loadReminders() { reminders = JSON.parse(localStorage.getItem('alvid_crm_reminders') || '[]'); }

function renderReminders() {
  const main = document.getElementById('mainContent');
  const today = new Date().toISOString().split('T')[0];

  const overdue = reminders.filter(r => r.date < today && !r.completed).sort((a,b) => new Date(a.date) - new Date(b.date));
  const upcoming = reminders.filter(r => r.date >= today && !r.completed).sort((a,b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  const completed = reminders.filter(r => r.completed);

  main.innerHTML = `
    <div style="padding:20px;height:100vh;display:flex;flex-direction:column;overflow:hidden;">
      <div class="contacts-header-wrapper">
        <h1 style="font-size:22px;font-weight:600;color:#1a3a5c;">Напоминания</h1>
        <button class="btn" onclick="openReminderModal()">Новое напоминание</button>
      </div>

      <div style="display:flex;gap:20px;margin-top:15px;flex:1;overflow:hidden;">
         ${renderReminderCalendar()}
         <div style="flex:1;display:flex;gap:15px;overflow-x:auto;">
            <div class="reminder-column">
               <div class="reminder-column-header" style="color:#ef4444;border-color:#ef4444;">Просрочено (${overdue.length})</div>
               <div class="reminder-column-body">${overdue.map(r => renderReminderCard(r, 'overdue')).join('') || '<div style="color:#9ca3af;padding:10px;font-size:13px;">Нет просроченных</div>'}</div>
            </div>
            <div class="reminder-column">
               <div class="reminder-column-header" style="color:#3b82f6;border-color:#3b82f6;">Предстоит (${upcoming.length})</div>
               <div class="reminder-column-body">${upcoming.map(r => renderReminderCard(r, 'upcoming')).join('') || '<div style="color:#9ca3af;padding:10px;font-size:13px;">Нет предстоящих</div>'}</div>
            </div>
            <div class="reminder-column">
               <div class="reminder-column-header" style="color:#10b981;border-color:#10b981;">Выполнено (${completed.length})</div>
               <div class="reminder-column-body">${completed.map(r => renderReminderCard(r, 'completed')).join('') || '<div style="color:#9ca3af;padding:10px;font-size:13px;">Нет выполненных</div>'}</div>
            </div>
         </div>
      </div>
    </div>
  `;
}

function renderReminderCalendar() {
  const year = currentReminderYear;
  const month = currentReminderMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay() || 7;
  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  let html = `<div class="calendar-wrapper" style="width:280px;flex-shrink:0;">
    <div class="calendar-header">
      <button onclick="changeReminderMonth(-1)" style="background:none;border:none;cursor:pointer;font-size:16px;">&lt;</button>
      <span style="font-weight:600;font-size:14px;">${monthNames[month]} ${year}</span>
      <button onclick="changeReminderMonth(1)" style="background:none;border:none;cursor:pointer;font-size:16px;">&gt;</button>
    </div>
    <div class="calendar-grid">`;

  ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(d => { html += `<div class="calendar-day-header">${d}</div>`; });
  for (let i = 1; i < startDay; i++) html += '<div></div>';

  const today = new Date().toISOString().split('T')[0];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayReminders = reminders.filter(r => r.date === dateStr && !r.completed);
    const isToday = dateStr === today;

    html += `<div class="calendar-day ${isToday ? 'today' : ''}">
      <div>${day}</div>
      <div class="calendar-indicators">
        ${dayReminders.slice(0,3).map(r => {
          const color = REMINDER_COLORS.find(c => c.value === r.color)?.value || '#6b7280';
          return `<div class="calendar-dot" style="background:${color};"></div>`;
        }).join('')}
      </div>
    </div>`;
  }
  html += '</div></div>';
  return html;
}

function changeReminderMonth(delta) {
  currentReminderMonth += delta;
  if (currentReminderMonth > 11) { currentReminderMonth = 0; currentReminderYear++; }
  if (currentReminderMonth < 0) { currentReminderMonth = 11; currentReminderYear--; }
  renderReminders();
}

function renderReminderCard(reminder, status) {
  const color = REMINDER_COLORS.find(c => c.value === reminder.color) || REMINDER_COLORS[0];
  const isOverdue = status === 'overdue';
  const isCompleted = status === 'completed';
  const assignedContacts = (reminder.assignees || []).map(a => {
    if (a.type === 'me') return 'Admin';
    const contact = contacts.find(c => c.id === a.id);
    return contact ? contact.name : null;
  }).filter(Boolean);
  const client = reminder.clientId ? clients.find(c => c.id === reminder.clientId) : null;

  return `
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:10px;border-left:3px solid ${isOverdue ? '#ef4444' : color.value};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div style="display:flex;align-items:flex-start;gap:10px;flex:1;">
          <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleReminderComplete(${reminder.id})" style="margin-top:2px;">
          <div style="flex:1;">
            <div style="font-weight:500;color:#111;${isCompleted ? 'text-decoration:line-through;opacity:0.6;' : ''}">${escapeHtml(reminder.title)}</div>
            ${reminder.description ? `<div style="font-size:11px;color:#6b7280;margin-top:4px;">${escapeHtml(reminder.description)}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn-icon-btn" onclick="editReminder(${reminder.id})">Ред.</button>
          <button class="btn-icon-btn" onclick="deleteReminder(${reminder.id})" style="color:#ef4444;">Удал.</button>
        </div>
      </div>
      <div style="font-size:11px;color:#6b7280;display:flex;gap:10px;flex-wrap:wrap;">
        <span style="${isOverdue ? 'color:#ef4444;font-weight:600;' : ''}">${formatDate(reminder.date)} ${reminder.time}</span>
        ${client ? `<span style="color:#3b82f6;cursor:pointer;" onclick="goToClient(${client.id})">${escapeHtml(client.orgName)}</span>` : ''}
      </div>
      ${assignedContacts.length > 0 ? `<div style="font-size:11px;color:#6b7280;margin-top:6px;">${assignedContacts.join(', ')}</div>` : ''}
    </div>
  `;
}

function goToClient(id) {
  document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
  document.querySelector('[data-section="clients"]').classList.add('active');
  document.getElementById('contactsSubmenu').classList.remove('show');
  renderSection('clients');
  setTimeout(() => selectClient(id), 50);
}

function openReminderModal(reminder = null, clientId = null) {
  document.getElementById('reminderModalTitle').textContent = reminder ? 'Редактировать напоминание' : 'Новое напоминание';
  document.getElementById('reminderId').value = reminder?.id || '';
  document.getElementById('reminderTitle').value = reminder?.title || '';
  document.getElementById('reminderDescription').value = reminder?.description || '';
  document.getElementById('reminderDate').value = reminder?.date || new Date().toISOString().split('T')[0];
  document.getElementById('reminderTime').value = reminder?.time || '09:00';
  document.getElementById('reminderClientId').value = reminder?.clientId || clientId || '';

  const colorSelect = document.getElementById('reminderColor');
  colorSelect.innerHTML = REMINDER_COLORS.map(c => `<option value="${c.value}" ${reminder?.color === c.value ? 'selected' : ''}>${c.name}</option>`).join('');

  const meCheckbox = document.getElementById('reminderAssignMe');
  const assigneesSelect = document.getElementById('reminderAssignees');
  const hasMe = reminder?.assignees?.some(a => a.type === 'me');
  meCheckbox.checked = hasMe || false;
  assigneesSelect.innerHTML = contacts.map(c => {
    const isSelected = reminder?.assignees?.some(a => a.type === 'contact' && a.id === c.id);
    return `<option value="${c.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(c.name)} (${escapeHtml(c.department || '')})</option>`;
  }).join('');

  const clientLink = document.getElementById('reminderClientLink');
  const cid = reminder?.clientId || clientId;
  if (cid) {
    const c = clients.find(cl => cl.id === cid);
    if (c) { clientLink.style.display = 'block'; clientLink.innerHTML = `<strong>${escapeHtml(c.orgName)}</strong> <button type="button" onclick="unlinkReminderFromClient()" style="background:none;border:none;color:#ef4444;cursor:pointer;">x</button>`; }
  } else { clientLink.style.display = 'none'; }

  document.getElementById('reminderModal').classList.add('active');
}

function unlinkReminderFromClient() { document.getElementById('reminderClientId').value = ''; document.getElementById('reminderClientLink').style.display = 'none'; }

function saveReminder(e) {
  e.preventDefault();
  const id = document.getElementById('reminderId').value;
  const clientIdVal = document.getElementById('reminderClientId').value;
  const assignees = [];
  if (document.getElementById('reminderAssignMe').checked) assignees.push({ type: 'me' });
  Array.from(document.getElementById('reminderAssignees').selectedOptions).forEach(opt => { assignees.push({ type: 'contact', id: parseInt(opt.value) }); });

  const data = { title: document.getElementById('reminderTitle').value.trim(), description: document.getElementById('reminderDescription').value.trim(), date: document.getElementById('reminderDate').value, time: document.getElementById('reminderTime').value, color: document.getElementById('reminderColor').value, assignees: assignees, clientId: clientIdVal ? parseInt(clientIdVal) : null };

  if (id) { const idx = reminders.findIndex(r => r.id === parseInt(id)); if (idx !== -1) reminders[idx] = { ...reminders[idx], ...data }; }
  else { const maxId = reminders.reduce((m, r) => Math.max(m, r.id || 0), 0); data.id = maxId + 1; data.completed = false; data.createdAt = new Date().toISOString(); reminders.push(data); }

  saveReminders(reminders);
  closeModal('reminderModal');
  renderReminders();
}

function editReminder(id) { const r = reminders.find(x => x.id === id); if (r) openReminderModal(r); }
function deleteReminder(id) { if (!confirm('Удалить напоминание?')) return; reminders = reminders.filter(r => r.id !== id); saveReminders(reminders); renderReminders(); }
function toggleReminderComplete(id) { const r = reminders.find(x => x.id === id); if (!r) return; r.completed = !r.completed; r.completedAt = r.completed ? new Date().toISOString() : null; saveReminders(reminders); renderReminders(); }