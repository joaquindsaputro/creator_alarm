// Konfigurasi Negara
const regions = [
    { id: 'ny', name: 'New York', zone: 'America/New_York' },
    { id: 'la', name: 'Los Angeles', zone: 'America/Los_Angeles' },
    { id: 'ksa', name: 'Arab Saudi', zone: 'Asia/Riyadh' },
    { id: 'uae', name: 'Dubai', zone: 'Asia/Dubai' },
    { id: 'uk', name: 'London', zone: 'Europe/London' },
    { id: 'ger', name: 'Berlin', zone: 'Europe/Berlin' },
    { id: 'ind', name: 'India', zone: 'Asia/Kolkata' },
    { id: 'jpn', name: 'Tokyo', zone: 'Asia/Tokyo' }
];

// State & DOM Elements
let use24h = localStorage.getItem('use24h') !== 'false';
let showPrimeOnly = localStorage.getItem('primeOnly') === 'true';
let dndMode = localStorage.getItem('dndMode') === 'true';
let alarmSound = localStorage.getItem('alarmSound') || 'chime';
let alarms = JSON.parse(localStorage.getItem('alarms') || '{}');

const container = document.getElementById('card-container');
const statLocal = document.getElementById('stat-local');
const statPrime = document.getElementById('stat-prime');
const statAlarm = document.getElementById('stat-alarm');
const bottomBar = document.getElementById('bottom-bar');

// Inisialisasi Settings UI
document.getElementById('toggle-24h').checked = use24h;
document.getElementById('toggle-prime-only').checked = showPrimeOnly;
document.getElementById('toggle-dnd').checked = dndMode;
document.getElementById('select-sound').value = alarmSound;
updateDndUI();

// Event Listeners untuk Bottom Bar Settings
document.getElementById('toggle-24h').addEventListener('change', (e) => { use24h = e.target.checked; localStorage.setItem('use24h', use24h); updateDashboard(); });
document.getElementById('toggle-prime-only').addEventListener('change', (e) => { showPrimeOnly = e.target.checked; localStorage.setItem('primeOnly', showPrimeOnly); updateDashboard(); });
document.getElementById('select-sound').addEventListener('change', (e) => { alarmSound = e.target.value; localStorage.setItem('alarmSound', alarmSound); });
document.getElementById('toggle-dnd').addEventListener('change', (e) => { dndMode = e.target.checked; localStorage.setItem('dndMode', dndMode); updateDndUI(); });

function updateDndUI() {
    bottomBar.className = dndMode 
        ? "fixed bottom-0 w-full bg-red-950/80 border-t border-red-900 p-3 z-50 transition-colors duration-300"
        : "fixed bottom-0 w-full bg-gray-900 border-t border-gray-800 p-3 z-50 transition-colors duration-300";
}

// Fungsi Trigger Alarm
function playAlarm(regionName) {
    if (dndMode) return;
    const audio = document.getElementById(`audio-${alarmSound}`);
    if(audio) { audio.currentTime = 0; audio.play().catch(e => console.log("Autoplay blocked")); }
    
    // Push Notification Trigger
    if (Notification.permission === "granted") {
        new Notification("Waktunya Upload!", {
            body: `Sekarang Prime Time di ${regionName}.`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3159/3159066.png'
        });
    }
}

