import * as api from './api.js';
import { nodes, columns, updateFocus, updateModalFocus, openEditModal, setMode as setUIMode } from '../js/ui.js';

export const vimState = {
    mode: 'normal',
    focusedColumnIndex: 0,
    focusedTaskIndex: 0,
    modalNavigables: [],
    modalFocusIndex: 0,
    deleteTimeout: null,
    commandBuffer: '',
};

const setMode = (newMode) => {
    vimState.mode = newMode;
    setUIMode(newMode);
};

export function handleModalKeyDown(e) {
    const oldIndex = vimState.modalFocusIndex;
    let newIndex = oldIndex;

    switch (e.key) {
        case 'k': e.preventDefault(); if (newIndex > 0) newIndex--; break;
        case 'j': e.preventDefault(); if (newIndex < vimState.modalNavigables.length - 1) newIndex++; break;
        case 'h':
        case 'l':
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement.type === 'radio' && activeElement.name === 'edit-urgency') {
                const urgencyRadios = Array.from(nodes.editForm.querySelectorAll('input[name="edit-urgency"]'));
                const currentIndex = urgencyRadios.indexOf(activeElement);

                if (e.key === 'l' && currentIndex < urgencyRadios.length - 1) {
                    const nextRadio = urgencyRadios[currentIndex + 1];
                    nextRadio.focus();
                    nextRadio.checked = true;
                    newIndex = vimState.modalNavigables.indexOf(nextRadio);
                } else if (e.key === 'h' && currentIndex > 0) {
                    const prevRadio = urgencyRadios[currentIndex - 1];
                    prevRadio.focus();
                    prevRadio.checked = true;
                    newIndex = vimState.modalNavigables.indexOf(prevRadio);
                }
            }
            break;
        case 'Enter':
            e.preventDefault();
            nodes.editForm.requestSubmit();
            break;
        default:
            if (document.activeElement.type === 'radio') return;
            break;
    }

    if (newIndex !== oldIndex) {
        updateModalFocus(vimState.modalNavigables, oldIndex, newIndex);
        vimState.modalFocusIndex = newIndex;
    }
};

