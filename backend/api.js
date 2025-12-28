const express = require('express');
const router = express.Router();
const db = require('./db'); 

// -----------------------------------------------------------
// 1. API UNTUK DIAGNOSIS (FORWARD CHAINING)
// -----------------------------------------------------------

router.get('/gejala', async (req, res) => {
    try {
        const gejala = await db.getAllGejalaForFrontend();
        res.json(gejala);
    } catch (error) {
        console.error('API Error /gejala:', error); 
        res.status(500).json({ message: 'Gagal mengambil data gejala.', error: error.message });
    }
});

router.post('/diagnosis', async (req, res) => {
    const selectedSymptoms = req.body.symptoms; 
    if (!selectedSymptoms || selectedSymptoms.length === 0) {
        return res.status(400).json({ message: 'Pilih setidaknya satu gejala.' });
    }

    try {
        const rules = await db.getAllRules(); 
        const [allSymptoms] = await db.pool.query('SELECT code, name FROM symptoms');
        const symptomMap = {};
        allSymptoms.forEach(s => symptomMap[s.code] = s.name);

        const diseaseMatches = {};
        rules.forEach(rule => {
            if (!diseaseMatches[rule.id_penyakit]) {
                diseaseMatches[rule.id_penyakit] = { totalRuleSymptoms: 0, matchedSymptoms: [] };
            }
            diseaseMatches[rule.id_penyakit].totalRuleSymptoms++;
            if (selectedSymptoms.includes(rule.id_gejala)) {
                diseaseMatches[rule.id_penyakit].matchedSymptoms.push(symptomMap[rule.id_gejala]);
            }
        });

        const diseaseCodesArray = Object.keys(diseaseMatches).filter(code => 
            diseaseMatches[code].matchedSymptoms.length > 0
        );
        
        let diagnoses = [];
        if (diseaseCodesArray.length > 0) {
            const details = await db.getDiseaseDetailsByCodes(diseaseCodesArray);
            diagnoses = details.map(d => {
                const matchData = diseaseMatches[d.code];
                const realConfidence = matchData.matchedSymptoms.length / matchData.totalRuleSymptoms;
                return {
                    code: d.code,
                    name: d.name,
                    confidence: realConfidence, 
                    description: d.description,
                    solution: d.solution,
                    matchedSymptoms: matchData.matchedSymptoms
                };
            });
            diagnoses.sort((a, b) => b.confidence - a.confidence);
        }

        res.json({ message: 'Diagnosis berhasil', diagnoses });
    } catch (error) {
        res.status(500).json({ message: 'Error server diagnosis.', error: error.message });
    }
});

// -----------------------------------------------------------
// 2. API UNTUK ADMIN (CRUD) - PREFIX: /api/admin
// -----------------------------------------------------------

// --- PENYAKIT ---
router.get('/admin/penyakit', async (req, res) => {
    try {
        const [rows] = await db.pool.query('SELECT code, name, description, solution FROM penyakit ORDER BY code ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal load penyakit.', error: error.message });
    }
});

router.put('/admin/penyakit', async (req, res) => {
    const { code, name, description, solution, isEdit } = req.body;
    try {
        if (isEdit) {
            await db.pool.query('UPDATE penyakit SET name=?, description=?, solution=? WHERE code=?', [name, description, solution, code]);
        } else {
            await db.pool.query('INSERT INTO penyakit (code,name,description,solution) VALUES(?,?,?,?)', [code, name, description, solution]);
        }
        res.json({ message: 'Penyakit berhasil disimpan.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal simpan penyakit.', error: error.message });
    }
});

router.delete('/admin/penyakit/:code', async (req, res) => {
    const { code } = req.params;
    const conn = await db.pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM rules WHERE disease_code=?', [code]);
        await conn.query('DELETE FROM penyakit WHERE code=?', [code]);
        await conn.commit();
        res.json({ message: 'Penyakit berhasil dihapus.' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Gagal hapus penyakit.', error: error.message });
    } finally { conn.release(); }
});

// --- GEJALA ---
router.get('/admin/gejala', async (req, res) => {
    try {
        const [rows] = await db.pool.query('SELECT code, name, category FROM symptoms ORDER BY category, code ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal load gejala.', error: error.message });
    }
});

router.put('/admin/gejala', async (req, res) => {
    const { code, name, category, isEdit } = req.body;
    try {
        if (isEdit) {
            await db.pool.query('UPDATE symptoms SET name=?, category=? WHERE code=?', [name, category, code]);
        } else {
            await db.pool.query('INSERT INTO symptoms (code,name,category) VALUES(?,?,?)', [code, name, category]);
        }
        res.json({ message: 'Gejala berhasil disimpan.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal simpan gejala.', error: error.message });
    }
});

router.delete('/admin/gejala/:code', async (req, res) => {
    const { code } = req.params;
    const conn = await db.pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM rules WHERE symptom_code=?', [code]);
        await conn.query('DELETE FROM symptoms WHERE code=?', [code]);
        await conn.commit();
        res.json({ message: 'Gejala berhasil dihapus.' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Gagal hapus gejala.', error: error.message });
    } finally { conn.release(); }
});

// --- ATURAN ---
router.get('/admin/aturan', async (req, res) => {
    try {
        const [rules] = await db.pool.query('SELECT disease_code, symptom_code FROM rules');
        const [penyakit] = await db.pool.query('SELECT code, name FROM penyakit');
        const rulesMap = new Map();
        penyakit.forEach(p => rulesMap.set(p.code, { code: p.code, name: p.name, gejala: [] }));
        rules.forEach(rule => {
            if (rulesMap.has(rule.disease_code)) rulesMap.get(rule.disease_code).gejala.push(rule.symptom_code);
        });
        res.json(Array.from(rulesMap.values()));
    } catch (error) {
        res.status(500).json({ message: 'Error load aturan.', error: error.message });
    }
});

router.post('/admin/aturan/:diseaseCode', async (req, res) => {
    const { diseaseCode } = req.params;
    const { selectedSymptoms } = req.body;
    const conn = await db.pool.getConnection();
    try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM rules WHERE disease_code=?', [diseaseCode]);
        if (selectedSymptoms && selectedSymptoms.length > 0) {
            const values = selectedSymptoms.map(s => [diseaseCode, s]);
            await conn.query('INSERT INTO rules (disease_code, symptom_code) VALUES ?', [values]);
        }
        await conn.commit();
        res.json({ message: 'Aturan diperbarui.' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Gagal update aturan.', error: error.message });
    } finally { conn.release(); }
});

module.exports = router;