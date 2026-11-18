/**
 * NexusCraft — логика приложения.
 * Схемы разбираются в браузере, данные проектов хранятся в localStorage,
 * исходные файлы — в IndexedDB (для повторного предпросмотра).
 */

import { parseSchematic, formatBytes } from './schematic.js';
import { displayName, colorFor, guessCategory } from './blocks.js';
import { createPreview, previewSupported } from './preview.js';

const KEYS = {
    projects: 'nc_projects',
    obtained: 'nc_obtained',
    history: 'nc_history',
    categories: 'nc_categories',
    materialCategories: 'nc_material_categories',
    user: 'dashboard_user'
};

const DEFAULT_CATEGORIES = [
    { id: 'wool', name: '🧶 Шерсть и ковры' },
    { id: 'clay', name: '🏺 Керамика и терракота' },
    { id: 'wood', name: '🪵 Дерево' },
    { id: 'stone', name: '🧱 Камень и блоки' },
    { id: 'glass', name: '🪟 Стекло' },
    { id: 'metal', name: '⛏️ Металлы и руды' },
    { id: 'plants', name: '🌿 Растения' },
    { id: 'redstone', name: '🔴 Редстоун' },
    { id: 'nether', name: '🔥 Нижний мир' },
    { id: 'other', name: '📦 Прочее' }
];

const MAX_FILE_SIZE = 150 * 1024 * 1024;

let projects = loadJSON(KEYS.projects, []);
let obtained = loadJSON(KEYS.obtained, {});
let history = loadJSON(KEYS.history, {});
let categories = loadJSON(KEYS.categories, null);
let materialCategories = loadJSON(KEYS.materialCategories, {});
if (!Array.isArray(categories) || !categories.length) {
    categories = DEFAULT_CATEGORIES.map(c => ({ ...c }));
}

let activeProjectId = projects.length ? projects[projects.length - 1].id : null;
let currentCatFilter = 'all';
let currentStatusFilter = 'all';
let searchQuery = '';
let sortMode = 'default';
let manualSort = null;

let editingCategoryId = null;
let modalSortMode = 'alpha';
let activeEditKey = null;

const runtimeVoxels = new Map();
let preview = null;
let previewReady = false;
let basePreviewMeta = '';
let previewMetaExtra = '';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const fmt = (n) => Number(n || 0).toLocaleString('ru-RU');
const uid = () => 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.warn('localStorage:', e);
        showToast('Не хватило места в браузере для сохранения данных', 'error');
        return false;
    }
}

const saveProjects = () => saveJSON(KEYS.projects, projects);
const saveObtained = () => saveJSON(KEYS.obtained, obtained);
const saveHistory = () => saveJSON(KEYS.history, history);
const saveCategories = () => saveJSON(KEYS.categories, categories);
const saveMaterialCategories = () => saveJSON(KEYS.materialCategories, materialCategories);

function showToast(message, type = 'success') {
    const container = $('#toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icon = type === 'success' ? 'fa-circle-check'
        : type === 'warning' ? 'fa-triangle-exclamation'
            : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${esc(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'all .3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(16px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function materialName(key) {
    if (/[а-яА-ЯёЁ]/.test(key)) return key;
    return displayName(key);
}

function parseObtainedValue(input) {
    if (typeof input === 'number') return Math.round(input);
    if (!input) return 0;
    let s = String(input).toLowerCase().trim();
    let total = 0;

    // 1k / 2к
    s = s.replace(/(\d+(?:[.,]\d+)?)\s*[kк]\b/g, (_, num) => {
        total += parseFloat(num.replace(',', '.')) * 1000;
        return '';
    });

    const shulkerRegex = /(\d+(?:[.,]\d+)?)\s*(?:шалкер[а-я]*|shulker[s]*)/g;
    let match;
    while ((match = shulkerRegex.exec(s)) !== null) {
        total += parseFloat(match[1].replace(',', '.')) * 1728;
    }
    s = s.replace(/[\d\.,]+\s*(?:шалкер[а-я]*|shulker[s]*)/g, '');

    const stackRegex = /(\d+(?:[.,]\d+)?)\s*(?:стак[а-я]*|stack[s]*)/g;
    while ((match = stackRegex.exec(s)) !== null) {
        total += parseFloat(match[1].replace(',', '.')) * 64;
    }
    s = s.replace(/[\d\.,]+\s*(?:стак[а-я]*|stack[s]*)/g, '');

    let cleanExpr = s
        .replace(/предмет[а-я]*/g, '')
        .replace(/шт\.?/g, '')
        .replace(/штук[а-я]*/g, '')
        .replace(/,/g, '.')
        .replace(/[^0-9+\-*/().\s]/g, '');

    try {
        if (cleanExpr.trim()) {
            const res = Function(`'use strict'; return (${cleanExpr})`)();
            if (!isNaN(res)) total += res;
        }
    } catch (e) {
        const nums = cleanExpr.match(/\d+(?:\.\d+)?/g);
        if (nums) nums.forEach(n => { total += parseFloat(n); });
    }
    return Math.max(0, Math.round(total));
}

function dimensionsText(dims) {
    if (!dims || !dims.x) return '—';
    return `${fmt(dims.x)}×${fmt(dims.y)}×${fmt(dims.z)}`;
}

async function migrateLegacyData() {
    // Совместимость с прошлой версией дашборда
    try {
        const oldObtained = localStorage.getItem('dashboard_obtained');
        if (oldObtained && localStorage.getItem(KEYS.obtained) === null) {
            obtained = JSON.parse(oldObtained) || {};
            saveObtained();
        }
        const oldHistory = localStorage.getItem('dashboard_history');
        if (oldHistory && localStorage.getItem(KEYS.history) === null) {
            history = JSON.parse(oldHistory) || {};
            saveHistory();
        }
        const oldCats = localStorage.getItem('project_categories');
        if (oldCats && localStorage.getItem(KEYS.categories) === null) {
            const parsed = JSON.parse(oldCats);
            if (Array.isArray(parsed) && parsed.length) {
                categories = parsed;
                saveCategories();
            }
        }
        const oldMap = localStorage.getItem('material_categories_map');
        if (oldMap && localStorage.getItem(KEYS.materialCategories) === null) {
            materialCategories = JSON.parse(oldMap) || {};
            saveMaterialCategories();
        }
    } catch (e) {
        console.warn('Миграция старых данных не удалась:', e);
    }
}

/* ---------------- IndexedDB для исходных файлов ---------------- */

let dbPromise = null;

function openDB() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (!dbPromise) {
        dbPromise = new Promise((resolve) => {
            let req;
            try {
                req = indexedDB.open('nexuscraft', 1);
            } catch (e) {
                resolve(null);
                return;
            }
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    }
    return dbPromise;
}

async function idbPut(id, record) {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction('files', 'readwrite');
            tx.objectStore('files').put(record, id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        } catch (e) {
            resolve(false);
        }
    });
}

async function idbGet(id) {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
        try {
            const tx = db.transaction('files', 'readonly');
            const req = tx.objectStore('files').get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        } catch (e) {
            resolve(null);
        }
    });
}

