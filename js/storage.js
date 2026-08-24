function loadData() {
  let clients = localStorage.getItem('alvid_crm_clients');
  clients = clients ? JSON.parse(clients) : [];

  let contacts = localStorage.getItem('alvid_crm_contacts');
  contacts = contacts ? JSON.parse(contacts) : [];

  return { clients, contacts };
}

function saveClients(clients) { localStorage.setItem('alvid_crm_clients', JSON.stringify(clients)); }
function saveContacts(contacts) { localStorage.setItem('alvid_crm_contacts', JSON.stringify(contacts)); }
function saveReminders(reminders) { localStorage.setItem('alvid_crm_reminders', JSON.stringify(reminders)); }
function saveTasks(tasks) { localStorage.setItem('alvid_crm_tasks', JSON.stringify(tasks)); }
function saveTaskColumns(cols) { localStorage.setItem('alvid_crm_task_columns', JSON.stringify(cols)); }

function exportDatabase() {
  const data = {
    clients: JSON.parse(localStorage.getItem('alvid_crm_clients') || '[]'),
    contacts: JSON.parse(localStorage.getItem('alvid_crm_contacts') || '[]'),
    reminders: JSON.parse(localStorage.getItem('alvid_crm_reminders') || '[]'),
    tasks: JSON.parse(localStorage.getItem('alvid_crm_tasks') || '[]'),
    taskColumns: JSON.parse(localStorage.getItem('alvid_crm_task_columns') || '[]'),
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alvid_crm_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importDatabase(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (confirm(`Импортировать данные из файла? Текущие данные будут заменены.`)) {
        if (data.clients) localStorage.setItem('alvid_crm_clients', JSON.stringify(data.clients));
        if (data.contacts) localStorage.setItem('alvid_crm_contacts', JSON.stringify(data.contacts));
        if (data.reminders) localStorage.setItem('alvid_crm_reminders', JSON.stringify(data.reminders));
        if (data.tasks) localStorage.setItem('alvid_crm_tasks', JSON.stringify(data.tasks));
        if (data.taskColumns) localStorage.setItem('alvid_crm_task_columns', JSON.stringify(data.taskColumns));
        alert('Данные успешно импортированы! Страница будет перезагружена.');
        location.reload();
      }
    } catch (err) { alert('Ошибка чтения файла: ' + err.message); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function exportContactsToExcel() {
  const contacts = JSON.parse(localStorage.getItem('alvid_crm_contacts') || '[]');
  let csv = '\uFEFFName;Position;Department;Number\n';
  contacts.forEach(c => {
    csv += `${c.name};${c.position || ''};${c.department || ''};${c.number}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contacts_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function importContactsFromExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      const lines = text.split('\n').slice(1);
      const newContacts = [];
      let maxId = contacts.reduce((m, c) => Math.max(m, c.id || 0), 0);
      
      lines.forEach(line => {
        if (!line.trim()) return;
        const parts = line.split(';');
        if (parts.length >= 3) {
          maxId++;
          newContacts.push({
            id: maxId,
            type: currentContactsSubsection,
            name: parts[0].trim(),
            position: parts[1] ? parts[1].trim() : '',
            department: parts[2] ? parts[2].trim() : '',
            number: parts[3] ? parts[3].trim() : ''
          });
        }
      });
      
      contacts = [...contacts, ...newContacts];
      saveContacts(contacts);
      renderContactsList();
      alert(`Импортировано ${newContacts.length} контактов`);
    } catch (err) {
      alert('Ошибка импорта: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function fetchCurrencyRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data.result === 'success') {
      const usd = data.rates.RUB;
      const eur = data.rates.RUB / data.rates.EUR;
      document.getElementById('usdRate').textContent = usd.toFixed(2) + ' ₽';
      document.getElementById('eurRate').textContent = eur.toFixed(2) + ' ₽';
    }
  } catch (e) {
    console.log('Не удалось загрузить курсы валют');
  }
}