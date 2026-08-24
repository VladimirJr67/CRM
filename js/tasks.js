let tasks = [];
let taskColumns = [];

const DEFAULT_COLUMNS = [
  { id: 'new', name: 'Новые', color: '#3b82f6' },
  { id: 'in_progress', name: 'В работе', color: '#f59e0b' },
  { id: 'review', name: 'На проверке', color: '#8b5cf6' },
  { id: 'completed', name: 'Завершены', color: '#10b981' }
];

const TASK_PRIORITIES = [
  { name: 'Низкий', value: 'low', color: '#6b7280' },
  { name: 'Средний', value: 'medium', color: '#d97706' },
  { name: 'Высокий', value: 'high', color: '#dc2626' },
  { name: 'Критический', value: 'critical', color: '#7c3aed' }
];

function loadTasks() {
  tasks = JSON.parse(localStorage.getItem('alvid_crm_tasks') || '[]');
  const savedCols = localStorage.getItem('alvid_crm_task_columns');
  if (savedCols) taskColumns = JSON.parse(savedCols);
  else { taskColumns = DEFAULT_COLUMNS.map((c, i) => ({ ...c, order: i })); saveTaskColumns(taskColumns); }
}

function renderTasks() {
  const main = document.getElementById('mainContent');
  const sortedColumns = [...taskColumns].sort((a, b) => a.order - b.order);
  
  main.innerHTML = `
    <div style="padding:20px;height:100vh;display:flex;flex-direction:column;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-shrink:0;">
        <h1 style="font-size:22px;font-weight:600;color:#1a3a5c;">Задачи</h1>
        <button class="btn" onclick="openTaskModal()">Новая задача</button>
      </div>
      <div class="kanban-board" id="kanbanBoard">
        ${sortedColumns.map(col => renderTaskColumn(col)).join('')}
        <div class="add-column-box" onclick="addTaskColumn()">
          <div style="text-align:center;"><div style="font-size:24px;margin-bottom:5px;">+</div><div>Добавить тип задач</div></div>
        </div>
      </div>
    </div>
  `;
  
  // Add scroll indicators
  const board = document.getElementById('kanbanBoard');
  if (board) {
    board.addEventListener('scroll', () => {
      if (board.scrollLeft > 0) board.style.boxShadow = 'inset 10px 0 10px -10px rgba(0,0,0,0.1)';
      else board.style.boxShadow = 'none';
    });
  }
}

function renderTaskColumn(col) {
  const colTasks = tasks.filter(t => t.status === col.id);
  const isDefault = DEFAULT_COLUMNS.find(dc => dc.id === col.id);
  
  return `
    <div class="kanban-column" draggable="true" ondragstart="handleColumnDragStart(event, '${col.id}')" ondragover="handleColumnDragOver(event)" ondrop="handleColumnDrop(event, '${col.id}')">
      <div class="kanban-column-header">
        <div style="width:4px;height:20px;border-radius:2px;background:${col.color};flex-shrink:0;"></div>
        <div style="flex:1;font-weight:600;font-size:14px;color:#1a3a5c;">${escapeHtml(col.name)}</div>
        <div style="background:#e5e7eb;color:#6b7280;font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;">${colTasks.length}</div>
        <button onclick="quickAddTask('${col.id}')" style="background:none;border:none;cursor:pointer;font-size:18px;color:#9ca3af;padding:0 4px;" title="Быстрое добавление">+</button>
        ${!isDefault ? `<button onclick="deleteTaskColumn('${col.id}')" style="background:none;border:none;cursor:pointer;font-size:14px;color:#ef4444;" title="Удалить тип">×</button>` : ''}
      </div>
      <div class="kanban-column-body">
        ${colTasks.map(t => renderTaskCard(t)).join('')}
      </div>
    </div>
  `;
}