export function handleMainKeyDown(e, loadTodos) {
    const oldCol = vimState.focusedColumnIndex;
    const oldTask = vimState.focusedTaskIndex;
    let newCol = oldCol;
    let newTask = oldTask;

    if (vimState.commandBuffer.startsWith(':')) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (vimState.commandBuffer === ':help') {
                nodes.helpModal.style.display = 'flex';
            }
            vimState.commandBuffer = '';
            setUIMode('normal');
        } else if (e.key === 'Escape') {
            e.preventDefault();
            vimState.commandBuffer = '';
            setUIMode('normal');
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            vimState.commandBuffer = vimState.commandBuffer.slice(0, -1);
            if (vimState.commandBuffer === '') {
                setUIMode('normal');
            } else {
                setUIMode(vimState.commandBuffer);
            }
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            vimState.commandBuffer += e.key;
            setUIMode(vimState.commandBuffer);
        }
        return;
    }

    if (e.key !== 'd' && vimState.deleteTimeout) {
        clearTimeout(vimState.deleteTimeout);
        vimState.deleteTimeout = null;
    }

    switch (e.key) {
        case 'j':
            e.preventDefault();
            const tasksInCurrentCol = columns[newCol].children.length;
            if (newTask < tasksInCurrentCol - 1) newTask++;
            break;
        case 'k':
            e.preventDefault();
            if (newTask > 0) newTask--;
            break;
        case 'l':
            e.preventDefault();
            for (let i = newCol + 1; i < columns.length; i++) {
                if (columns[i].children.length > 0) {
                    newCol = i;
                    newTask = 0;
                    break;
                }
            }
            break;
        case 'h':
            e.preventDefault();
            for (let i = newCol - 1; i >= 0; i--) {
                if (columns[i].children.length > 0) {
                    newCol = i;
                    newTask = 0;
                    break;
                }
            }
            break;
        case 'i':
            e.preventDefault();
            setMode('insert');
            nodes.todoTitleInput.focus();
            updateFocus(vimState.focusedColumnIndex, vimState.focusedTaskIndex, null, null);
            break;
        case 'e':
        case 'Enter':
            e.preventDefault();
            const focusedTaskElement = columns[vimState.focusedColumnIndex]?.children[vimState.focusedTaskIndex];
            if (focusedTaskElement) {
                const editButton = focusedTaskElement.querySelector('.edit');
                if (editButton) {
                    api.fetchTodoById(editButton.dataset.id)
                        .then(todo => openEditModal(todo, vimState))
                        .catch(error => alert(`Не удалось открыть редактор: ${error.message}`));
                }
            }
            break;
        case 'v':
            e.preventDefault();
            const toggleTaskElement = columns[vimState.focusedColumnIndex]?.children[vimState.focusedTaskIndex];
            if (toggleTaskElement) {
                const toggleButton = toggleTaskElement.querySelector('.toggle');
                if (toggleButton) {
                    toggleButton.click();
                }
            }
            break;
        case 'd':
            e.preventDefault();
            if (vimState.deleteTimeout) {
                clearTimeout(vimState.deleteTimeout);
                vimState.deleteTimeout = null;
                const deleteTaskElement = columns[vimState.focusedColumnIndex]?.children[vimState.focusedTaskIndex];
                if (deleteTaskElement) {
                    const deleteButton = deleteTaskElement.querySelector('.delete');
                    if (deleteButton) {
                        deleteButton.click();
                    }
                }
            } else {
                vimState.deleteTimeout = setTimeout(() => { vimState.deleteTimeout = null; }, 500);
            }
            break;
        case ':':
            e.preventDefault();
            vimState.commandBuffer = ':';
            setUIMode(':');
            break;
    }

    if (newCol !== oldCol || newTask !== oldTask) {
        if (columns[newCol] && columns[newCol].children.length > 0) {
            vimState.focusedColumnIndex = newCol;
            vimState.focusedTaskIndex = Math.min(newTask, columns[newCol].children.length - 1);
            updateFocus(oldCol, oldTask, vimState.focusedColumnIndex, vimState.focusedTaskIndex);
        }
    }
};

export function handleInsertModeKeyDown(e) {
    if (e.key === 'Enter') {
        nodes.todoForm.requestSubmit();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        setMode('normal');
        nodes.todoTitleInput.blur();
        updateFocus(null, null, vimState.focusedColumnIndex, vimState.focusedTaskIndex);
    }

    const activeElement = document.activeElement;
    if (activeElement.type === 'radio' && activeElement.name === 'todo-urgency') {
        const urgencyRadios = Array.from(nodes.todoForm.querySelectorAll('input[name="todo-urgency"]'));
        const currentIndex = urgencyRadios.indexOf(activeElement);

        if (e.key === 'l') {
            e.preventDefault();
            if (currentIndex < urgencyRadios.length - 1) {
                const nextRadio = urgencyRadios[currentIndex + 1];
                nextRadio.focus();
                nextRadio.checked = true;
            }
        } else if (e.key === 'h') {
            e.preventDefault();
            if (currentIndex > 0) {
                const prevRadio = urgencyRadios[currentIndex - 1];
                prevRadio.focus();
                prevRadio.checked = true;
            }
        }
    }
};

export function handleGlobalKeyDown(e, loadTodos) {
    if (nodes.helpModal.style.display === 'flex') {
        if (e.key === 'Escape') {
            e.preventDefault();
            nodes.helpModal.style.display = 'none';
        }
        return;
    }

    if (nodes.editModal.style.display === 'flex') {
        if (e.key === 'Escape') {
            e.preventDefault();
            nodes.editModal.style.display = 'none';
            return;
        }
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' && activeElement.type !== 'radio' && e.key !== 'Enter' && e.key !== 'Escape') {
            return;
        }
        handleModalKeyDown(e);
        return;
    }

    if (vimState.mode === 'insert') {
        handleInsertModeKeyDown(e);
    } else {
        handleMainKeyDown(e, loadTodos);
    }
}
