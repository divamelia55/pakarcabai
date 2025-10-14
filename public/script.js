const SYMPTOMS = [
  { id: 'daun_menguning', name: 'Daun menguning' },
  { id: 'daun_layu', name: 'Daun layu' },
  { id: 'bintik_buah', name: 'Bintik pada buah' },
  { id: 'daun_bercak', name: 'Bercak pada daun' }
];

const container = document.getElementById('symptom-list');
SYMPTOMS.forEach(s => {
  const div = document.createElement('div');
  div.className = 'flex items-center gap-2';
  div.innerHTML = `<input type='checkbox' id='${s.id}' data-id='${s.id}' class='peer' /> <label for='${s.id}'>${s.name}</label>`;
  container.appendChild(div);
});

document.getElementById('diagnoseBtn').addEventListener('click', async () => {
  const checked = Array.from(document.querySelectorAll('#symptom-list input:checked')).map(i => i.dataset.id);
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<p class="text-sm text-gray-500">Mengirim ke API...</p>';

  try {
    const resp = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: checked })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Server error');

    if (data.diagnoses && data.diagnoses.length) {
      resultDiv.innerHTML = '<h2 class="font-semibold mt-3">Hasil Diagnosa</h2>' +
        data.diagnoses.map(d => `
          <div class="mt-2 p-3 bg-gray-50 rounded">
            <div class="font-medium">${d.disease}</div>
            <div class="text-sm text-gray-600">Confidence: ${(d.cf*100).toFixed(0)}%</div>
          </div>`).join('');
    } else {
      resultDiv.innerHTML = '<div class="text-sm text-gray-600 mt-2">Tidak ada diagnosis yang cocok.</div>';
    }
  } catch (err) {
    resultDiv.innerHTML = `<div class="text-red-600">${err.message}</div>`;
  }
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.querySelectorAll('#symptom-list input:checked').forEach(i => i.checked = false);
  document.getElementById('result').innerHTML = '';
});