async function idbDelete(id) {
    const db = await openDB();
    if (!db) return;
    try {
        db.transaction('files', 'readwrite').objectStore('files').delete(id);
    } catch (e) { /* ignore */ }
}

async function idbClear() {
    const db = await openDB();
    if (!db) return;
    try {
        db.transaction('files', 'readwrite').objectStore('files').clear();
    } catch (e) { /* ignore */ }
}

/* ---------------- Данные проекта ---------------- */

async function loadDemoData() {
    if (localStorage.getItem(KEYS.projects) !== null) return;
    try {
        const res = await fetch('data.json?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return;

        const counts = {};
        let blockCount = 0;
        data.forEach(item => {
            const name = String(item.name || '').trim();
            const required = Number(item.required) || 0;
            if (!name || required <= 0) return;
            counts[name] = (counts[name] || 0) + required;
            blockCount += required;
        });
        if (!blockCount) return;

        projects = [{
            id: 'demo',
            name: 'Проспектум (пример)',
            fileName: 'data.json',
            format: 'JSON (демо)',
            dimensions: null,
            blockCount,
            uniqueBlocks: Object.keys(counts).length,
            counts,
            addedAt: Date.now(),
            demo: true
        }];
        saveProjects();

        if (Object.keys(obtained).length === 0) {
            data.forEach(item => {
                const value = Number(item.obtained) || 0;
                if (item.name && value > 0) obtained[item.name] = value;
            });
            saveObtained();
        }
        activeProjectId = 'demo';
    } catch (e) {
        console.warn('Демо-данные недоступны:', e);
    }
}

function aggregateMaterials() {
    const map = new Map();
    projects.forEach(project => {
        const counts = project.counts || {};
        for (const key in counts) {
            const value = Number(counts[key]) || 0;
            if (value <= 0) continue;
            map.set(key, (map.get(key) || 0) + value);
        }
    });

    const list = [];
    map.forEach((required, key) => {
        list.push({
            key,
            name: materialName(key),
            required,
            obtained: parseObtainedValue(obtained[key]),
            category: materialCategories[key] || guessCategory(key)
        });
    });

    list.forEach(item => {
        item.remaining = Math.max(0, item.required - item.obtained);
        item.percent = item.required > 0 ? Math.min(100, (item.obtained / item.required) * 100) : 0;
        item.status = item.percent >= 100 ? 'closed' : item.obtained > 0 ? 'in-progress' : 'not-started';
        item.history = history[item.key] || null;
    });

    return list;
}

function autoAssignCategories(materials) {
    let changed = false;
    materials.forEach(item => {
        if (!materialCategories[item.key]) {
            materialCategories[item.key] = guessCategory(item.key);
            changed = true;
        }
    });
    if (changed) saveMaterialCategories();
}

function projectById(id) {
    return projects.find(p => p.id === id) || null;
}

/* ---------------- Загрузка схем ---------------- */

function setupUpload() {
    const dropzone = $('#dropzone');
    const input = $('#fileInput');
    if (!dropzone || !input) return;

    dropzone.addEventListener('click', (e) => {
        if (e.target.closest('.upload-status')) return;
        input.click();
    });
    dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.click();
        }
    });

    input.addEventListener('change', () => {
        handleFiles(input.files);
        input.value = '';
    });

    ['dragenter', 'dragover'].forEach(type => {
        dropzone.addEventListener(type, (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
    });
    ['dragleave', 'dragend'].forEach(type => {
        dropzone.addEventListener(type, (e) => {
            if (e.target === dropzone || !dropzone.contains(e.relatedTarget)) {
                dropzone.classList.remove('dragover');
            }
        });
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });
}

let uploadBusy = false;

async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length || uploadBusy) return;
    uploadBusy = true;

    const dropzone = $('#dropzone');
    const status = $('#uploadStatus');
    const statusText = $('#uploadStatusText');
    dropzone.classList.add('busy');
    status.hidden = false;

    let lastId = null;
    let added = 0;
    const errors = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        statusText.textContent = `Обработка «${file.name}» (${i + 1}/${files.length})…`;
        await new Promise(r => setTimeout(r, 30));

        if (file.size > MAX_FILE_SIZE) {
            errors.push(`${file.name}: файл слишком большой (максимум ${formatBytes(MAX_FILE_SIZE)})`);
            continue;
        }

        try {
            const buffer = await file.arrayBuffer();
            const parsed = parseSchematic(buffer, file.name);

            const project = {
                id: uid(),
                name: parsed.name,
                fileName: file.name,
                format: parsed.format,
                dimensions: parsed.dimensions,
                blockCount: parsed.blockCount,
                uniqueBlocks: parsed.uniqueBlocks,
                counts: parsed.counts,
                size: file.size,
                addedAt: Date.now()
            };

            projects.push(project);
            lastId = project.id;
            added++;

            if (parsed.voxels) runtimeVoxels.set(project.id, parsed.voxels);
            await idbPut(project.id, {
                name: file.name,
                type: file.type,
                size: file.size,
                bytes: buffer
            });

            if (parsed.warnings && parsed.warnings.length) {
                parsed.warnings.forEach(w => showToast(`${file.name}: ${w}`, 'warning'));
            }
        } catch (e) {
            console.error(e);
            errors.push(`${file.name}: ${e.message || e}`);
        }
    }

    if (added) {
        autoAssignCategories(aggregateMaterials());
        saveProjects();
        if (lastId) {
            activeProjectId = lastId;
        }
        currentCatFilter = 'all';
        currentStatusFilter = 'all';
        searchQuery = '';
        const searchInput = $('#searchInput');
        if (searchInput) searchInput.value = '';
        manualSort = null;
        renderAll();
        if (activeProjectId) await showPreviewFor(activeProjectId);
        showToast(added === 1
            ? `Схема «${projectById(activeProjectId)?.name || ''}» загружена`
            : `Загружено схем: ${added}`);
    }

    errors.forEach(err => showToast(err, 'error'));

    status.hidden = true;
    dropzone.classList.remove('busy');
    uploadBusy = false;
    const fileInput = $('#fileInput');
    if (fileInput) fileInput.value = '';
}

