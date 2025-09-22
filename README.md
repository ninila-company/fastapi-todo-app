# FastAPI Todo App

Простое приложение для управления задачами (Todo), созданное с использованием FastAPI, SQLModel и стилизованного ретро-фронтенда.

## Технологии

- **Бэкенд:** Python, FastAPI, SQLModel, SQLAlchemy, Uvicorn
- **База данных:** SQLite (асинхронный драйвер `aiosqlite`)
- **Фронтенд:** HTML, CSS, JavaScript (без фреймворков)

## Управление

Приложение управляется с клавиатуры в стиле редактора Vim.

### Основные команды (Normal Mode)
*   <kbd>j</kbd> / <kbd>k</kbd> - Навигация по задачам вверх/вниз
*   <kbd>h</kbd> / <kbd>l</kbd> - Навигация по колонкам влево/вправо
*   <kbd>i</kbd> - Войти в режим вставки (для создания новой задачи)
*   <kbd>e</kbd> или <kbd>Enter</kbd> - Редактировать выбранную задачу
*   <kbd>v</kbd> - Отметить задачу как выполненную/невыполненную
*   <kbd>dd</kbd> - Удалить выбранную задачу
*   <kbd>:help</kbd> + <kbd>Enter</kbd> - Показать окно помощи со всеми командами

### Режим вставки (Insert Mode)
*   <kbd>Enter</kbd> - Создать новую задачу
*   <kbd>h</kbd> / <kbd>l</kbd> - Изменить срочность
*   <kbd>Esc</kbd> - Выйти в нормальный режим

## Установка и запуск

1.  **Клонируйте репозиторий:**
    ```bash
    git clone https://github.com/ninila-company/fastapi-todo-app.git
    cd fastapi-todo-app
    ```

2.  **Создайте и активируйте виртуальное окружение:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Для Windows: venv\Scripts\activate
    ```

3.  **Установите зависимости:**
    ```bash
    pip install -r requirements.txt
    ```
    *(Примечание: вам нужно будет создать файл `requirements.txt`)*

4.  **Запустите приложение:**
    ```bash
    uvicorn src.main:app --reload --port 8001
    ```

5.  Откройте в браузере http://127.0.0.1:8001.
