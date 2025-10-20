// Minimal todo app with add/edit/delete/complete/filter/reorder + persistence

const STORAGE_KEY = 'todo.tasks.v1';
const taskInput = document.getElementById('taskInput');
const addForm = document.getElementById('addForm');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('taskList');
const countEl = document.getElementById('count');
const emptyMessage = document.getElementById('emptyMessage');
const filters = document.querySelectorAll('.filters button');
const clearCompletedBtn = document.getElementById('clearCompleted');

let tasks = loadTasks();
let currentFilter = 'all';
let dragSrcId = null;

function loadTasks(){
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
}
function saveTasks(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function addTask(text){
    const t = { id: uid(), text: text.trim(), completed: false };
    tasks.unshift(t); // newest at top
    saveTasks();
    render();
}

function updateTask(id, patch){
    const i = tasks.findIndex(t => t.id === id);
    if (i > -1) {
        tasks[i] = { ...tasks[i], ...patch };
        saveTasks();
        render();
    }
}

function removeTask(id){
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    render();
}

function clearCompleted(){
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    render();
}

function reorderTasks(fromId, toId){
    const fromIndex = tasks.findIndex(t => t.id === fromId);
    const toIndex = tasks.findIndex(t => t.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [item] = tasks.splice(fromIndex,1);
    tasks.splice(toIndex, 0, item);
    saveTasks();
}

function filteredTasks(){
    if (currentFilter === 'active') return tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
}

function render(){
    const items = filteredTasks();
    list.innerHTML = '';
    emptyMessage.hidden = tasks.length !== 0;

    for (const t of items){
        const li = document.createElement('li');
        li.className = 'task';
        li.setAttribute('data-id', t.id);
        li.setAttribute('draggable', 'true');
        li.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">☰</div>
            <div class="checkbox ${t.completed ? 'checked' : ''}" aria-hidden="true">${t.completed ? '✓' : ''}</div>
            <div class="label ${t.completed ? 'completed' : ''}" aria-label="Task">${escapeHtml(t.text)}</div>
            <div class="actions" aria-hidden="true">
                <button class="edit secondary">Edit</button>
                <button class="delete secondary" style="border-color: #fde2e2; color: var(--danger)">Delete</button>
            </div>
        `;

        // event bindings
        const checkbox = li.querySelector('.checkbox');
        const label = li.querySelector('.label');
        const editBtn = li.querySelector('.edit');
        const delBtn = li.querySelector('.delete');

        checkbox.addEventListener('click', () => updateTask(t.id, { completed: !t.completed }));
        delBtn.addEventListener('click', () => {
            if (confirm('Delete task?')) removeTask(t.id);
        });

        editBtn.addEventListener('click', () => startEdit(li, t));
        label.addEventListener('dblclick', () => startEdit(li, t));

        // drag events (on li)
        li.addEventListener('dragstart', (e) => {
            dragSrcId = t.id;
            li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        li.addEventListener('dragend', () => {
            dragSrcId = null;
            li.classList.remove('dragging');
        });
        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        li.addEventListener('drop', (e) => {
            e.preventDefault();
            const toId = t.id;
            if (dragSrcId && dragSrcId !== toId) {
                reorderTasks(dragSrcId, toId);
                render();
            }
        });

        list.appendChild(li);
    }

    countEl.textContent = `${tasks.filter(t => !t.completed).length} incomplete, ${tasks.length} total`;
}

function startEdit(li, task){
    // show input inside li
    li.innerHTML = `
        <div style="width:16px"></div>
        <div style="width:18px"></div>
        <input class="edit-input" value="${escapeAttr(task.text)}" />
        <div class="actions">
            <button class="save">Save</button>
            <button class="cancel secondary">Cancel</button>
        </div>
    `;
    const input = li.querySelector('.edit-input');
    const saveBtn = li.querySelector('.save');
    const cancelBtn = li.querySelector('.cancel');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    saveBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) {
            alert('Task text cannot be empty.');
            input.focus();
            return;
        }
        updateTask(task.id, { text: val });
    });
    cancelBtn.addEventListener('click', () => render());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    });
}

// helpers to avoid injection
function escapeHtml(s){
    const t = document.createElement('div');
    t.textContent = s;
    return t.innerHTML;
}
function escapeAttr(s){
    return s.replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// events
addForm.addEventListener('submit', (e) => {
    const val = taskInput.value.trim();
    if (!val) return;
    addTask(val);
    taskInput.value = '';
    taskInput.focus();
});

addBtn.addEventListener('click', () => addForm.dispatchEvent(new Event('submit', { cancelable: true })));

filters.forEach(btn => {
    btn.addEventListener('click', () => {
        filters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        render();
    });
});

clearCompletedBtn.addEventListener('click', () => {
    if (tasks.some(t => t.completed)) {
        if (confirm('Remove all completed tasks?')) clearCompleted();
    } else {
        alert('No completed tasks to clear.');
    }
});

// initial render
render();

// keyboard shortcuts: Ctrl+N focus input, Delete key to clear completed when focus is not inside input
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        taskInput.focus();
        e.preventDefault();
    }
    if (e.key === 'Delete' && document.activeElement.tagName !== 'INPUT' && confirm('Clear completed tasks?')) {
        clearCompleted();
    }
});