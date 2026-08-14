async function loadTableData() {
    try {
        const response = await fetch('/api/resources');
        const data = await response.json();
        
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        data.forEach(item => {
            const remaining = item.required - item.obtained;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
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

document.addEventListener('DOMContentLoaded', loadTableData);