// frontend/admin.js (CRITICAL JS FOR ADMIN PANEL - MODIFIED FOR CATEGORY)

document.addEventListener('DOMContentLoaded', () => {
    // Tampilkan tab Penyakit secara default
    showTab('penyakit'); 
    
    // Setup event listener untuk form Penyakit
    document.getElementById('addPenyakitForm').addEventListener('submit', handlePenyakitSubmit);
    // Setup event listener untuk form Gejala
    document.getElementById('addGejalaForm').addEventListener('submit', handleGejalaSubmit);
    // Setup event listener untuk form Aturan
    document.getElementById('editRulesForm').addEventListener('submit', handleRulesSubmit);
    // Setup event listener untuk selector penyakit di modal aturan
    document.getElementById('penyakitSelector').addEventListener('change', loadSymptomsForRulesModal);

    // Initial load of data for all tabs
    loadPenyakit();
    loadGejala();
    loadAturan();
});

const API_BASE = '/api/admin';
const DOMAIN = 'http://localhost:3000';

/* =================================================================
    UTILITIES
================================================================= */

function showMessage(message, type = 'success') {
    const msgEl = document.getElementById('adminMessage');
    msgEl.innerHTML = `
        <div class="p-4 mb-4 rounded-lg font-medium text-sm border ${type === 'success' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}">
            ${message}
        </div>
    `;
    msgEl.classList.remove('hidden');
    setTimeout(() => msgEl.classList.add('hidden'), 5000);
}

function showForm(formId, isEdit) {
    const form = document.getElementById(formId);
    const title = document.getElementById(formId + 'Title');
    const isEditing = isEdit !== false; 

    form.classList.remove('hidden');
    
    if (formId === 'formPenyakit') {
        document.getElementById('kodeP').disabled = isEditing;
        title.textContent = isEditing ? 'Edit Data Penyakit' : 'Tambah Data Penyakit Baru';
    } else if (formId === 'formGejala') {
        // --- MODIFIKASI: RESET KATEGORI DAN KODE ---
        if (!isEditing) {
            document.getElementById('kodeG').value = '';
            document.getElementById('namaG').value = '';
            document.getElementById('gejalaCategory').value = ''; 
        }
        document.getElementById('kodeG').disabled = isEditing;
        title.textContent = isEditing ? 'Edit Data Gejala' : 'Tambah Data Gejala Baru';
        // ------------------------------------------
    }
    
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideForm(formId) {
    document.getElementById(formId).classList.add('hidden');
    // Clear form fields
    document.getElementById(formId.replace('form', 'add') + 'Form').reset();
    // Khusus Gejala, reset kategori juga
    if (formId === 'formGejala') {
        document.getElementById('gejalaCategory').value = '';
    }
    document.getElementById(formId.replace('form', 'edit') + 'Code').value = '';
}

function showTab(tabName) {
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.add('hidden');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('tab-active');
    });

    document.getElementById(tabName).classList.remove('hidden');
    document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('tab-active');
}

/* =================================================================
    CRUD PENYAKIT (TIDAK BERUBAH)
================================================================= */

async function loadPenyakit() {
    const tbody = document.getElementById('tablePenyakitBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400">Memuat data...</td></tr>';
    try {
        const response = await fetch(API_BASE + '/penyakit');
        const data = await response.json();
        
        tbody.innerHTML = ''; 

        if (data.error || !response.ok) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 font-bold">Gagal memuat data: ${data.error || 'Server Error'}</td></tr>`;
            return;
        }

        data.forEach(p => {
            // FIX: Menggunakan string literal (\`) untuk menangani data yang mungkin mengandung karakter '
            const row = `
                <tr>
                    <td><span class="code-badge">${p.code}</span></td>
                    <td>${p.name}</td>
                    <td>
                        <p class="font-bold text-sm text-gray-700">Deskripsi:</p> ${p.description || 'N/A'}
                        <p class="font-bold text-sm text-gray-700 mt-2">Solusi:</p> ${p.solution || 'N/A'}
                    </td>
                    <td class="text-center">
                        <button onclick="editPenyakit('${p.code}', '${p.name}', \`${p.description.replace(/`/g, '\\`') || ''}\`, \`${p.solution.replace(/`/g, '\\`') || ''}\`)" class="action-btn edit text-primary hover:text-primaryDark">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button onclick="deletePenyakit('${p.code}')" class="action-btn delete text-danger hover:text-red-700 ml-2">
                            <i class="fa fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 font-bold">Error Jaringan: ${error.message}</td></tr>`;
    }
}

function editPenyakit(code, name, description, solution) {
    document.getElementById('editPenyakitCode').value = code;
    document.getElementById('kodeP').value = code;
    document.getElementById('namaP').value = name;
    document.getElementById('deskripsiP').value = description;
    document.getElementById('solusiP').value = solution;
    showForm('formPenyakit', true);
}