/* ---------------- Отрисовка ---------------- */

function renderAll() {
    const materials = aggregateMaterials();
    autoAssignCategories(materials);
    renderStats(materials);
    renderProjects();
    renderCategoryFilters();
    renderTables(materials);
    updateAuthUI();
}

function renderStats(materials) {
    let totalRequired = 0;
    let totalObtained = 0;
    materials.forEach(item => {
        totalRequired += item.required;
        totalObtained += Math.min(item.obtained, item.required);
    });

    const percent = totalRequired > 0 ? (totalObtained / totalRequired) * 100 : 0;
    const active = projectById(activeProjectId);

    const statBlocks = $('#statBlocks');
    if (statBlocks) statBlocks.textContent = fmt(totalRequired);
    const statUnique = $('#statUnique');
    if (statUnique) statUnique.textContent = fmt(materials.length);
    const statDimensions = $('#statDimensions');
    if (statDimensions) statDimensions.textContent = active ? dimensionsText(active.dimensions) : '—';
    const statProgress = $('#statProgress');
    if (statProgress) statProgress.textContent = Math.round(percent) + '%';

    const bar = $('#overallBar');
    if (bar) bar.style.width = percent + '%';
    const text = $('#progressText');
    if (text) text.textContent = `${fmt(totalObtained)} / ${fmt(totalRequired)} блоков собрано`;
    const label = $('#progressPercent');
    if (label) label.textContent = Math.round(percent) + '%';

    const projectCount = $('#projectCount');
    if (projectCount) {
        const n = projects.length;
        const word = n === 1 ? 'схема' : n > 1 && n < 5 ? 'схемы' : 'схем';
        projectCount.textContent = `${n} ${word}`;
    }
}

function renderProjects() {
    const container = $('#projectList');
    if (!container) return;
    container.innerHTML = '';

    if (!projects.length) {
        container.innerHTML = `<div class="project-sub" style="padding:8px 4px;">Пока пусто — загрузите схему или импортируйте проект.</div>`;
        return;
    }

    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'project-item' + (project.id === activeProjectId ? ' active' : '');
        item.dataset.id = project.id;

        const main = document.createElement('button');
        main.className = 'project-main';
        main.type = 'button';
        main.title = 'Показать предпросмотр';
        main.innerHTML = `
            <i class="fa-solid ${project.demo ? 'fa-database' : 'fa-cube'}"></i>
            <div class="project-text">
                <div class="project-name">${esc(project.name)}</div>
                <div class="project-sub">${esc(project.format)} · ${fmt(project.blockCount)} блоков · ${fmt(project.uniqueBlocks)} материалов</div>
            </div>
        `;
        main.addEventListener('click', () => showPreviewFor(project.id));

        const actions = document.createElement('div');
        actions.className = 'project-actions';

        const del = document.createElement('button');
        del.className = 'icon-btn danger';
        del.type = 'button';
        del.title = 'Удалить схему из проекта';
        del.innerHTML = '<i class="fa-solid fa-trash"></i>';
        del.addEventListener('click', (e) => {
            e.stopPropagation();
            removeProject(project.id);
        });

        actions.appendChild(del);
        item.appendChild(main);
        item.appendChild(actions);
        container.appendChild(item);
    });
}

