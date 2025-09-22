const API_URL = '/todos';

// Вспомогательная функция для обработки ответов от fetch
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || `Ошибка сети: ${response.status}`;
        throw new Error(message);
    }
    return response.status === 204 ? null : response.json();
};

// Получить все задачи
export const fetchTodos = () => fetch(API_URL).then(handleResponse);

// Получить задачу по ID
export const fetchTodoById = (id) => fetch(`${API_URL}/${id}`).then(handleResponse);

// Создать задачу
export const createTodo = (todo) => {
    return fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
    }).then(handleResponse);
};

// Обновить задачу
export const updateTodo = (id, updatedTodo) => {
    return fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTodo)
    }).then(handleResponse);
};

// Удалить задачу
export const deleteTodo = (id) => {
    return fetch(`${API_URL}/${id}`, { method: 'DELETE' }).then(handleResponse);
};

// Переключить статус выполнения
export const toggleTodo = async (id) => {
    const todo = await fetchTodoById(id);
    const updatedTodo = { ...todo, completed: !todo.completed };
    return updateTodo(id, updatedTodo);
};