async function handlePenyakitSubmit(event) {
    event.preventDefault();
    
    const code = document.getElementById('kodeP').value.trim();
    const name = document.getElementById('namaP').value.trim();
    const description = document.getElementById('deskripsiP').value.trim();
    const solution = document.getElementById('solusiP').value.trim();
    const isEdit = !!document.getElementById('editPenyakitCode').value; 

    try {
        const response = await fetch(API_BASE + '/penyakit', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name, description, solution, isEdit })
        });
        const data = await response.json();

        if (response.ok) {
            showMessage(data.message);
            hideForm('formPenyakit');
            loadPenyakit(); 
            loadAturan(); 
        } else {
            showMessage(data.message || 'Gagal menyimpan data.', 'error');
        }
    } catch (error) {
        showMessage('Error jaringan saat menyimpan penyakit.', 'error');
    }
}

async function deletePenyakit(code) {
    if (!confirm(`Yakin ingin menghapus Penyakit ${code} dan semua aturannya?`)) return;

    try {
        const response = await fetch(API_BASE + `/penyakit/${code}`, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
            showMessage(data.message);
            loadPenyakit(); 
            loadAturan(); 
        } else {
            showMessage(data.message || 'Gagal menghapus data.', 'error');
        }
    } catch (error) {
        showMessage('Error jaringan saat menghapus penyakit.', 'error');
    }
}

/* =================================================================
    CRUD GEJALA (MODIFIKASI KRITIS)
================================================================= */