function renderCategoryFilters() {
    const wrapper = $('#categoryFiltersWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    const allWrapper = document.createElement('div');
    allWrapper.className = 'cat-filter-wrapper' + (currentCatFilter === 'all' ? ' active' : '');
    const allBtn = document.createElement('button');
    allBtn.className = 'cat-filter-btn';
    allBtn.type = 'button';
    allBtn.textContent = '📂 Все';
    allBtn.addEventListener('click', () => {
        currentCatFilter = 'all';
        renderCategoryFilters();
        renderTables();
    });
    allWrapper.appendChild(allBtn);
    wrapper.appendChild(allWrapper);

    categories.forEach(cat => {
        const catWrapper = document.createElement('div');
        catWrapper.className = 'cat-filter-wrapper' + (currentCatFilter === cat.id ? ' active' : '');

        const btn = document.createElement('button');
        btn.className = 'cat-filter-btn';
        btn.type = 'button';
        btn.textContent = cat.name;
        btn.addEventListener('click', () => {
            currentCatFilter = cat.id;
            renderCategoryFilters();
            renderTables();
        });

        const edit = document.createElement('button');
        edit.className = 'cat-edit-btn';
        edit.type = 'button';
        edit.title = 'Редактировать категорию';
        edit.innerHTML = '<i class="fa-solid fa-pen"></i>';
        edit.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditCategoryModal(cat.id);
        });

        catWrapper.appendChild(btn);
        catWrapper.appendChild(edit);
        wrapper.appendChild(catWrapper);
    });
}

function sortMaterials(list) {
    const arr = list.slice();
    if (manualSort) {
        const { col, dir } = manualSort;
        arr.sort((a, b) => {
            if (col === 'name') return dir * a.name.localeCompare(b.name, 'ru');
            return dir * ((a[col] || 0) - (b[col] || 0));
        });
        return arr;
    }

    switch (sortMode) {
        case 'rem-asc':
            arr.sort((a, b) => a.remaining - b.remaining);
            break;
        case 'rem-desc':
            arr.sort((a, b) => b.remaining - a.remaining);
            break;
        case 'req-desc':
            arr.sort((a, b) => b.required - a.required);
            break;
        case 'name':
            arr.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            break;
        default:
            break;
    }
    return arr;
}

function statusLabel(status) {
    if (status === 'closed') return 'Собрано';
    return status === 'in-progress' ? 'В процессе' : 'Не начато';
}

function createRow(item) {
    const tr = document.createElement('tr');
    tr.dataset.key = item.key;
    tr.dataset.status = item.status;
    tr.dataset.category = item.category;

    const hex = colorFor(item.key).toString(16).padStart(6, '0');
    const showId = item.name !== item.key;

    const tdName = document.createElement('td');
    tdName.innerHTML = `
        <div class="item-cell">
            <span class="swatch" style="background:#${hex}"></span>
            <div class="item-text">
                <span class="item-name" title="${esc(item.name)}">${esc(item.name)}</span>
                ${showId ? `<span class="item-id" title="${esc(item.key)}">${esc(item.key)}</span>` : ''}
            </div>
        </div>
    `;

    const tdCategory = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'material-cat-select';
    select.title = 'Категория материала';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        if (cat.id === item.category) opt.selected = true;
        select.appendChild(opt);
    });
    select.addEventListener('change', () => {
        materialCategories[item.key] = select.value;
        saveMaterialCategories();
        renderTables();
    });
    tdCategory.appendChild(select);

    const tdRequired = document.createElement('td');
    tdRequired.textContent = fmt(item.required);

    const tdObtained = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit-val';
    editBtn.type = 'button';
    editBtn.title = 'Изменить количество';
    editBtn.innerHTML = `<span>${fmt(item.obtained)}</span><i class="fa-solid fa-pen"></i>`;
    editBtn.addEventListener('click', () => openEditModal(item.key));
    tdObtained.appendChild(editBtn);

    const tdRemaining = document.createElement('td');
    tdRemaining.className = 'highlight-rem';
    tdRemaining.textContent = fmt(item.remaining);

    const tdProgress = document.createElement('td');
    tdProgress.innerHTML = `<div class="mini-prog"><div class="bar ${item.percent >= 100 ? 'complete' : ''}" style="width:${item.percent}%"></div></div>`;

    const tdStatus = document.createElement('td');
    tdStatus.innerHTML = `<span class="status-badge ${item.status}">${statusLabel(item.status)}</span>`;

    const tdHistory = document.createElement('td');
    if (item.history && item.history.user) {
        const span = document.createElement('span');
        span.className = 'history-text' + (item.history.user === 'System' ? ' muted' : '');
        span.textContent = `${item.history.user}: ${item.history.text}`;
        span.title = span.textContent;
        tdHistory.appendChild(span);
    } else {
        const span = document.createElement('span');
        span.className = 'history-text muted';
        span.textContent = '—';
        tdHistory.appendChild(span);
    }

    tr.appendChild(tdName);
    tr.appendChild(tdCategory);
    tr.appendChild(tdRequired);
    tr.appendChild(tdObtained);
    tr.appendChild(tdRemaining);
    tr.appendChild(tdProgress);
    tr.appendChild(tdStatus);
    tr.appendChild(tdHistory);
    return tr;
}

function renderTables(materialsInput) {
    const materials = materialsInput || aggregateMaterials();
    const activeBody = $('#activeTableBody');
    const completedBody = $('#completedTableBody');
    if (!activeBody || !completedBody) return;

    const active = [];
    const completed = [];
    materials.forEach(item => {
        if (item.status === 'closed') completed.push(item);
        else active.push(item);
    });

    const query = searchQuery.toLowerCase().trim();
    const visibleActive = sortMaterials(active.filter(item => {
        const matchesSearch = !query ||
            item.name.toLowerCase().includes(query) ||
            item.key.toLowerCase().includes(query);
        const matchesStatus = currentStatusFilter === 'all' || item.status === currentStatusFilter;
        const matchesCategory = currentCatFilter === 'all' || item.category === currentCatFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    }));

    activeBody.innerHTML = '';
    visibleActive.forEach(item => activeBody.appendChild(createRow(item)));

    completedBody.innerHTML = '';
    sortMaterials(completed).forEach(item => completedBody.appendChild(createRow(item)));

    const activeEmpty = $('#activeEmpty');
    if (activeEmpty) {
        activeEmpty.classList.toggle('show', visibleActive.length === 0);
        const p = activeEmpty.querySelector('p');
        if (p) {
            p.textContent = materials.length === 0
                ? 'Пока нет материалов — загрузите схему выше'
                : 'Ничего не найдено по выбранным фильтрам';
        }
    }

    const completedEmpty = $('#completedEmpty');
    if (completedEmpty) completedEmpty.classList.toggle('show', completed.length === 0);

    const activeCount = $('#activeCount');
    if (activeCount) activeCount.textContent = fmt(active.length);
    const completedCount = $('#completedCount');
    if (completedCount) completedCount.textContent = fmt(completed.length);

    const activeTable = $('#activeTable');
    if (activeTable) activeTable.style.display = visibleActive.length ? '' : 'none';
    const completedTable = $('#completedTable');
    if (completedTable) completedTable.style.display = completed.length ? '' : 'none';
}

