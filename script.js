// Ganti URL ini dengan URL API Web App Google Apps Script Anda
const API_URL = 'https://script.google.com/macros/s/AKfycbwLp9Sdd0VmZXqfhqxqssjRcU2zz77XWsldYRsketlCnlTIUNkjjAeebMl80FwvCntUog/exec';

let chartBerat, chartTinggi;
const textColor = '#333333';

function getIdealData(ageInMonths) {
    if (ageInMonths <= 12) {
        return { idealBerat: 9.5, idealTinggi: 75 };
    } else if (ageInMonths <= 24) {
        return { idealBerat: 12.0, idealTinggi: 87 };
    } else if (ageInMonths <= 36) {
        return { idealBerat: 14.0, idealTinggi: 96 };
    }
    return { idealBerat: null, idealTinggi: null };
}

async function searchData() {
    const childName = document.getElementById('search-input').value.trim();
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    loadingDiv.classList.remove('hidden');
    resultsDiv.innerHTML = '';

    if (childName === '') {
        loadingDiv.classList.add('hidden');
        resultsDiv.innerHTML = '<p style="text-align: center;">Silakan masukkan nama anak.</p>';
        return;
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Gagal mengambil data dari server.');
        }
        const data = await response.json();
        
        const filteredData = data.filter(item => 
            item.Nama.trim().toLowerCase() === childName.toLowerCase()
        );

        loadingDiv.classList.add('hidden');

        if (filteredData.length > 0) {
            displayResults(filteredData);
        } else {
            resultsDiv.innerHTML = `<p style="text-align: center;">Data untuk anak dengan nama "${childName}" tidak ditemukan.</p>`;
        }
    } catch (error) {
        loadingDiv.classList.add('hidden');
        resultsDiv.innerHTML = `<p style="color: red; text-align: center;">Terjadi kesalahan: ${error.message}</p>`;
        console.error(error);
    }
}

// Fungsi untuk menampilkan hasil pencarian ke halaman
function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const childInfo = data[0];
    const formattedTanggalLahir = new Date(childInfo['Tanggal Lahir']).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    resultsDiv.innerHTML = `
        <div class="child-info">
            <h2>Informasi Anak: ${childInfo.Nama}</h2>
            <p><strong>Tanggal Lahir:</strong> ${formattedTanggalLahir}</p>
            <p><strong>Jenis Kelamin:</strong> ${childInfo['Jenis Kelamin']}</p>
        </div>
    `;

    let tableHtml = `
        <h3>Riwayat Pengecekan</h3>
        <table>
            <thead>
                <tr>
                    <th>Waktu</th>
                    <th>Umur (Bulan)</th>
                    <th>Berat (kg)</th>
                    <th>Tinggi (cm)</th>
                    <th>Z-Score BB/U</th>
                    <th>Status BB/U</th>
                    <th>Z-Score TB/U</th>
                    <th>Status TB/U</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.sort((a, b) => new Date(a.Waktu) - new Date(b.Waktu));

    data.forEach(item => {
        const formattedWaktuPengecekan = new Date(item.Waktu).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        tableHtml += `
            <tr>
                <td>${formattedWaktuPengecekan}</td>
                <td>${item['Umur(Bulan)']}</td>
                <td>${item.Berat}</td>
                <td>${item.Tinggi}</td>
                <td>${item['Z-Score BB/U']}</td>
                <td>${item['Status BB/U']}</td>
                <td>${item['Z-Score TB/U']}</td>
                <td>${item['Status TB/U']}</td>
            </tr>
        `;
    });
    tableHtml += `
            </tbody>
        </table>
    `;
    resultsDiv.innerHTML += tableHtml;
    
    createGrowthChart(data);
}

// Fungsi untuk membuat dan menampilkan grafik
function createGrowthChart(data) {
    const labels = data.map(item => `${item['Umur(Bulan)']} bln`);
    const beratData = data.map(item => item.Berat);
    const tinggiData = data.map(item => item.Tinggi);

    const idealBeratData = data.map(item => getIdealData(item['Umur(Bulan)']).idealBerat);
    const idealTinggiData = data.map(item => getIdealData(item['Umur(Bulan)']).idealTinggi);

    const chartContainerHtml = `
        <div class="chart-container">
            <h3>Grafik Pertumbuhan Berat Badan</h3>
            <canvas id="beratChart"></canvas>
        </div>
        <div class="chart-container">
            <h3>Grafik Pertumbuhan Tinggi Badan</h3>
            <canvas id="tinggiChart"></canvas>
        </div>
    `;
    document.getElementById('results').innerHTML += chartContainerHtml;

    if (chartBerat) chartBerat.destroy();
    if (chartTinggi) chartTinggi.destroy();

    const ctxBerat = document.getElementById('beratChart').getContext('2d');
    chartBerat = new Chart(ctxBerat, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Berat Anak (kg)',
                    data: beratData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Berat Ideal (kg)',
                    data: idealBeratData,
                    borderColor: '#28a745',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Berat (kg)',
                        color: textColor
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Umur',
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });

    const ctxTinggi = document.getElementById('tinggiChart').getContext('2d');
    chartTinggi = new Chart(ctxTinggi, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Tinggi Anak (cm)',
                    data: tinggiData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Tinggi Ideal (cm)',
                    data: idealTinggiData,
                    borderColor: '#28a745',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tinggi (cm)',
                        color: textColor
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Umur',
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}
// ... (kode lainnya tetap sama)

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const childInfo = data[0];
    const formattedTanggalLahir = new Date(childInfo['Tanggal Lahir']).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    resultsDiv.innerHTML = `
        <div class="child-info">
            <h2>Informasi Anak: ${childInfo.Nama}</h2>
            <p><strong>Tanggal Lahir:</strong> ${formattedTanggalLahir}</p>
            <p><strong>Jenis Kelamin:</strong> ${childInfo['Jenis Kelamin']}</p>
        </div>
    `;

    let tableHtml = `
        <h3>Riwayat Pengecekan</h3>
        <table>
            <thead>
                <tr>
                    <th>Waktu</th>
                    <th>Umur (Bulan)</th>
                    <th>Berat (kg)</th>
                    <th>Tinggi (cm)</th>
                    <th>Z-Score BB/U</th>
                    <th>Status BB/U</th>
                    <th>Z-Score TB/U</th>
                    <th>Status TB/U</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.sort((a, b) => new Date(a.Waktu) - new Date(b.Waktu));

    data.forEach(item => {
        const formattedWaktuPengecekan = new Date(item.Waktu).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        tableHtml += `
            <tr>
                <td>${formattedWaktuPengecekan}</td>
                <td>${item['Umur(Bulan)']}</td>
                <td>${Number(item.Berat).toFixed(1)}</td>
                <td>${Number(item.Tinggi).toFixed(1)}</td>
                <td>${item['Z-Score BB/U']}</td>
                <td>${item['Status BB/U']}</td>
                <td>${item['Z-Score TB/U']}</td>
                <td>${item['Status TB/U']}</td>
            </tr>
        `;
    });
    tableHtml += `
            </tbody>
        </table>
    `;
    resultsDiv.innerHTML += tableHtml;
    
    createGrowthChart(data);
}