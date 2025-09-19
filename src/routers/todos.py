from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

# Импортируем нашу модель и "базу данных" из соседнего модуля
from database import Todo, get_session

# Создаем новый роутер. Его можно рассматривать как "мини-приложение" FastAPI.
router = APIRouter()


@router.get("/", response_model=List[Todo])
async def get_todos(session: AsyncSession = Depends(get_session)):
    """Получение всех задач"""
    result = await session.exec(select(Todo))
    todos = result.all()
    return todos


@router.post("/", response_model=Todo, status_code=status.HTTP_201_CREATED)
async def create_todo(todo: Todo, session: AsyncSession = Depends(get_session)):
    """Создание новой задачи"""
    # ID теперь генерируется БД, поэтому мы его не передаем
    todo.id = None
    session.add(todo)
    await session.commit()
    await session.refresh(todo)
    return todo


@router.get("/{todo_id}", response_model=Todo)
async def get_todo_by_id(todo_id: int, session: AsyncSession = Depends(get_session)):
    """Получение задачи по id"""
    todo = await session.get(Todo, todo_id)
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Задача не найдена"
        )
    return todo


@router.put("/{todo_id}", response_model=Todo)
async def update_todo(
    todo_id: int, updated_todo: Todo, session: AsyncSession = Depends(get_session)
):
    """Обновление задачи по id"""
    db_todo = await session.get(Todo, todo_id)
    if not db_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Задача c id {todo_id} не найдена",
        )

    # Обновляем данные модели из пришедшего JSON
    todo_data = updated_todo.dict(exclude_unset=True)
    for key, value in todo_data.items():
        setattr(db_todo, key, value)

    session.add(db_todo)
    await session.commit()
    await session.refresh(db_todo)
    return db_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: int, session: AsyncSession = Depends(get_session)):
    """Удаление задачи по id"""
    todo = await session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Задача c id {todo_id} не найдена",
        )

    await session.delete(todo)
    await session.commit()
    return None
