// frontend/hasil.js
// ============================================================
// RENDER HASIL DIAGNOSIS + LOGIKA KEYWORD GAMBAR (PakarCabai.AI)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Ambil Data dari Session atau Local Storage
    const diagnosisResult = JSON.parse(
        sessionStorage.getItem("diagnosisResult") ||
        localStorage.getItem("diagnosisResult")
    );

    // 2. Validasi Data
    if (!diagnosisResult || !diagnosisResult.diagnoses || diagnosisResult.diagnoses.length === 0) {
        alert("Data hasil diagnosis tidak ditemukan.");
        window.location.href = "rules.html";
        return;
    }

    // 3. Set Tanggal Laporan
    const dateElement = document.getElementById("current-date");
    if (dateElement) {
        dateElement.innerText = new Date().toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // 4. Jalankan Render
    renderModernLayout(diagnosisResult);
});

function renderModernLayout(data) {
    const container = document.getElementById("resultsContainer");
    if (!container) return;

    container.innerHTML = "";

    data.diagnoses.forEach((diag, index) => {
        const confidence = (diag.confidence * 100).toFixed(1);
        const isTop = index === 0;

        // --- LOGIKA PENCARIAN GAMBAR BERDASARKAN KATA KUNCI (KEYWORD) ---
        // Karena nama di database panjang: "Penyakit Busuk Buah Antraknosa (Collectotrichum...)"
        // Kita cari kata kunci pentingnya saja agar cocok dengan nama file di folder images.
        const nameInDb = diag.name.toLowerCase();
        let fileName = "default"; // Gambar cadangan jika tidak ada yang cocok

        if (nameInDb.includes("fusarium")) {
            fileName = "layu_fusarium";
        } else if (nameInDb.includes("bakteri")) {
            fileName = "layu_bakteri";
        } else if (nameInDb.includes("antraknosa")) {
            fileName = "antraknosa";
        } else if (nameInDb.includes("kuning")) {
            fileName = "virus_kuning";
        } else if (nameInDb.includes("bercak")) {
            fileName = "bercak_cabai";
        }

        const imagePath = `images/${fileName}.jpg`;
        console.log(`Matching: ${diag.name} -> File: ${imagePath}`);

        // Render list gejala yang dipilih user
        const matched = diag.matchedSymptoms?.map(s =>
            `<li class="flex items-center gap-2 text-xs font-bold text-slate-600 bg-chili-50/50 p-2 rounded-lg border border-chili-100/50">
                <i class="fa-solid fa-check-circle text-chili-500"></i> ${s}
            </li>`
        ).join("") || "<li class='text-xs italic text-slate-400'>Tidak ada gejala terlampir</li>";

        container.innerHTML += `
        <div class="animate-fade-up bg-white border-2 ${isTop ? 'border-chili-600 shadow-xl shadow-chili-600/10' : 'border-slate-100'} rounded-[2rem] p-6 md:p-10 relative overflow-hidden mb-8">
            
            ${isTop ? `
                <div class="absolute top-0 right-0 bg-chili-600 text-white px-6 py-2 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest z-10">
                    Akurasi Tertinggi
                </div>
            ` : ''}
            
            <div class="grid lg:grid-cols-3 gap-8 items-start">
                <div class="lg:col-span-2">
                    <span class="bg-chili-100 text-chili-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-4 inline-block">
                        ID: ${diag.code}
                    </span>
                    <h2 class="text-3xl font-black text-chili-900 mb-6 leading-tight">${diag.name}</h2>
                    
                    <div class="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex justify-center items-center">
                        <img src="${imagePath}" 
                             alt="${diag.name}" 
                             class="w-full h-64 object-cover"
                             onerror="this.src='images/default.jpg'; console.error('Gagal memuat: ${imagePath}');"> 
                    </div>

                    <div class="space-y-6">
                        <div>
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Analisis Gejala Terdeteksi:</span>
                            <ul class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                ${matched}
                            </ul>
                        </div>

                        <div class="pt-4 border-t border-slate-50">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Etiologi & Deskripsi:</span>
                            <p class="text-sm text-slate-600 leading-relaxed font-medium">${diag.description}</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                        <div class="text-5xl font-black text-chili-600">${confidence}%</div>
                        <div class="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Probability Score</div>
                    </div>

                    <div class="bg-chili-900 p-6 rounded-[2rem] shadow-xl shadow-chili-900/20 text-white">
                        <h4 class="text-[10px] font-black text-chili-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-hand-holding-medical"></i> Rekomendasi Pakar:
                        </h4>
                        <p class="text-xs leading-relaxed font-medium text-chili-50">
                            ${diag.solution}
                        </p>
                    </div>
                </div>
            </div>
        </div>`;
    });
}

// ============================================================
// FUNGSI DOWNLOAD PDF
// ============================================================
function downloadPDF() {
    const element = document.getElementById('report-area');
    
    if (typeof html2pdf === 'undefined') {
        alert("Library PDF sedang dimuat, silakan coba lagi.");
        return;
    }

    const options = {
        margin:       10,
        filename:     'Laporan-Diagnosa-Cabai-AI.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(element).save();
}

function printResult() {
    downloadPDF();
}