async function loadGejala() {
    const tbody = document.getElementById('tableGejalaBody');
    // Kolom 4 karena ada KODE, DESKRIPSI, KATEGORI, AKSI
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400">Memuat data...</td></tr>'; 
    try {
        const response = await fetch(API_BASE + '/gejala');
        // API sekarang mengembalikan: { code, name, category }
        const data = await response.json();
        
        tbody.innerHTML = ''; 

        if (data.error || !response.ok) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 font-bold">Gagal memuat data: ${data.error || 'Server Error'}</td></tr>`;
            return;
        }

        data.forEach(g => {
            // Mengganti tanda kutip tunggal di data untuk mencegah error di onclick
            const nameSafe = g.name.replace(/'/g, "\\'");
            const categorySafe = g.category ? g.category.replace(/'/g, "\\'") : '';
            
            const row = `
                <tr>
                    <td><span class="code-badge">${g.code}</span></td>
                    <td>${g.name}</td>
                    <td><span class="text-gray-600 font-semibold">${g.category || '-'}</span></td> <td class="text-center">
                        <button onclick="editGejala('${g.code}', '${nameSafe}', '${categorySafe}')" class="action-btn edit text-primary hover:text-primaryDark">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button onclick="deleteGejala('${g.code}')" class="action-btn delete text-danger hover:text-red-700 ml-2">
                            <i class="fa fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 font-bold">Error Jaringan: ${error.message}</td></tr>`;
    }
}

// Menambahkan parameter 'category'
function editGejala(code, name, category) {
    document.getElementById('editGejalaCode').value = code;
    document.getElementById('kodeG').value = code;
    document.getElementById('namaG').value = name;
    document.getElementById('gejalaCategory').value = category; // Field Kategori baru
    showForm('formGejala', true);
}

async function handleGejalaSubmit(event) {
    event.preventDefault();
    
    const code = document.getElementById('kodeG').value.trim();
    const name = document.getElementById('namaG').value.trim();
    // Parameter baru
    const category = document.getElementById('gejalaCategory').value.trim(); 
    const isEdit = !!document.getElementById('editGejalaCode').value;

    if (!code || !name || !category) {
        showMessage('Kode, Deskripsi, dan Kategori harus diisi!', 'error');
        return;
    }

    try {
        const response = await fetch(API_BASE + '/gejala', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            // Kirim data kategori
            body: JSON.stringify({ code, name, category, isEdit })
        });
        const data = await response.json();

        if (response.ok) {
            showMessage(data.message);
            hideForm('formGejala');
            loadGejala(); 
            loadAturan(); 
        } else {
            showMessage(data.message || 'Gagal menyimpan data.', 'error');
        }
    } catch (error) {
        showMessage('Error jaringan saat menyimpan gejala.', 'error');
    }
}

async function deleteGejala(code) {
    if (!confirm(`Yakin ingin menghapus Gejala ${code} dan semua aturannya?`)) return;

    try {
        const response = await fetch(API_BASE + `/gejala/${code}`, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
            showMessage(data.message);
            loadGejala(); 
            loadAturan(); 
        } else {
            showMessage(data.message || 'Gagal menghapus data.', 'error');
        }
    } catch (error) {
        showMessage('Error jaringan saat menghapus gejala.', 'error');
    }
}

/* =================================================================
    CRUD ATURAN (RULES - TIDAK BERUBAH)
================================================================= */

async function populatePenyakitSelector() {
    const selector = document.getElementById('penyakitSelector');
    selector.innerHTML = '<option value="">-- Pilih Penyakit --</option>'; 

    try {
        const response = await fetch(API_BASE + '/penyakit');
        const data = await response.json();
        data.forEach(p => {
            const option = document.createElement('option');
            option.value = p.code;
            option.textContent = `${p.code} - ${p.name}`;
            selector.appendChild(option);
        });
    } catch (error) {
        console.error("Gagal mengisi selector penyakit:", error);
    }
}

async function loadGejalaCheckboxes() {
    const container = document.getElementById('gejalaCheckboxes');
    container.innerHTML = 'Memuat gejala...'; 
    try {
        // API Gejala di db.js sekarang mengembalikan category, tapi tidak dipakai di sini. OK.
        const response = await fetch(API_BASE + '/gejala');
        const gejala = await response.json();

        container.innerHTML = '';
        if (gejala.length === 0) {
            container.innerHTML = '<p class="text-sm text-red-500">Tambahkan data Gejala terlebih dahulu.</p>';
            return;
        }

        gejala.forEach(g => {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-2 p-2 bg-white rounded shadow-sm border cursor-pointer hover:bg-gray-50 transition';
            // Tambahkan kategori di sini (Opsional, tapi membantu admin)
            const categoryText = g.category ? `(${g.category})` : '';
            label.innerHTML = `
                <input type="checkbox" name="symptom" value="${g.code}" class="w-4 h-4 text-chili-primary border-gray-300 rounded">
                <span class="text-sm">${g.code} - ${g.name} <span class="text-xs italic text-gray-400">${categoryText}</span></span>
            `;
            container.appendChild(label);
        });
    } catch (error) {
        container.innerHTML = '<p class="text-sm text-red-500">Gagal memuat daftar gejala.</p>';
    }
}


async function loadSymptomsForRulesModal() {
    const diseaseCode = document.getElementById('penyakitSelector').value;
    const checkboxes = document.querySelectorAll('#gejalaCheckboxes input[type="checkbox"]');
    
    checkboxes.forEach(cb => cb.checked = false);

    if (!diseaseCode) {
        return; 
    }
    
    const tbody = document.getElementById('tableAturanBody');
    const rulesData = Array.from(tbody.children).map(row => JSON.parse(row.dataset.rules));
    
    const rule = rulesData.find(r => r.code === diseaseCode);

    if (rule && rule.gejala) {
        checkboxes.forEach(cb => {
            if (rule.gejala.includes(cb.value)) {
                cb.checked = true;
            }
        });
    }
}

async function loadAturan() {
    const tbody = document.getElementById('tableAturanBody');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-gray-400">Memuat data...</td></tr>';
    try {
        const response = await fetch(API_BASE + '/aturan');
        const data = await response.json();
        
        tbody.innerHTML = ''; 

        if (data.error || !response.ok) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500 font-bold">Gagal memuat data: ${data.error || 'Server Error'}</td></tr>`;
            return;
        }
        
        const gejalaResponse = await fetch(API_BASE + '/gejala');
        const gejalaList = await gejalaResponse.json();
        const gejalaMap = new Map(gejalaList.map(g => [g.code, g.name]));

        data.forEach(r => {
            const gejalaBadges = r.gejala.map(gCode => {
                const gName = gejalaMap.get(gCode) || 'Deskripsi Kosong';
                return `<span class="code-badge" title="${gName}">${gCode}</span>`;
            }).join('');

            const row = `
                <tr data-rules='${JSON.stringify(r)}'>
                    <td><span class="code-badge">${r.code}</span> ${r.name}</td>
                    <td>${gejalaBadges}</td>
                    <td class="text-center font-bold text-lg">${r.gejala.length}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-red-500 font-bold">Error Jaringan: ${error.message}</td></tr>`;
    }
}

async function handleRulesSubmit(event) {
    event.preventDefault();

    const diseaseCode = document.getElementById('penyakitSelector').value;
    if (!diseaseCode) {
        alert('Pilih Penyakit terlebih dahulu!');
        return;
    }

    const selectedSymptoms = [...document.querySelectorAll('#gejalaCheckboxes input:checked')]
        .map(cb => cb.value);
    
    document.getElementById('saveRulesButton').disabled = true;

    try {
        const response = await fetch(API_BASE + `/aturan/${diseaseCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedSymptoms })
        });
        const data = await response.json();

        if (response.ok) {
            showMessage(data.message);
            closeRulesModal();
            loadAturan(); 
        } else {
            showMessage(data.message || 'Gagal menyimpan aturan.', 'error');
        }
    } catch (error) {
        showMessage('Error jaringan saat menyimpan aturan.', 'error');
    } finally {
        document.getElementById('saveRulesButton').disabled = false;
    }
}


function openRulesModal() {
    document.getElementById('rulesModal').classList.remove('hidden');
    loadGejalaCheckboxes(); 
    populatePenyakitSelector(); 
}

function closeRulesModal() {
    document.getElementById('rulesModal').classList.add('hidden');
    document.getElementById('editRulesForm').reset();
}