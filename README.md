# FastAPI Todo App

Простое приложение для управления задачами (Todo), созданное с использованием FastAPI, SQLModel и стилизованного ретро-фронтенда.

## Технологии

- **Бэкенд:** Python, FastAPI, SQLModel, SQLAlchemy, Uvicorn
- **База данных:** SQLite (асинхронный драйвер `aiosqlite`)
- **Фронтенд:** HTML, CSS, JavaScript (без фреймворков)

## Установка и запуск

1.  **Клонируйте репозиторий:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/fastapi-todo-app.git
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