/* ---------------- Модальное окно добычи ---------------- */

function findMaterial(key) {
    return aggregateMaterials().find(item => item.key === key) || null;
}

function openEditModal(key) {
    const user = localStorage.getItem(KEYS.user);
    if (!user) {
        showToast('Войдите, чтобы изменять количество ресурсов', 'warning');
        openLoginModal();
        return;
    }

    const item = findMaterial(key);
    if (!item) return;

    activeEditKey = key;
    $('#modalItemTitle').textContent = item.name;
    $('#modalRequiredText').textContent = fmt(item.required);
    $('#modalIdText').textContent = key;
    const input = $('#modalValueInput');
    input.value = obtained[key] !== undefined ? obtained[key] : '';
    calcModalRemaining();
    $('#editModal').classList.add('open');
    input.focus();
    input.select();
}

function closeEditModal() {
    $('#editModal').classList.remove('open');
    activeEditKey = null;
}

function calcModalRemaining() {
    if (!activeEditKey) return;
    const item = findMaterial(activeEditKey);
    if (!item) return;
    let value = parseObtainedValue($('#modalValueInput').value);
    value = Math.min(value, item.required);
    $('#modalRemainingText').textContent = fmt(Math.max(0, item.required - value));
}

function saveObtainedLocally() {
    if (!activeEditKey) return;
    const item = findMaterial(activeEditKey);
    if (!item) {
        closeEditModal();
        return;
    }
    const user = localStorage.getItem(KEYS.user) || 'Гость';
    const raw = $('#modalValueInput').value.trim();
    let value = parseObtainedValue(raw);
    value = Math.max(0, Math.min(value, item.required));

    obtained[activeEditKey] = value;
    history[activeEditKey] = {
        user,
        text: (raw || String(value)) + ' шт.',
        time: Date.now()
    };
    saveObtained();
    saveHistory();
    closeEditModal();
    renderAll();
    showToast('Количество сохранено');
}

/* ---------------- Категории ---------------- */

let modalSelection = new Set();

function openCategoryModal() {
    editingCategoryId = null;
    modalSortMode = 'alpha';
    modalSelection = new Set();
    $('#selectedOptionTextModal').textContent = 'По алфавиту';
    $('#categoryModalTitle').textContent = 'Новая категория';
    $('#categoryModalSubtitle').textContent = 'Введите название и отметьте материалы';
    $('#categorySubmitBtn').textContent = 'Создать категорию';
    $('#categoryDeleteBtn').style.display = 'none';
    $('#newCategoryInput').value = '';
    $('#modalMaterialSearch').value = '';
    renderMaterialsChecklist();
    $('#categoryModal').classList.add('open');
    $('#newCategoryInput').focus();
}

function openEditCategoryModal(catId) {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    editingCategoryId = catId;
    modalSortMode = 'checked-first';
    modalSelection = new Set(Object.keys(materialCategories).filter(key => materialCategories[key] === catId));
    $('#selectedOptionTextModal').textContent = 'Сначала выбранные';
    $('#categoryModalTitle').textContent = 'Редактировать категорию';
    $('#categoryModalSubtitle').textContent = 'Измените название или состав материалов';
    $('#categorySubmitBtn').textContent = 'Сохранить';
    $('#categoryDeleteBtn').style.display = 'inline-flex';
    $('#newCategoryInput').value = cat.name;
    $('#modalMaterialSearch').value = '';
    renderMaterialsChecklist();
    $('#categoryModal').classList.add('open');
    $('#newCategoryInput').focus();
}

function closeCategoryModal() {
    $('#categoryModal').classList.remove('open');
    editingCategoryId = null;
}

function renderMaterialsChecklist() {
    const container = $('#materialsChecklist');
    if (!container) return;

    const query = $('#modalMaterialSearch').value.toLowerCase().trim();
    let items = aggregateMaterials();
    if (query) {
        items = items.filter(item =>
            item.name.toLowerCase().includes(query) || item.key.toLowerCase().includes(query));
    }

    items.sort((a, b) => {
        if (modalSortMode === 'checked-first') {
            const aChecked = modalSelection.has(a.key);
            const bChecked = modalSelection.has(b.key);
            if (aChecked && !bChecked) return -1;
            if (!aChecked && bChecked) return 1;
        }
        return a.name.localeCompare(b.name, 'ru');
    });

    container.innerHTML = '';
    if (!items.length) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">Ничего не найдено</div>';
        return;
    }

    items.forEach(item => {
        const label = document.createElement('label');
        label.className = 'material-checkbox-item' + (modalSelection.has(item.key) ? ' checked' : '');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = modalSelection.has(item.key);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) modalSelection.add(item.key);
            else modalSelection.delete(item.key);
            label.classList.toggle('checked', checkbox.checked);
        });

        const span = document.createElement('span');
        span.textContent = item.name;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