function renderTaskCard(task) {
  const priority = TASK_PRIORITIES.find(p => p.value === task.priority) || TASK_PRIORITIES[1];
  const isOverdue = task.deadline && new Date(task.deadline + 'T23:59:59') < new Date() && task.status !== 'completed';
  const assignees = (task.assignees || []).map(a => {
    if (a.type === 'me') return { name: 'Admin', initials: 'A' };
    const contact = contacts.find(c => c.id === a.id);
    if (contact) { const parts = contact.name.split(' '); return { name: contact.name, initials: (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase().substring(0,2) }; }
    return null;
  }).filter(Boolean);
  const client = task.clientId ? clients.find(c => c.id === task.clientId) : null;

  return `
    <div class="task-card" style="border-left-color: ${priority.color};" onclick="openTaskModal(tasks.find(t=>t.id===${task.id}))">
      <div class="task-card-header">
        <div class="task-card-title">${escapeHtml(task.title)}</div>
        <button class="task-card-delete" onclick="event.stopPropagation(); deleteTask(${task.id})" title="Удалить">×</button>
      </div>
      ${task.description ? `<div style="font-size:11px;color:#6b7280;margin-bottom:8px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(task.description)}</div>` : ''}
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:11px;">
        ${task.deadline ? `<span style="color:${isOverdue ? '#ef4444' : '#6b7280'};font-weight:${isOverdue ? '600' : '400'};">${formatDate(task.deadline)}</span>` : ''}
        ${client ? `<span style="color:#3b82f6;">${escapeHtml(client.orgName)}</span>` : ''}
      </div>
      <div style="display:flex;gap:4px;">
        ${assignees.slice(0, 3).map(a => `<div style="width:22px;height:22px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;" title="${escapeHtml(a.name)}">${a.initials}</div>`).join('')}
      </div>
    </div>
  `;
}

// Column drag and drop
let draggedColumnId = null;

function handleColumnDragStart(e, colId) {
  draggedColumnId = colId;
  e.dataTransfer.effectAllowed = 'move';
}

function handleColumnDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleColumnDrop(e, targetColId) {
  e.preventDefault();
  if (!draggedColumnId || draggedColumnId === targetColId) return;
  
  const draggedCol = taskColumns.find(c => c.id === draggedColumnId);
  const targetCol = taskColumns.find(c => c.id === targetColId);
  
  if (!draggedCol || !targetCol) return;
  
  // Swap orders
  const tempOrder = draggedCol.order;
  draggedCol.order = targetCol.order;
  targetCol.order = tempOrder;
  
  saveTaskColumns(taskColumns);
  renderTasks();
  draggedColumnId = null;
}

function addTaskColumn() {
  const name = prompt('Название нового типа задач:');
  if (!name || !name.trim()) return;
  const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
  const color = colors[taskColumns.length % colors.length];
  const maxOrder = taskColumns.reduce((m, c) => Math.max(m, c.order), 0);
  taskColumns.push({ id: 'col_' + Date.now(), name: name.trim(), color: color, order: maxOrder + 1 });
  saveTaskColumns(taskColumns);
  renderTasks();
}

function deleteTaskColumn(colId) {
  const colTasks = tasks.filter(t => t.status === colId);
  if (colTasks.length > 0) { if (!confirm(`В колонке ${colTasks.length} задач. Переместить их в "Новые"?`)) return; colTasks.forEach(t => t.status = 'new'); saveTasks(tasks); }
  taskColumns = taskColumns.filter(c => c.id !== colId);
  saveTaskColumns(taskColumns);
  renderTasks();
}

function quickAddTask(columnId) { openTaskModal(null, null, columnId); }

function openTaskModal(task = null, clientId = null, defaultColumn = null, fromClientCard = false) {
  document.getElementById('taskModalTitle').textContent = task ? 'Редактировать задачу' : 'Новая задача';
  document.getElementById('taskId').value = task?.id || '';
  document.getElementById('taskTitle').value = task?.title || '';
  document.getElementById('taskDescription').value = task?.description || '';
  document.getElementById('taskDeadline').value = task?.deadline || '';
  
  const cid = task?.clientId || clientId;
  document.getElementById('taskClientId').value = cid || '';
  
  const prioritySelect = document.getElementById('taskPriority');
  prioritySelect.innerHTML = TASK_PRIORITIES.map(p => `<option value="${p.value}" ${task?.priority === p.value ? 'selected' : ''}>${p.name}</option>`).join('');
  
  const columnSelect = document.getElementById('taskColumn');
  const sortedCols = [...taskColumns].sort((a, b) => a.order - b.order);
  columnSelect.innerHTML = sortedCols.map(c => `<option value="${c.id}" ${task?.status === c.id || (!task && defaultColumn === c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  
  const meCheckbox = document.getElementById('taskAssignMe');
  const assigneesSelect = document.getElementById('taskAssignees');
  const hasMe = task?.assignees?.some(a => a.type === 'me');
  meCheckbox.checked = hasMe || false;
  assigneesSelect.innerHTML = contacts.map(c => {
    const isSelected = task?.assignees?.some(a => a.type === 'contact' && a.id === c.id);
    return `<option value="${c.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(c.name)} (${escapeHtml(c.department || '')})</option>`;
  }).join('');
  
  const clientRow = document.getElementById('taskClientRow');
  const clientSelect = document.getElementById('taskClientSelect');
  
  if (fromClientCard) {
    clientRow.style.display = 'none';
    clientSelect.value = cid || '';
  } else {
    clientRow.style.display = 'block';
    clientSelect.innerHTML = '<option value="">— Не выбран —</option>' + clients.map(c => `<option value="${c.id}" ${cid == c.id ? 'selected' : ''}>${escapeHtml(c.orgName)}</option>`).join('');
  }
  
  onTaskClientChange();
  document.getElementById('taskModal').classList.add('active');
}

function saveTask(e) {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const clientIdVal = document.getElementById('taskClientId').value;
  const assignees = [];
  if (document.getElementById('taskAssignMe').checked) assignees.push({ type: 'me' });
  Array.from(document.getElementById('taskAssignees').selectedOptions).forEach(opt => { assignees.push({ type: 'contact', id: parseInt(opt.value) }); });
  
  const data = {
    title: document.getElementById('taskTitle').value.trim(),
    description: document.getElementById('taskDescription').value.trim(),
    deadline: document.getElementById('taskDeadline').value,
    priority: document.getElementById('taskPriority').value,
    status: document.getElementById('taskColumn').value,
    assignees: assignees,
    clientId: clientIdVal ? parseInt(clientIdVal) : null
  };

  if (id) { const idx = tasks.findIndex(t => t.id === parseInt(id)); if (idx !== -1) tasks[idx] = { ...tasks[idx], ...data }; }
  else { const maxId = tasks.reduce((m, t) => Math.max(m, t.id || 0), 0); data.id = maxId + 1; data.createdAt = new Date().toISOString(); tasks.push(data); }
  
  saveTasks(tasks);
  closeModal('taskModal');
  renderTasks();
}

function deleteTask(id) {
  if (!confirm('Удалить задачу?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === today.toISOString().split('T')[0]) return 'Завтра';
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Завтра';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}