document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoTitleInput = document.getElementById('todo-title');

    // Списки задач
    const urgentList = document.getElementById('urgent-list');
    const importantList = document.getElementById('important-list');
    const normalList = document.getElementById('normal-list');

    // Элементы модального окна
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const editTitleInput = document.getElementById('edit-title');
    const editIdInput = document.getElementById('edit-id');

    // --- Состояние для Vim-навигации ---
    let mode = 'normal'; // 'normal' или 'insert'
    let focusedColumnIndex = 0;
    let focusedTaskIndex = 0;
    const columns = [urgentList, importantList, normalList];
    // Элементы для навигации в модальном окне
    let modalNavigables = [];
    let modalFocusIndex = 0;
    let deleteTimeout = null; // Таймер для команды 'dd'


    const API_URL = '/todos';

    // --- Функции для работы с API ---

    // Вспомогательная функция для обработки ответов от fetch
    const handleResponse = async (response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // FastAPI возвращает ошибки в формате { "detail": "сообщение" }
            const message = errorData.detail || `Ошибка сети: ${response.status}`;
            throw new Error(message);
        }
        // Для DELETE запросов (статус 204) тело ответа пустое
        return response.status === 204 ? null : response.json();
    };

    // Получить все задачи
    const fetchTodos = async () => {
        try {
            const todos = await fetch(API_URL).then(handleResponse);
            renderTodos(todos);
        } catch (error) {
            alert(`Не удалось загрузить задачи: ${error.message}`);
        }
    };

    // Отрисовать список задач
    const renderTodos = (todos) => {
        // Очищаем все списки
        urgentList.innerHTML = '';
        importantList.innerHTML = '';
        normalList.innerHTML = '';

        // Сортируем задачи по ID для стабильного порядка
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
            // Распределяем по колонкам
            if (todo.urgency === 1) {
                urgentList.appendChild(li);
            } else if (todo.urgency === 2) {
                importantList.appendChild(li);
            } else {
                normalList.appendChild(li);
            }
        });
        // После отрисовки устанавливаем начальный фокус
        updateFocus(null, null, focusedColumnIndex, focusedTaskIndex);
    };

    // --- Обработчики событий ---

    // Создание новой задачи
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = todoTitleInput.value.trim();
        if (!title) return;

        const newTodo = {
            title: title,
            // Получаем значение из отмеченной радио-кнопки
            urgency: parseInt(todoForm.querySelector('input[name="todo-urgency"]:checked').value, 10)
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTodo)
            }).then(handleResponse);

            todoTitleInput.value = '';
            // Возвращаемся в нормальный режим после создания задачи
            setMode('normal');
            todoTitleInput.blur();
            updateFocus(null, null, focusedColumnIndex, focusedTaskIndex);
            fetchTodos();
        } catch (error) {
            alert(`Ошибка при создании задачи: ${error.message}`);
        }
    });

    // Функция для открытия модального окна редактирования
    const openEditModal = async (id) => {
        try {
            const todo = await fetch(`${API_URL}/${id}`).then(handleResponse);
            editTitleInput.value = todo.title;
            editForm.querySelector(`input[name="edit-urgency"][value="${todo.urgency}"]`).checked = true;
            editIdInput.value = todo.id;
            editModal.style.display = 'flex';
            editTitleInput.focus(); // Сразу ставим фокус на поле ввода

            // Инициализируем навигацию в модальном окне
            modalNavigables = [
                editTitleInput,
                ...editForm.querySelectorAll('input[name="edit-urgency"]'),
            ];
            updateModalFocus(null, 0);
        } catch (error) {
            alert(`Не удалось открыть редактор: ${error.message}`);
        }
    };

    // Используем делегирование событий на общем контейнере
    document.querySelector('.columns-container').addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;

        if (!id) return; // Кликнули не по кнопке

        try {
            if (target.classList.contains('delete')) {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' }).then(handleResponse);
                fetchTodos();
            }

            if (target.classList.contains('edit')) {
                await openEditModal(id);
            }

            if (target.classList.contains('toggle')) {
                // Сначала получаем текущее состояние задачи
                const todo = await fetch(`${API_URL}/${id}`).then(handleResponse);

                // Создаем обновленную версию
                const updatedTodo = { ...todo, completed: !todo.completed };

                // Отправляем изменения на сервер
                await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedTodo)
                }).then(handleResponse);

                fetchTodos();
            }
        } catch (error) {
            alert(`Произошла ошибка: ${error.message}`);
        }
    });

    // Функция сохранения изменений из модального окна
    const saveEditedTodo = async () => {
        const id = editIdInput.value;
        const newTitle = editTitleInput.value.trim();
        const newUrgency = parseInt(editForm.querySelector('input[name="edit-urgency"]:checked').value, 10);

        if (!newTitle) return;

        try {
            const todo = await fetch(`${API_URL}/${id}`).then(handleResponse);
            const updatedTodo = { ...todo, title: newTitle, urgency: newUrgency };
            await fetch(`${API_URL}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedTodo) }).then(handleResponse);
        } catch (error) { alert(`Ошибка при обновлении задачи: ${error.message}`); }
    };

    // Обработчик отправки формы редактирования
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEditedTodo();
        editModal.style.display = 'none';
        fetchTodos();
    });

    // Закрытие модального окна по клавише Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.style.display === 'flex') {
            e.preventDefault();
            editModal.style.display = 'none';
        }
    });

    // Первоначальная загрузка задач
    fetchTodos();

    // --- Функция для обновления даты и времени в футере ---
    const dateTimeDisplay = document.getElementById('datetime-display');
    const modeIndicator = document.getElementById('mode-indicator');
    const updateDateTime = () => {
        const now = new Date();
        // Форматируем дату и время под локаль, чтобы было красиво
        const date = now.toLocaleDateString('ru-RU');
        const time = now.toLocaleTimeString('ru-RU');
        dateTimeDisplay.textContent = `${date} ${time}`;
    };

    updateDateTime(); // Вызываем сразу при загрузке
    setInterval(updateDateTime, 1000); // Устанавливаем интервал для обновления каждую секунду

    // --- Vim-навигация ---

    const setMode = (newMode) => {
        mode = newMode;
        if (mode === 'insert') {
            modeIndicator.textContent = '-- INSERT --';
        } else {
            modeIndicator.textContent = '-- NORMAL --';
        }
    };

    const updateFocus = (oldColIdx, oldTaskIdx, newColIdx, newTaskIdx) => {
        // Убираем старый фокус, если он был
        if (oldColIdx !== null && oldTaskIdx !== null) {
            const oldColumn = columns[oldColIdx];
            if (oldColumn && oldColumn.children[oldTaskIdx]) {
                oldColumn.children[oldTaskIdx].querySelector('.pixel-box').classList.remove('focused');
            }
        }

        // Устанавливаем новый фокус
        const newColumn = columns[newColIdx];
        if (newColumn && newColumn.children[newTaskIdx]) {
            const focusedElement = newColumn.children[newTaskIdx].querySelector('.pixel-box');
            focusedElement.classList.add('focused');
            focusedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    };

    const updateModalFocus = (oldIndex, newIndex) => {
        // Снимаем старый фокус
        if (oldIndex !== null) {
            const oldElement = modalNavigables[oldIndex];
            if (oldElement.tagName === 'BUTTON') {
                oldElement.classList.remove('focused');
            }
        }

        // Устанавливаем новый фокус
        const newElement = modalNavigables[newIndex];
        newElement.focus();
        if (newElement.tagName === 'BUTTON') {
            newElement.classList.add('focused');
        }
        modalFocusIndex = newIndex;
    };

    const handleModalKeyDown = (e) => {
        const oldIndex = modalFocusIndex;
        let newIndex = oldIndex;

        switch (e.key) {
            case 'k': // Вверх
                e.preventDefault();
                if (newIndex > 0) newIndex--;
                break;
            case 'j': // Вниз
                e.preventDefault();
                if (newIndex < modalNavigables.length - 1) newIndex++;
                break;
            case 'h': // Влево (для радио-кнопок)
                e.preventDefault();
                if (newIndex >= 2 && newIndex <= 3) newIndex--;
                break;
            case 'l': // Вправо (для радио-кнопок)
                e.preventDefault();
                if (newIndex >= 1 && newIndex <= 2) newIndex++;
                break;
            case 'Enter':
                // Позволяем событию 'submit' формы сработать
                e.preventDefault(); // Предотвращаем стандартное поведение
                editForm.requestSubmit(); // Программно отправляем форму
                break;
        }

        // Сбрасываем команду, если фокус сместился
        if (newIndex !== oldIndex) {
            updateModalFocus(oldIndex, newIndex);
        }
    };

    const handleMainKeyDown = (e) => {
        const oldCol = focusedColumnIndex;
        const oldTask = focusedTaskIndex;
        let newCol = oldCol;
        let newTask = oldTask;

        // Сбрасываем таймер удаления, если нажата любая другая клавиша, кроме 'd'
        if (e.key !== 'd' && deleteTimeout) {
            clearTimeout(deleteTimeout);
            deleteTimeout = null;
        }

        switch (e.key) {
            case 'j': // Вниз
                e.preventDefault();
                const tasksInCurrentCol = columns[newCol].children.length;
                if (newTask < tasksInCurrentCol - 1) {
                    newTask++;
                }
                break;
            case 'k': // Вверх
                e.preventDefault();
                if (newTask > 0) {
                    newTask--;
                }
                break;
            case 'l': // Вправо
                e.preventDefault();
                // Ищем следующую непустую колонку справа
                for (let i = newCol + 1; i < columns.length; i++) {
                    if (columns[i].children.length > 0) {
                        newCol = i;
                        newTask = 0; // Сбрасываем фокус на первую задачу
                        break; // Нашли, выходим из цикла
                    }
                }
                break;
            case 'h': // Влево
                e.preventDefault();
                // Ищем предыдущую непустую колонку слева
                for (let i = newCol - 1; i >= 0; i--) {
                    if (columns[i].children.length > 0) {
                        newCol = i;
                        newTask = 0; // Сбрасываем фокус на первую задачу
                        break; // Нашли, выходим из цикла
                    }
                }
                break;
            case 'i': // Insert mode
                e.preventDefault();
                setMode('insert');
                todoTitleInput.focus();
                // Сбрасываем фокус с задачи, чтобы не было двух подсветок
                updateFocus(focusedColumnIndex, focusedTaskIndex, null, null);
                break;
            case 'e': // Edit
            case 'Enter':
                e.preventDefault();
                const focusedColumn = columns[focusedColumnIndex];
                if (focusedColumn) {
                    const focusedTaskElement = focusedColumn.children[focusedTaskIndex];
                    if (focusedTaskElement) {
                        const editButton = focusedTaskElement.querySelector('.edit');
                        if (editButton) {
                            openEditModal(editButton.dataset.id);
                        }
                    }
                }
                break;
            case 'v': // Toggle completed status
                e.preventDefault();
                const toggleColumn = columns[focusedColumnIndex];
                if (toggleColumn) {
                    const taskElement = toggleColumn.children[focusedTaskIndex];
                    if (taskElement) {
                        const toggleButton = taskElement.querySelector('.toggle');
                        if (toggleButton) {
                            toggleButton.click(); // Имитируем клик, чтобы использовать существующую логику
                        }
                    }
                }
                break;
            case 'd': // Delete command (part 1)
                e.preventDefault();
                if (deleteTimeout) { // Если 'd' была нажата недавно
                    clearTimeout(deleteTimeout);
                    deleteTimeout = null;
                    // Выполняем удаление
                    const deleteColumn = columns[focusedColumnIndex];
                    if (deleteColumn) {
                        const taskElement = deleteColumn.children[focusedTaskIndex];
                        if (taskElement) {
                            const deleteButton = taskElement.querySelector('.delete');
                            if (deleteButton) {
                                deleteButton.click(); // Имитируем клик
                            }
                        }
                    }
                } else {
                    // Устанавливаем таймер для второго 'd'
                    deleteTimeout = setTimeout(() => { deleteTimeout = null; }, 500); // Окно в 500 мс
                }
                break;
        }

        // Если фокус изменился, обновляем его
        if (newCol !== oldCol || newTask !== oldTask) {
            // Проверяем, есть ли задачи в новой колонке
            if (columns[newCol] && columns[newCol].children.length > 0) {
                focusedColumnIndex = newCol;
                focusedTaskIndex = Math.min(newTask, columns[newCol].children.length - 1);
                updateFocus(oldCol, oldTask, focusedColumnIndex, focusedTaskIndex);
            }
        }
    };

    document.addEventListener('keydown', (e) => {
        // Если открыто модальное окно, используем его навигацию
        if (editModal.style.display === 'flex' && e.key !== 'Escape') {
            // Исключаем поле ввода, чтобы в нем можно было печатать
            if (document.activeElement.tagName === 'INPUT' && e.key !== 'Enter' && e.key !== 'Escape') {
                return;
            }
            handleModalKeyDown(e);
            return;
        }

        // Логика переключения режимов
        if (mode === 'insert') {
            // В режиме вставки мы не хотим, чтобы работала основная навигация
            // Но позволяем Enter отправлять форму
            if (e.key === 'Enter') {
                todoForm.requestSubmit(); // Программная отправка формы
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setMode('normal');
                todoTitleInput.blur(); // Убираем фокус с поля ввода
                // Возвращаем фокус на задачу
                updateFocus(null, null, focusedColumnIndex, focusedTaskIndex);
            }

            // Добавляем навигацию h/l для радио-кнопок в режиме вставки
            const activeElement = document.activeElement;
            if (activeElement.type === 'radio' && activeElement.name === 'todo-urgency') {
                const urgencyRadios = Array.from(todoForm.querySelectorAll('input[name="todo-urgency"]'));
                const currentIndex = urgencyRadios.indexOf(activeElement);

                if (e.key === 'l') { // Вправо
                    e.preventDefault();
                    if (currentIndex < urgencyRadios.length - 1) {
                        const nextRadio = urgencyRadios[currentIndex + 1];
                        nextRadio.focus();
                        nextRadio.checked = true;
                    }
                } else if (e.key === 'h') { // Влево
                    e.preventDefault();
                    if (currentIndex > 0) {
                        const prevRadio = urgencyRadios[currentIndex - 1];
                        prevRadio.focus();
                        prevRadio.checked = true;
                    }
                }
            }
        } else { // mode === 'normal'
            // В нормальном режиме работают Vim-команды
            handleMainKeyDown(e);
        }
    });
});
