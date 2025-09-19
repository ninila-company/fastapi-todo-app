from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import create_db_and_tables
from routers import todos


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Контекстный менеджер для управления жизненным циклом приложения.
    Выполняет создание таблиц в БД при старте.
    """
    await create_db_and_tables()
    yield
    # Код после 'yield' выполняется при остановке приложения
    print("Приложение остановлено. Выполняем очистку ресурсов...")
    # Например, можно закрыть соединение с каким-либо внешним сервисом
    # await some_cleanup_function()


app = FastAPI(
    title="Todo App API",
    description="Простое приложение для управления задачами",
    version="1.0.0",
    lifespan=lifespan,
)


app.mount("/static", StaticFiles(directory="static"), name="static")

# Подключаем роутер к основному приложению.
# prefix="/todos" означает, что все пути в роутере (например, "/")
# будут доступны по адресу "/todos/".
# tags=["todos"] группирует эндпоинты в документации Swagger.
app.include_router(todos.router, prefix="/todos", tags=["todos"])


@app.get("/")
async def read_index():
    """Отдает фронтенд приложения"""
    return FileResponse("static/index.html")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
