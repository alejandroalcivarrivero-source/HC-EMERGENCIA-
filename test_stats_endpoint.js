// Using native fetch available in Node.js 18+
async function testStats() {
    try {
        console.log("Attempting login...");
        const loginRes = await fetch('http://localhost:3001/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario: 'admin', 
                password: '123'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed with status: ${loginRes.status}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Login successful, token obtained.");

        // 2. Call the new endpoint
        console.log("Calling /api/estadistica/produccion-diaria...");
        const statsRes = await fetch('http://localhost:3001/api/estadistica/produccion-diaria', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!statsRes.ok) {
            throw new Error(`Stats failed with status: ${statsRes.status}`);
        }

        const statsData = await statsRes.json();

        console.log("Response data keys:", Object.keys(statsData));
        if (statsData.kpis) console.log("KPIs:", statsData.kpis);
        if (statsData.graficos) {
            console.log("Graficos keys:", Object.keys(statsData.graficos));
            console.log("Flujo por hora (sample):", statsData.graficos.flujoPorHora ? statsData.graficos.flujoPorHora.slice(0, 2) : 'No data');
            console.log("Produccion por usuario (sample):", statsData.graficos.produccionPorUsuario ? statsData.graficos.produccionPorUsuario.slice(0, 2) : 'No data');
        }

    } catch (error) {
        console.error("Test failed:", error.message);
    }
}

testStats();
