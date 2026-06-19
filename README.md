# Claude Agent Project

Веб-чат интерфейс для работы с Claude Code агентом. Пользователи задают вопросы по технической документации проектов, Claude Code читает файлы и отвечает на их основе.

## Требования

- Docker
- Аккаунт Claude (Pro/Max/Team)

## Запуск

## Авторизация

После первого запуска нужно залогиниться в Claude Code внутри контейнера:

```bash
docker run -it --rm \
  -v ~/.claude:/root/.claude \
  -v ~/.claude.json:/root/.claude.json \
  claude-agent claude auth login
```

Откроется ссылка — перейди по ней в браузере и залогинься через аккаунт Claude. После этого авторизация сохранится и при обычном запуске контейнера уже будет работать.

**Важно:** монтируй папки `~/.claude` и `~/.claude.json` при каждом запуске контейнера, иначе авторизация не найдётся.

2. Запусти контейнер:
```bash
docker run -p 8000:8000 \
  -v ~/.claude:/root/.claude \
  -v ~/.claude.json:/root/.claude.json \
  claude-agent
```

3. Открой браузер: `http://localhost:8000`

## Структура проектов

Документация для проектов лежит в папке `projects/`:
- `projects/project_1/` — первый проект
- `projects/project_2/` — второй проект

## Разработка (без Docker)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```