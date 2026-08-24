function renderAdminStats() {
  const main = document.getElementById('mainContent');
  const totalClients = clients.length;
  const totalContacts = contacts.length;
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.status !== 'completed').length;
  const totalReminders = reminders.length;
  const overdueReminders = reminders.filter(r => r.date < new Date().toISOString().split('T')[0] && !r.completed).length;

  main.innerHTML = `
    <div class="admin-container">
      <h1 style="font-size:22px;font-weight:600;color:#1a3a5c;margin-bottom:20px;">Статистика</h1>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:15px;">
        <div class="stat-card"><div class="stat-value">${totalClients}</div><div class="stat-label">Всего клиентов</div></div>
        <div class="stat-card"><div class="stat-value">${totalContacts}</div><div class="stat-label">Всего контактов</div></div>
        <div class="stat-card"><div class="stat-value">${totalTasks}</div><div class="stat-label">Всего задач</div></div>
        <div class="stat-card"><div class="stat-value" style="color:#f59e0b">${activeTasks}</div><div class="stat-label">Активных задач</div></div>
        <div class="stat-card"><div class="stat-value">${totalReminders}</div><div class="stat-label">Всего напоминаний</div></div>
        <div class="stat-card"><div class="stat-value" style="color:#ef4444">${overdueReminders}</div><div class="stat-label">Просрочено напоминаний</div></div>
      </div>
    </div>
  `;
}

function renderAdminReports() {
  const main = document.getElementById('mainContent');
  const today = new Date().toISOString().split('T')[0];

  main.innerHTML = `
    <div class="admin-container">
      <h1 style="font-size:22px;font-weight:600;color:#1a3a5c;margin-bottom:20px;">Отчеты по комментариям</h1>
      <div class="report-controls">
        <label style="font-weight:500;">Выберите дату:</label>
        <input type="date" id="reportDate" value="${today}" onchange="loadReportData()">
        <button class="btn btn-sm" onclick="loadReportData()">Показать</button>
        <button class="btn btn-sm btn-secondary" onclick="exportReportToExcel()">Выгрузить в Excel</button>
      </div>
      <div id="reportResults"></div>
    </div>
  `;
  loadReportData();
}

function loadReportData() {
  const dateStr = document.getElementById('reportDate').value;
  if (!dateStr) return;

  const results = [];
  clients.forEach(c => {
    if (c.history) {
      c.history.forEach(h => {
        if (h.date.startsWith(dateStr)) {
          results.push({ client: c.orgName, clientId: c.id, ...h });
        }
      });
    }
  });

  results.sort((a, b) => new Date(b.date) - new Date(a.date));

  const container = document.getElementById('reportResults');
  if (results.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:40px;"><p>Нет комментариев за выбранную дату</p></div>';
    return;
  }

  let html = `<table class="report-table"><thead><tr><th>Время</th><th>Клиент</th><th>Тип</th><th>Контакт</th><th>Комментарий</th></tr></thead><tbody>`;
  results.forEach(r => {
    const time = new Date(r.date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
    html += `<tr>
      <td>${time}</td>
      <td style="cursor:pointer;color:#3b82f6;" onclick="goToClient(${r.clientId})">${escapeHtml(r.client)}</td>
      <td><span class="badge">${escapeHtml(r.type)}</span></td>
      <td>${escapeHtml(r.contactPerson || '')}</td>
      <td><div class="history-comment">${escapeHtml(r.comment)}</div></td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function exportReportToExcel() {
  const dateStr = document.getElementById('reportDate').value;
  if (!dateStr) { alert('Сначала выберите дату'); return; }

  const results = [];
  clients.forEach(c => {
    if (c.history) {
      c.history.forEach(h => {
        if (h.date.startsWith(dateStr)) {
          results.push({ date: h.date, client: c.orgName, type: h.type, contact: h.contactPerson, comment: h.comment });
        }
      });
    }
  });

  let csv = '\uFEFFДата;Время;Клиент;Тип;Контакт;Комментарий\n';
  results.forEach(r => {
    const d = new Date(r.date);
    const datePart = d.toLocaleDateString('ru-RU');
    const timePart = d.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
    const comment = r.comment.replace(/"/g, '""').replace(/\n/g, ' ');
    csv += `${datePart};${timePart};"${r.client}";"${r.type}";"${r.contact || ''}";"${comment}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderAdminUsers() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="admin-container">
      <h1 style="font-size:22px;font-weight:600;color:#1a3a5c;margin-bottom:20px;">Пользователи</h1>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
        <table style="width:100%;">
          <thead><tr><th>Логин</th><th>Имя</th><th>Роль</th><th>Статус</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>Admin</strong></td>
              <td>Администратор</td>
              <td><span class="badge" style="background:#dbeafe;color:#1e40af;">Администратор</span></td>
              <td style="color:#10b981;">Активен</td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top:15px;color:#6b7280;font-size:12px;">Управление пользователями будет доступно в следующей версии при подключении сервера.</p>
      </div>
    </div>
  `;
}