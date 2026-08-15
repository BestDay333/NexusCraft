// Дефолтные категории или загрузка сохраненных из localStorage
let categories = JSON.parse(localStorage.getItem('project_categories')) || [
    { id: 'wool', name: '🧶 Шерсть и ковры' },
    { id: 'clay', name: '🏺 Керамика и терракота' },
    { id: 'wood', name: '🪵 Дерево' },
    { id: 'stone', name: '🧱 Камень и блоки' },
    { id: 'other', name: '📦 Прочее' }
];

function saveCategories() {
    localStorage.setItem('project_categories', JSON.stringify(categories));
}

function getMaterialCategoriesMap() {
    return JSON.parse(localStorage.getItem('material_categories_map')) || {};
}

function saveMaterialCategoryMap(map) {
    localStorage.setItem('material_categories_map', JSON.stringify(map));
}

// Генерация выпадающего списка категорий
function getCategorySelectHTML(materialName) {
    let materialMap = getMaterialCategoriesMap();
    let assignedCat = materialMap[materialName] || 'other';
    
    let options = categories.map(cat => 
        `<option value="${cat.id}" ${cat.id === assignedCat ? 'selected' : ''}>${cat.name}</option>`
    ).join('');
    
    return `<select class="material-cat-select" data-material="${encodeURIComponent(materialName)}" onchange="changeMaterialCategory(this)">${options}</select>`;
}

// Смена категории при выборе в селекте
function changeMaterialCategory(selectElement) {
    const newCatId = selectElement.value;
    const materialName = decodeURIComponent(selectElement.dataset.material);
    
    let materialMap = getMaterialCategoriesMap();
    materialMap[materialName] = newCatId;
    saveMaterialCategoryMap(materialMap);
    
    // Обновляем дата-атрибут строки для фильтрации
    const row = selectElement.closest('tr');
    row.dataset.category = newCatId;
}

// Инициализация интерфейса категорий (кнопка и фильтры)
function initCategoriesUI() {
    const container = document.querySelector('.filters') || document.body;
    
    let wrapper = document.getElementById('categoryFiltersWrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'categoryFiltersWrapper';
        wrapper.className = 'category-filters-container';
        wrapper.style.marginBottom = '15px';
        wrapper.style.display = 'flex';
        wrapper.style.gap = '8px';
        wrapper.style.flexWrap = 'wrap';
        container.prepend(wrapper);
    }
    
    renderCategoryFilterButtons();

    if (!document.getElementById('addCatBtn')) {
        const addBtn = document.createElement('button');
        addBtn.id = 'addCatBtn';
        addBtn.className = 'btn-add-category';
        addBtn.innerHTML = '+ Новая категория';
        addBtn.onclick = addNewCategory;
        wrapper.appendChild(addBtn);
    }
}

// Рендер кнопок фильтрации
function renderCategoryFilterButtons() {
    const wrapper = document.getElementById('categoryFiltersWrapper');
    if (!wrapper) return;

    wrapper.querySelectorAll('.cat-filter-btn').forEach(b => b.remove());

    const allBtn = document.createElement('button');
    allBtn.className = 'cat-filter-btn active';
    allBtn.innerHTML = '📂 Все';
    allBtn.onclick = () => filterTableByCategory('all', allBtn);
    wrapper.prepend(allBtn);

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-filter-btn';
        btn.innerHTML = cat.name;
        btn.onclick = () => filterTableByCategory(cat.id, btn);
        wrapper.insertBefore(btn, document.getElementById('addCatBtn'));
    });
}

// Добавление новой категории через промпт
function addNewCategory() {
    const catName = prompt("Введите название новой категории:");
    if (!catName || catName.trim() === "") return;

    const catId = 'cat_' + Date.now();
    categories.push({ id: catId, name: catName.trim() });
    
    saveCategories();
    initCategoriesUI();
    loadTableData(); // Перезагружаем таблицу для обновления селектов
}

// Фильтрация
function filterTableByCategory(catId, clickedBtn) {
    document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');

    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach(row => {
        if (catId === 'all' || row.dataset.category === catId) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Основная функция загрузки данных (модифицированная)
async function loadTableData() {
    try {
        const response = await fetch('/api/resources');
        const data = await response.json();
        
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        const materialMap = getMaterialCategoriesMap();

        data.forEach(item => {
            const remaining = item.required - item.obtained;
            const currentCat = materialMap[item.name] || 'other';
            
            const row = document.createElement('tr');
            row.dataset.category = currentCat; // Сохраняем категорию в дата-атрибут строки для фильтров
            
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${getCategorySelectHTML(item.name)}</td>
                <td>${item.required.toLocaleString()}</td>
                <td>${item.obtained.toLocaleString()}</td>
                <td>${remaining.toLocaleString()}</td>
                <td><span class="badge ${item.status}">${item.status === 'closed' ? 'Закрыто' : 'В процессе'}</span></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCategoriesUI();
    loadTableData();
});