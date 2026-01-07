// frontend/diagnosis.js
// Logika Diagnosis untuk rules.html (FIXED & STABIL)

// =============================
// GLOBAL STATE
// =============================
let symptomDetails = {}; 

const uiGrouping = {
    daun: ['G01', 'G02', 'G04', 'G05', 'G10', 'G11', 'G13', 'G14', 'G15'],
    buah: ['G07', 'G08', 'G09'],
    akar: ['G03', 'G06', 'G12']
};

// =============================
// 1. FETCH GEJALA
// =============================
async function fetchSymptomsFromDB() {
    try {
        const response = await fetch('/api/gejala');
        if (!response.ok) throw new Error('Server error');

        const gejalaList = await response.json();

        // Normalisasi data
        gejalaList.forEach(g => {
            symptomDetails[g.id_gejala] = g.deskripsi;
        });

        document.getElementById('loadingMessage')?.classList.add('hidden');
        renderSymptoms();

    } catch (error) {
        console.error("Fetch Gejala Error:", error);
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) {
            loadingMsg.innerHTML = `
                <p class="text-red-600 font-bold p-4">
                    ⚠️ Gagal memuat data gejala dari database.
                </p>`;
        }
    }
}

// =============================
// 2. RENDER GEJALA
// =============================
function renderSymptoms() {

    const createSymptomHtml = (code, description) => `
        <label class="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm
                       hover:shadow-md transition cursor-pointer">
            <input type="checkbox" name="symptom" value="${code}" class="hidden peer">
            <span class="w-6 h-6 border-2 border-chili-primary rounded-full flex items-center justify-center mr-3">
                <svg class="w-4 h-4 hidden peer-checked:block text-white" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                          d="M5 13l4 4L19 7"/>
                </svg>
            </span>
            <div class="text-sm">
                <span class="font-bold text-gray-500 mr-2">${code}</span>
                ${description}
            </div>
        </label>
    `;

    Object.keys(uiGrouping).forEach(group => {
        const container = document.getElementById(`group-${group}`);
        if (!container) return;

        container.innerHTML = uiGrouping[group]
            .filter(code => symptomDetails[code])
            .map(code => createSymptomHtml(code, symptomDetails[code]))
            .join('');
    });

    // Event listener checkbox (lebih aman)
    document.querySelectorAll('input[name="symptom"]').forEach(cb => {
        cb.addEventListener('change', updateSelectedCount);
    });
}

// =============================
// 3. HITUNG GEJALA TERPILIH
// =============================
function updateSelectedCount() {
    const selected = document.querySelectorAll('input[name="symptom"]:checked').length;
    document.getElementById('selectedCount').textContent = selected;

    if (selected > 0) {
        document.getElementById('noSymptomMessage')?.classList.add('hidden');
    }
}

// =============================
// 4. SUBMIT DIAGNOSIS
// =============================
async function submitDiagnosis() {

    const selectedSymptoms = Array.from(
        document.querySelectorAll('input[name="symptom"]:checked')
    ).map(cb => cb.value);

    if (selectedSymptoms.length === 0) {
        document.getElementById('noSymptomMessage')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const btn = document.getElementById('startDiagnosisBtn');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.innerHTML = 'Memproses...';

    try {
        const response = await fetch('/api/diagnosis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms: selectedSymptoms })
        });

        const result = await response.json();

        if (!response.ok || !result.diagnoses) {
            throw new Error('Response diagnosis tidak valid');
        }

        // PAKSA STRUKTUR AGAR SESUAI hasil.js
        const finalResult = {
            diagnoses: result.diagnoses,
            input: selectedSymptoms
        };

        localStorage.setItem('diagnosisResult', JSON.stringify(finalResult));

        window.location.href = 'hasil.html';

    } catch (error) {
        console.error(error);
        alert('Gagal melakukan diagnosis. Pastikan server aktif & database terhubung.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// =============================
// 5. INIT
// =============================
document.addEventListener('DOMContentLoaded', () => {
    fetchSymptomsFromDB();
    document
        .getElementById('startDiagnosisBtn')
        ?.addEventListener('click', submitDiagnosis);
});