// Main Update Loop
function updateDashboard() {
    const now = new Date();
    statLocal.innerText = now.toLocaleTimeString('id-ID', { hour12: !use24h, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    let activePrimeCount = 0;
    let activeAlarmCount = 0;
    container.innerHTML = ''; // Reset grid

    regions.forEach(region => {
        // Ambil waktu spesifik region
        const timeOptions = { timeZone: region.zone, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
        const regionTimeStr = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
        // Pecah string "23:45:00" menjadi angka
        const [hour, minute] = regionTimeStr.split(':').map(Number);
        
        const isPrime = hour >= 18 && hour <= 23;
        const isAlarmOn = alarms[region.id] === true;
        
        if (isPrime) activePrimeCount++;
        if (isAlarmOn) activeAlarmCount++;

        // Filter: Sembunyikan jika "Show Prime Only" aktif dan ini bukan prime time
        if (showPrimeOnly && !isPrime) return;

        // Logika Countdown Off-Peak (Hitung mundur ke 18:00 terdekat)
        let countdownText = "";
        if (!isPrime) {
            let minsUntil18 = (18 * 60) - ((hour * 60) + minute);
            if (minsUntil18 < 0) minsUntil18 += (24 * 60); // Jika sudah lewat tengah malam, tambah 1 hari
            const hLeft = Math.floor(minsUntil18 / 60);
            const mLeft = minsUntil18 % 60;
            countdownText = `Dalam ${hLeft}j ${mLeft}m`;
        }

        // Trigger Alarm (Jika masuk jam 18:00 tepat dan alarm aktif)
        if (isPrime && hour === 18 && minute === 0 && now.getSeconds() === 0 && isAlarmOn) {
            playAlarm(region.name);
        }

        // Render Kartu (Tampilan berbeda antara Prime dan Off-Peak)
        const displayTime = new Intl.DateTimeFormat('id-ID', { timeZone: region.zone, hour12: !use24h, hour: '2-digit', minute: '2-digit' }).format(now);
        
        const cardHTML = isPrime ? 
            // PRIME TIME CARD (Hijau, Wave, Putih)
            `<div class="card-wrapper relative overflow-hidden rounded-2xl flex flex-col p-4 min-h-[180px] bg-gradient-to-br from-emerald-500 to-teal-800 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-400/50">
                <div class="wave-container"><div class="wave"></div><div class="wave -three"></div></div>
                <div class="card-content flex flex-col h-full justify-between">
                    <div class="flex justify-between items-start">
                        <span class="font-bold text-white drop-shadow-md tracking-wide text-sm">${region.name}</span>
                        <i class="fa-solid fa-map-pin text-white/70 text-xs"></i>
                    </div>
                    <div class="text-4xl font-black text-white drop-shadow-lg tracking-tighter my-2">${displayTime}</div>
                    <div class="flex justify-between items-center mt-auto">
                        <span class="text-[10px] font-bold tracking-widest text-white drop-shadow-md bg-white/20 px-2 py-1 rounded">PRIME TIME</span>
                        <label class="flex items-center cursor-pointer">
                            <input type="checkbox" onchange="toggleAlarm('${region.id}', this.checked)" class="sr-only peer" ${isAlarmOn ? 'checked' : ''}>
                            <div class="w-8 h-4 bg-emerald-900/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-emerald-600 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all relative border border-white/30"></div>
                        </label>
                    </div>
                </div>
            </div>` 
            : 
            // OFF PEAK CARD (Abu-abu gelap)
            `<div class="card-wrapper relative rounded-2xl flex flex-col p-4 min-h-[180px] bg-gray-800/80 border border-gray-700">
                <div class="flex justify-between items-start">
                    <span class="font-bold text-gray-400 text-sm">${region.name}</span>
                </div>
                <div class="text-4xl font-bold text-gray-300 tracking-tighter my-2">${displayTime}</div>
                <div class="flex justify-between items-center mt-auto">
                    <span class="text-[10px] font-bold text-orange-400"><i class="fa-regular fa-clock"></i> ${countdownText}</span>
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" onchange="toggleAlarm('${region.id}', this.checked)" class="sr-only peer" ${isAlarmOn ? 'checked' : ''}>
                        <div class="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all relative"></div>
                    </label>
                </div>
            </div>`;

        container.innerHTML += cardHTML;
    });

    // Update Header Stats
    statPrime.innerText = activePrimeCount;
    statAlarm.innerText = activeAlarmCount;
}

// Global scope function for HTML inline onChange
window.toggleAlarm = function(id, isChecked) {
    alarms[id] = isChecked;
    localStorage.setItem('alarms', JSON.stringify(alarms));
    updateDashboard(); // Refresh stats immediately
};

// Push Notification Permission Request
const pushBtn = document.getElementById('btn-push');
if ("Notification" in window) {
    if (Notification.permission === "default") {
        pushBtn.classList.remove('hidden');
        pushBtn.addEventListener('click', () => {
            Notification.requestPermission().then(perm => {
                if(perm === "granted") pushBtn.classList.add('hidden');
            });
        });
    }
}

// Start App
setInterval(updateDashboard, 1000);
updateDashboard();

// Register Service Worker for PWA Offline mode
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("Service Worker Registered"))
    .catch(err => console.log("SW Registration failed", err));
}