function saveCategory() {
    const name = $('#newCategoryInput').value.trim();
    if (!name) {
        showToast('Введите название категории', 'error');
        return;
    }

    if (editingCategoryId) {
        const cat = categories.find(c => c.id === editingCategoryId);
        if (cat) cat.name = name;
        Object.keys(materialCategories).forEach(key => {
            if (materialCategories[key] === editingCategoryId) materialCategories[key] = 'other';
        });
        modalSelection.forEach(key => { materialCategories[key] = editingCategoryId; });
        showToast('Категория обновлена');
    } else {
        const id = 'cat_' + Date.now().toString(36);
        categories.push({ id, name });
        modalSelection.forEach(key => { materialCategories[key] = id; });
        showToast('Категория создана');
    }

    saveCategories();
    saveMaterialCategories();
    closeCategoryModal();
    renderAll();
}

function deleteCurrentCategory() {
    if (!editingCategoryId) return;
    if (editingCategoryId === 'other') {
        showToast('Системную категорию «Прочее» удалить нельзя', 'warning');
        return;
    }
    const cat = categories.find(c => c.id === editingCategoryId);
    if (!cat) return;
    if (!confirm(`Удалить категорию «${cat.name}»? Материалы перейдут в «Прочее».`)) return;

    Object.keys(materialCategories).forEach(key => {
        if (materialCategories[key] === editingCategoryId) materialCategories[key] = 'other';
    });
    categories = categories.filter(c => c.id !== editingCategoryId);
    if (currentCatFilter === editingCategoryId) currentCatFilter = 'all';

    saveCategories();
    saveMaterialCategories();
    closeCategoryModal();
    renderAll();
    showToast('Категория удалена');
}

/* ---------------- Авторизация ---------------- */

function updateAuthUI() {
    const user = localStorage.getItem(KEYS.user);
    const loginBtn = $('#loginBtn');
    const profile = $('#userProfile');
    if (!loginBtn || !profile) return;

    if (user) {
        loginBtn.style.display = 'none';
        profile.style.display = 'flex';
        $('#userName').textContent = user;
        const avatar = $('#userAvatar');
        avatar.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user)}`;
        avatar.alt = user;
    } else {
        loginBtn.style.display = 'inline-flex';
        profile.style.display = 'none';
    }
}

function openLoginModal() {
    $('#loginModal').classList.add('open');
    const input = $('#usernameInput');
    input.focus();
}

function closeLoginModal() {
    $('#loginModal').classList.remove('open');
}

function login() {
    const input = $('#usernameInput');
    const username = input.value.trim();
    if (!username) {
        showToast('Введите ник', 'error');
        return;
    }
    localStorage.setItem(KEYS.user, username);
    input.value = '';
    closeLoginModal();
    updateAuthUI();
    showToast(`Добро пожаловать, ${username}!`);
}

function logout() {
    localStorage.removeItem(KEYS.user);
    updateAuthUI();
    showToast('Вы вышли из системы');
}

/* ---------------- Экспорт / импорт ---------------- */

function exportProject() {
    if (!projects.length) {
        showToast('Нечего экспортировать — добавьте схему', 'warning');
        return;
    }
    const payload = {
        app: 'NexusCraft',
        version: 2,
        exportedAt: new Date().toISOString(),
        projects,
        obtained,
        history,
        categories,
        materialCategories
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nexuscraft-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('Проект экспортирован');
}

async function importProject(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data || !Array.isArray(data.projects) || !data.projects.length) {
            throw new Error('В файле нет проектов NexusCraft');
        }
        if (!confirm('Импорт заменит текущие схемы и прогресс. Продолжить?')) return;

        projects = data.projects.map(p => ({
            id: p.id || uid(),
            name: String(p.name || 'Схема'),
            fileName: p.fileName || '',
            format: p.format || 'Импорт',
            dimensions: p.dimensions || null,
            blockCount: Number(p.blockCount) || 0,
            uniqueBlocks: Number(p.uniqueBlocks) || Object.keys(p.counts || {}).length,
            counts: p.counts && typeof p.counts === 'object' ? p.counts : {},
            addedAt: p.addedAt || Date.now()
        }));
        obtained = data.obtained && typeof data.obtained === 'object' ? data.obtained : {};
        history = data.history && typeof data.history === 'object' ? data.history : {};
        if (Array.isArray(data.categories) && data.categories.length) categories = data.categories;
        ensureSystemCategory();
        materialCategories = data.materialCategories && typeof data.materialCategories === 'object'
            ? data.materialCategories : {};

        saveProjects();
        saveObtained();
        saveHistory();
        saveCategories();
        saveMaterialCategories();

        runtimeVoxels.clear();
        activeProjectId = projects[0].id;
        currentCatFilter = 'all';
        currentStatusFilter = 'all';
        searchQuery = '';
        const searchInput = $('#searchInput');
        if (searchInput) searchInput.value = '';
        renderAll();
        await showPreviewFor(activeProjectId);
        showToast('Проект импортирован');
    } catch (e) {
        console.error(e);
        showToast('Не удалось импортировать: ' + (e.message || e), 'error');
    }
}

/* ---------------- 3D-предпросмотр ---------------- */

function setPreviewEmpty(show, title, text) {
    const empty = $('#previewEmpty');
    if (!empty) return;
    empty.classList.toggle('hidden', !show);
    if (title) {
        const p = empty.querySelector('p');
        if (p) p.textContent = title;
    }
    if (text !== undefined) {
        const span = empty.querySelector('span');
        if (span) span.textContent = text;
    }
    const hint = $('#previewHint');
    if (hint) hint.classList.toggle('hidden', show);
}

function resetPreview() {
    if (preview) preview.setModel(null);
    setPreviewEmpty(true, 'Здесь появится 3D-модель схемы', 'Загрузите .schem, .litematic, .nbt или .schematic');
    const badge = $('#previewBadge');
    if (badge) badge.textContent = '—';
    const meta = $('#previewMeta');
    if (meta) meta.textContent = 'Нет данных';
    const slider = $('#layerSlider');
    if (slider) {
        slider.disabled = true;
        slider.min = -1;
        slider.max = 0;
        slider.value = -1;
    }
    const label = $('#layerValue');
    if (label) label.textContent = 'все';
    basePreviewMeta = '';
}

function initPreview() {
    const canvas = $('#previewCanvas');
    if (!canvas) return;

    if (!previewSupported()) {
        setPreviewEmpty(true, 'WebGL недоступен', 'Включите аппаратное ускорение в браузере, чтобы увидеть 3D-модель');
        return;
    }

    preview = createPreview(canvas);
    if (!preview) {
        setPreviewEmpty(true, 'Не удалось создать 3D-контекст', 'Попробуйте другой браузер или обновите страницу');
        return;
    }
    previewReady = true;

    const slider = $('#layerSlider');
    const valueLabel = $('#layerValue');
    let layerTimer = 0;
    if (slider) {
        slider.addEventListener('input', () => {
            if (!previewReady) return;
            const value = Number(slider.value);
            if (valueLabel) {
                if (value < 0) valueLabel.textContent = 'все';
                else {
                    const max = Number(slider.max) + 1;
                    valueLabel.textContent = `${value + 1}/${max}`;
                }
            }
            clearTimeout(layerTimer);
            layerTimer = setTimeout(() => preview.setLayer(value), 120);
        });
    }

    const rotate = $('#autoRotate');
    if (rotate) {
        rotate.addEventListener('change', () => preview.setAutoRotate(rotate.checked));
    }

    const resetBtn = $('#resetViewBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => preview.resetView());

    const screenshotBtn = $('#screenshotBtn');
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', () => {
            if (!previewReady) return;
            const project = projectById(activeProjectId);
            if (!project || !runtimeVoxels.has(project.id)) {
                showToast('Сначала загрузите схему для предпросмотра', 'warning');
                return;
            }
            const url = preview.screenshot();
            const a = document.createElement('a');
            const safeName = (project.name || 'schematic').replace(/[^\wа-яА-ЯёЁ-]+/g, '_');
            a.href = url;
            a.download = `${safeName}-preview.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            showToast('Скриншот сохранён');
        });
    }

    const stage = $('#previewStage');
    if (stage) {
        stage.addEventListener('dblclick', () => preview.resetView());
    }
}

