import * as api from './api.js';
import { nodes, renderTodos, setMode, updateFocus, openEditModal, updateDateTime } from './ui.js';
import { vimState, handleGlobalKeyDown } from './vim.js';

const loadTodos = async () => {
    try {
        const todos = await api.fetchTodos();
        renderTodos(todos, vimState);
    } catch (error) {
        alert(`Не удалось загрузить задачи: ${error.message}`);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Инициализация ---
    loadTodos();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    updateFocus(null, null, vimState.focusedColumnIndex, vimState.focusedTaskIndex);

    // --- Обработчики событий ---

    // Создание новой задачи
    nodes.todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = nodes.todoTitleInput.value.trim();
        if (!title) return;

        const newTodo = {
            title: title,
            urgency: parseInt(nodes.todoForm.querySelector('input[name="todo-urgency"]:checked').value, 10)
        };

        try {
            await api.createTodo(newTodo);
            nodes.todoTitleInput.value = '';
            vimState.mode = 'normal';
            setMode('normal');
            nodes.todoTitleInput.blur();
            await loadTodos();
            updateFocus(null, null, vimState.focusedColumnIndex, vimState.focusedTaskIndex);
        } catch (error) {
            alert(`Ошибка при создании задачи: ${error.message}`);
        }
    });

    // Делегирование событий для кнопок (удаление, редактирование, выполнение)
    document.querySelector('.columns-container').addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;
        if (!id) return;

        try {
            if (target.classList.contains('delete')) {
                // Оптимистичное удаление: сначала убираем из DOM
                target.closest('.task-card').remove();
                await api.deleteTodo(id);
                // Полная перезагрузка больше не нужна
                // await loadTodos();
            } else if (target.classList.contains('edit')) {
                const todo = await api.fetchTodoById(id);
                openEditModal(todo, vimState);
            } else if (target.classList.contains('toggle')) {
                await api.toggleTodo(id);
                await loadTodos();
            }
        } catch (error) {
            alert(`Произошла ошибка: ${error.message}`);
        }
    });

    // Сохранение из модального окна
    nodes.editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = nodes.editIdInput.value;
        const newTitle = nodes.editTitleInput.value.trim();
        const newUrgency = parseInt(nodes.editForm.querySelector('input[name="edit-urgency"]:checked').value, 10);

        if (!newTitle) return;

        try {
            const todo = await api.fetchTodoById(id);
            const updatedTodo = { ...todo, title: newTitle, urgency: newUrgency };
            await api.updateTodo(id, updatedTodo);
            nodes.editModal.style.display = 'none';
            await loadTodos();
        } catch (error) {
            alert(`Ошибка при обновлении задачи: ${error.message}`);
        }
    });

    // Глобальный обработчик нажатий клавиш
    document.addEventListener('keydown', (e) => handleGlobalKeyDown(e, loadTodos));
});
