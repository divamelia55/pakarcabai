const tableBody = document.getElementById('symptomsTable');
const codeInput = document.getElementById('codeInput');
const nameInput = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');

// ======================
// Fetch & Tampilkan Semua Gejala
// ======================
async function fetchSymptoms() {
  try {
    const res = await fetch('/api/symptoms');
    const data = await res.json();
    tableBody.innerHTML = '';
    data.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id}</td>
        <td><input class="table-input" value="${item.code}" data-id="${item.id}" data-field="code"></td>
        <td><input class="table-input" value="${item.name}" data-id="${item.id}" data-field="name"></td>
        <td>
          <button class="btn-edit" data-id="${item.id}">Simpan</button>
          <button class="btn-delete" data-id="${item.id}">Hapus</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

// ======================
// Tambah Gejala
// ======================
addBtn.addEventListener('click', async () => {
  const code = codeInput.value.trim();
  const name = nameInput.value.trim();
  if (!code || !name) return alert('Isi Code & Name');

  try {
    const res = await fetch('/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, name })
    });
    const newItem = await res.json();
    codeInput.value = '';
    nameInput.value = '';
    fetchSymptoms();
  } catch (err) {
    console.error(err);
  }
});

// ======================
// Edit & Delete (Event Delegation)
// ======================
tableBody.addEventListener('click', async e => {
  const id = e.target.dataset.id;
  if (!id) return;

  // Edit
  if (e.target.classList.contains('btn-edit')) {
    const row = e.target.closest('tr');
    const code = row.querySelector('input[data-field="code"]').value.trim();
    const name = row.querySelector('input[data-field="name"]').value.trim();
    if (!code || !name) return alert('Isi Code & Name');

    try {
      await fetch(`/api/symptoms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name })
      });
      fetchSymptoms();
    } catch (err) {
      console.error(err);
    }
  }

  // Delete
  if (e.target.classList.contains('btn-delete')) {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      await fetch(`/api/symptoms/${id}`, { method: 'DELETE' });
      fetchSymptoms();
    } catch (err) {
      console.error(err);
    }
  }
});

// ======================
// Init
// ======================
fetchSymptoms();