async function showPreviewFor(id) {
    activeProjectId = id;
    const project = projectById(id);
    renderProjects();

    const materials = aggregateMaterials();
    renderStats(materials);

    const badge = $('#previewBadge');
    if (!project) {
        resetPreview();
        return;
    }
    if (badge) badge.textContent = project.format;

    if (!previewReady) return;

    setPreviewEmpty(true, 'Загрузка предпросмотра…', project.fileName || '');
    const meta = $('#previewMeta');
    if (meta) meta.textContent = 'Читаю файл схемы…';

    let voxels = runtimeVoxels.get(id);
    if (!voxels) {
        const record = await idbGet(id);
        if (record && record.bytes) {
            try {
                const parsed = parseSchematic(record.bytes, record.name || project.fileName || project.name);
                if (parsed.voxels) {
                    voxels = parsed.voxels;
                    runtimeVoxels.set(id, voxels);
                }
            } catch (e) {
                console.warn('Не удалось пересобрать предпросмотр:', e);
            }
        }
    }

    if (activeProjectId !== id) return;

    const slider = $('#layerSlider');
    const valueLabel = $('#layerValue');

    if (voxels) {
        setPreviewEmpty(false);
        const height = voxels.size.y || 1;
        if (slider) {
            slider.disabled = false;
            slider.min = -1;
            slider.max = height - 1;
            slider.value = -1;
        }
        if (valueLabel) valueLabel.textContent = 'все';

        basePreviewMeta = `${fmt(project.blockCount)} блоков · ${fmt(project.uniqueBlocks)} материалов · ${dimensionsText(project.dimensions)}`
            + (voxels.sampled ? ' · превью с выборкой' : '');

        preview.setModel(voxels, ({ visible, total }) => {
            const extra = visible < total ? ` · показано ${fmt(visible)} из ${fmt(total)}` : '';
            if (meta) meta.textContent = basePreviewMeta + extra;
        });
    } else {
        setPreviewEmpty(
            true,
            'Предпросмотр недоступен',
            project.demo
                ? 'Демо-данные не содержат файл схемы — загрузите .schem или .litematic'
                : 'Исходный файл не найден в браузере — загрузите схему заново'
        );
        preview.setModel(null);
        if (slider) {
            slider.disabled = true;
            slider.min = -1;
            slider.max = 0;
            slider.value = -1;
        }
        if (valueLabel) valueLabel.textContent = 'все';
        if (meta) {
            meta.textContent = `${fmt(project.blockCount)} блоков · ${fmt(project.uniqueBlocks)} материалов`
                + (project.dimensions ? ` · ${dimensionsText(project.dimensions)}` : '');
        }
    }
}

/* ---------------- Удаление ---------------- */

async function removeProject(id) {
    const project = projectById(id);
    if (!project) return;
    if (!confirm(`Удалить схему «${project.name}» из проекта?`)) return;

    projects = projects.filter(p => p.id !== id);
    runtimeVoxels.delete(id);
    idbDelete(id);
    saveProjects();

    if (activeProjectId === id) {
        activeProjectId = projects.length ? projects[projects.length - 1].id : null;
    }
    renderAll();
    if (activeProjectId) await showPreviewFor(activeProjectId);
    else resetPreview();
    showToast('Схема удалена');
}

