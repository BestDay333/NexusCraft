# NexusCraft 

NexusCraft — это современный веб-дашборд и панель управления проектом, созданная с использованием Node.js, Express и чистого JavaScript. Проект включает в себя интерактивный интерфейс с поддержкой кастомных стилей, встроенным плеером Twitch и управлением данными через локальный источник (`data.json`).

## Технологии
git add README.md
* **Backend:** Node.js, Express
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Интеграции:** Twitch Player / Embeds
* **Стилизация:** Кастомный дизайн с адаптивной версткой

## Структура проекта

```text
proget/
├── node_modules/       # Зависимости Node.js
├── public/             # Статические файлы фронтенда
│   ├── index.html      # Главная страница дашборда
│   ├── script.js       # Клиентская логика и интерактивность
│   ├── style.css       # Таблицы стилей
│   └── data.json       # Локальный источник данных проекта
├── package.json        # Манифест Node.js
└── server.js           # Точка входа сервера Express
67