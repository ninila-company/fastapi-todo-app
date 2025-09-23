export const nodes = {
    urgentList: document.getElementById('urgent-list'),
    importantList: document.getElementById('important-list'),
    normalList: document.getElementById('normal-list'),
    todoForm: document.getElementById('todo-form'),
    todoTitleInput: document.getElementById('todo-title'),
    editModal: document.getElementById('edit-modal'),
    editForm: document.getElementById('edit-form'),
    editTitleInput: document.getElementById('edit-title'),
    editIdInput: document.getElementById('edit-id'),
    helpModal: document.getElementById('help-modal'),
    dateTimeDisplay: document.getElementById('datetime-display'),
    modeIndicator: document.getElementById('mode-indicator'),
};

export const columns = [nodes.urgentList, nodes.importantList, nodes.normalList];

// Отрисовать список задач
export const renderTodos = (todos, state) => {
    nodes.urgentList.innerHTML = '';
    nodes.importantList.innerHTML = '';
    nodes.normalList.innerHTML = '';

    todos.sort((a, b) => a.id - b.id);

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="pixel-box" style="width: 100%; display: flex; align-items: center; justify-content: space-between;">
                <span class="${todo.completed ? 'completed' : ''}" style="flex-grow: 1;">${todo.title}</span>
                <div class="actions">
                    <button data-id="${todo.id}" class="edit" title="Редактировать">E</button>
                    <button data-id="${todo.id}" class="toggle" title="${todo.completed ? 'Вернуть' : 'Завершить'}">
                        ${todo.completed ? 'R' : 'V'}
                    </button>
                    <button data-id="${todo.id}" class="delete" title="Удалить">D</button>
                </div>
            </div>
        `;
        if (todo.urgency === 1) {
            nodes.urgentList.appendChild(li);
        } else if (todo.urgency === 2) {
            nodes.importantList.appendChild(li);
        } else {
            nodes.normalList.appendChild(li);
        }
    });
    updateFocus(null, null, state.focusedColumnIndex, state.focusedTaskIndex);
};

export const setMode = (newMode) => {
    if (newMode === 'insert') {
        nodes.modeIndicator.textContent = '-- INSERT --';
    } else if (newMode.startsWith(':')) {
        nodes.modeIndicator.textContent = newMode;
    }
    else {
        nodes.modeIndicator.textContent = '-- NORMAL --';
    }
};

export const updateFocus = (oldColIdx, oldTaskIdx, newColIdx, newTaskIdx) => {
    if (oldColIdx !== null && oldTaskIdx !== null) {
        const oldColumn = columns[oldColIdx];
        if (oldColumn && oldColumn.children[oldTaskIdx]) {
            oldColumn.children[oldTaskIdx].querySelector('.pixel-box').classList.remove('focused');
        }
    }

    if (newColIdx !== null && newTaskIdx !== null) {
        const newColumn = columns[newColIdx];
        if (newColumn && newColumn.children[newTaskIdx]) {
            const focusedElement = newColumn.children[newTaskIdx].querySelector('.pixel-box');
            focusedElement.classList.add('focused');
            focusedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }
};

export const updateModalFocus = (modalNavigables, oldIndex, newIndex) => {
    if (oldIndex !== null) {
        const oldElement = modalNavigables[oldIndex];
        if (oldElement.tagName === 'BUTTON') {
            oldElement.classList.remove('focused');
        }
    }

    const newElement = modalNavigables[newIndex];
    newElement.focus();
    if (newElement.tagName === 'BUTTON') {
        newElement.classList.add('focused');
    }
};

export const openEditModal = (todo, vimState) => {
    nodes.editTitleInput.value = todo.title;
    nodes.editForm.querySelector(`input[name="edit-urgency"][value="${todo.urgency}"]`).checked = true;
    nodes.editIdInput.value = todo.id;
    nodes.editModal.style.display = 'flex';
    nodes.editTitleInput.focus();

    vimState.modalNavigables = [
        nodes.editTitleInput,
        ...nodes.editForm.querySelectorAll('input[name="edit-urgency"]'),
    ];
    updateModalFocus(vimState.modalNavigables, null, 0);
    vimState.modalFocusIndex = 0;
};

export const updateDateTime = () => {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU');
    nodes.dateTimeDisplay.textContent = `${date} ${time}`;
};