async function clearProjects() {
    if (!projects.length) {
        showToast('Список схем уже пуст', 'warning');
        return;
    }
    if (!confirm('Удалить все схемы? Отметки о добыче материалов сохранятся.')) return;

    projects = [];
    runtimeVoxels.clear();
    await idbClear();
    saveProjects();
    activeProjectId = null;
    renderAll();
    resetPreview();
    showToast('Все схемы удалены');
}

/* ---------------- События и запуск ---------------- */

function setupSelects() {
    $$('.select-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const select = trigger.closest('.custom-select');
            const isOpen = select.classList.contains('open');
            $$('.custom-select').forEach(s => s.classList.remove('open'));
            if (!isOpen) select.classList.add('open');
        });
    });

    document.addEventListener('click', () => {
        $$('.custom-select').forEach(s => s.classList.remove('open'));
    });

    $$('#sortSelect .select-option').forEach(option => {
        option.addEventListener('click', () => {
            sortMode = option.dataset.value;
            manualSort = null;
            const label = $('#sortLabel');
            if (label) label.textContent = option.textContent;
            $$('#sortSelect .select-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            $('#sortSelect').classList.remove('open');
            renderTables();
        });
    });

    $$('#customSelectModal .select-option').forEach(option => {
        option.addEventListener('click', () => {
            modalSortMode = option.dataset.value;
            const label = $('#selectedOptionTextModal');
            if (label) label.textContent = option.textContent;
            $$('#customSelectModal .select-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            $('#customSelectModal').classList.remove('open');
            renderMaterialsChecklist();
        });
    });
}

function setupTableEvents() {
    const search = $('#searchInput');
    if (search) {
        search.addEventListener('input', () => {
            searchQuery = search.value;
            renderTables();
        });
    }

    $$('.filter-buttons .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.filter-buttons .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatusFilter = btn.dataset.filter;
            renderTables();
        });
    });

    $$('#activeTable th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (manualSort && manualSort.col === col) {
                manualSort.dir *= -1;
            } else {
                manualSort = { col, dir: col === 'name' ? 1 : -1 };
            }
            renderTables();
        });
    });
}

function setupModals() {
    ['editModal', 'categoryModal', 'loginModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target !== modal) return;
            if (id === 'editModal') closeEditModal();
            if (id === 'categoryModal') closeCategoryModal();
            if (id === 'loginModal') closeLoginModal();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditModal();
            closeCategoryModal();
            closeLoginModal();
            $$('.custom-select').forEach(s => s.classList.remove('open'));
        }
    });

    const saveBtn = $('#saveObtainedBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveObtainedLocally);
    const valueInput = $('#modalValueInput');
    if (valueInput) {
        valueInput.addEventListener('input', calcModalRemaining);
        valueInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveObtainedLocally();
        });
    }

    const loginBtn = $('#loginSubmitBtn');
    if (loginBtn) loginBtn.addEventListener('click', login);
    const username = $('#usernameInput');
    if (username) {
        username.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') login();
        });
    }

    const catSubmit = $('#categorySubmitBtn');
    if (catSubmit) catSubmit.addEventListener('click', saveCategory);
    const catDelete = $('#categoryDeleteBtn');
    if (catDelete) catDelete.addEventListener('click', deleteCurrentCategory);
    const catSearch = $('#modalMaterialSearch');
    if (catSearch) catSearch.addEventListener('input', renderMaterialsChecklist);

    $$('[data-toggle]').forEach(header => {
        header.addEventListener('click', () => toggleCard(header.dataset.toggle));
    });
    $$('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.close === 'editModal') closeEditModal();
            if (btn.dataset.close === 'categoryModal') closeCategoryModal();
            if (btn.dataset.close === 'loginModal') closeLoginModal();
        });
    });
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const activeHeaderActions = $('#activeHeaderActions');
    if (activeHeaderActions) {
        activeHeaderActions.addEventListener('click', (e) => e.stopPropagation());
    }

    const openLoginBtn = $('#loginBtn');
    if (openLoginBtn) openLoginBtn.addEventListener('click', openLoginModal);
    const addCategoryBtn = $('#addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', openCategoryModal);

    const exportBtn = $('#exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportProject);
    const importBtn = $('#importBtn');
    const importInput = $('#importInput');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', () => {
            const file = importInput.files && importInput.files[0];
            if (file) importProject(file);
            importInput.value = '';
        });
    }

    const clearBtn = $('#clearProjectsBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearProjects);
}

function toggleCard(id) {
    const card = document.getElementById(id);
    if (card) card.classList.toggle('collapsed');
}

function bindGlobals() {
    window.toggleCard = toggleCard;
    window.openLoginModal = openLoginModal;
    window.openCategoryModal = openCategoryModal;
    window.closeEditModal = closeEditModal;
    window.closeCategoryModal = closeCategoryModal;
    window.closeLoginModal = closeLoginModal;
}

function ensureSystemCategory() {
    if (!categories.some(c => c.id === 'other')) {
        categories.push({ id: 'other', name: '📦 Прочее' });
        saveCategories();
    }
}

async function init() {
    bindGlobals();
    setupUpload();
    setupSelects();
    setupTableEvents();
    setupModals();
    initPreview();
    updateAuthUI();

    await migrateLegacyData();
    ensureSystemCategory();
    await loadDemoData();

    if (!activeProjectId && projects.length) {
        activeProjectId = projects[projects.length - 1].id;
    }

    renderAll();
    if (activeProjectId) await showPreviewFor(activeProjectId);
    else resetPreview();
}

init();
