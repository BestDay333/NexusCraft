import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Раздаем статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Добавляем раздачу локального репозитория с иконками и текстурами Minecraft
app.use('/minecraft-assets', express.static(path.join(__dirname, 'minecraft-assets')));

app.use(express.json());

// Эндпоинт с данными ресурсов (в будущем заменим на данные из таблицы)
app.get('/api/resources', (req, res) => {
    const resources = [
        { name: "Кварцевые кирпичи", required: 13683, obtained: 271, status: "in-progress" },
        { name: "Гладкий камень", required: 14006, obtained: 14006, status: "closed" }
    ];
    res.json(resources);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});