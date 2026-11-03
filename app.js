// =========================================
// RRR FUND CRM - REALTIME DATABASE APP.JS
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJ_DCMeVNTe1BeiDkPvl-gVU0OBV_r9rw",
  authDomain: "project-0301901a-f89b-40bc-b6d.firebaseapp.com",
  databaseURL: "https://rrr-fund-default-rtdb.firebaseio.com/",
  projectId: "project-0301901a-f89b-40bc-b6d",
  storageBucket: "project-0301901a-f89b-40bc-b6d.firebasestorage.app",
  messagingSenderId: "489560003213",
  appId: "1:489560003213:web:b213da9db05aba160388c4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 6 ta sotuvchi va admin uchun boshlang'ich ma'lumotlar (NUQTALAR OLIB TASHLANDI)
const defaultData = {
    users: {
        "admin": { password: "admin123", role: "admin", name: "Admin Rahbar" },
        "Firdavs": { password: "1234", role: "seller", name: "Firdavs D" },
        "Asila": { password: "1234", role: "seller", name: "Asila E" },
        "Madina": { password: "1234", role: "seller", name: "Madina I" },
        "Sevinch": { password: "1234", role: "seller", name: "Sevinch S" },
        "Shaxlo": { password: "1234", role: "seller", name: "Shaxlo S" },
        "Munisa": { password: "1234", role: "seller", name: "Munisa T" }
    },
    sellers: {
        "Firdavs Dagarov": { sales: 0, revenue: 0, conversion: 0, balance: 3000000, fixed: 3000000, bonus: 0, sprint: 0 },
        "Sevinch Safarmatova": { sales: 0, revenue: 0, conversion: 0, balance: 3000000, fixed: 3000000, bonus: 0, sprint: 0 },
        "Shaxlo Saidkarimova":  { sales: 0, revenue: 0, conversion: 0, balance: 3000000, fixed: 3000000, bonus: 0, sprint: 0 },
        "MAdina Inagamova":   { sales: 0, revenue: 0, conversion: 0, balance: 3000000, fixed: 3000000, bonus: 0, sprint: 0 },
        "Munisa Turobjonova":  { sales: 0, revenue: 0, conversion: 0, balance: 3000000, fixed: 3000000, bonus: 0, sprint: 0 },
        "Asila Ergasheva":   { sales: 0, revenue: 0, conversion: 0, balance: 3000000, fixed: 3000000, bonus: 0, sprint: 0 }
    },
    requests: [],
    sprintWinnersCount: 0, 
    manualTotalRevenue: 0
};

let localDB = defaultData;
window.getDB = function() { return localDB || defaultData; };
window.formatUZS = function(amount) { return new Intl.NumberFormat('uz-UZ').format(Math.round(amount || 0)) + ' UZS'; };

window.saveDB = async function(data) {
    try { 
        localDB = data; 
        await set(ref(db, 'crmData'), data); 
    } catch (e) {
        console.error("Bazaga yozishda xato: ", e);
    }
};

// --- KPI VA BONUS HISOBLASH ---
window.calculateKPI = function(course, amount) {
    let amt = parseFloat(amount) || 0;
    let bonus = 0;
    if (course === 'offline_buxoro' || course === 'offline_toshkent') {
        if (amt === 1000000) bonus = 150000;
        else if (amt > 1000000) bonus = 250000;
    } else if (course === 'online') {
        if (amt === 1000000) bonus = 100000;
        else if (amt > 1000000) bonus = 150000;
    }
    return bonus;
};

// ================= AUTH (KIRISH / CHIQISH) =================
window.loginToSystem = function(event) {
    if(event) event.preventDefault();
    const loginInp = document.getElementById('usernameInp').value.trim().toLowerCase();
    const passInp = document.getElementById('passwordInp').value.trim();
    const currentDB = window.getDB();
    const users = (currentDB && currentDB.users) ? currentDB.users : defaultData.users;
    
    if (users[loginInp]) {
        if (users[loginInp].password === passInp) {
            localStorage.setItem('currentLogin', loginInp);
            localStorage.setItem('currentUser', users[loginInp].name);
            window.location.href = users[loginInp].role === 'admin' ? 'admin.html' : 'index.html';
        } else alert("❌ Parol xato!");
    } else alert("❌ Bunday login topilmadi!");
};

window.logout = function() {
    if(confirm("Tizimdan chiqmoqchimisiz?")) {
        localStorage.removeItem('currentUser'); localStorage.removeItem('currentLogin');
        window.location.href = 'login.html';
    }
};

window.checkAuth = function() {
    const path = window.location.pathname.toLowerCase();
    const user = localStorage.getItem('currentUser');
    if (!path.includes('login') && !path.includes('projector')) {
        if (!user) window.location.href = 'login.html';
    }
};
window.checkAuth();

// ================= JONLI BOG'LANISH (REALTIME DATABASE) =================
async function initDB() {
    try {
        const snapshot = await get(ref(db, 'crmData'));
        if (snapshot.exists()) {
            localDB = snapshot.val();
        } else {
            await set(ref(db, 'crmData'), defaultData);
            localDB = defaultData;
        }
    } catch (e) {
        localDB = defaultData;
    }
    window.refreshAllScreens();
}

try {
    onValue(ref(db, 'crmData'), (snapshot) => {
        if (snapshot.exists()) {
            localDB = snapshot.val();
            window.refreshAllScreens();
        }
    });
} catch(e) {}

initDB();

window.refreshAllScreens = function() {
    try { if(typeof window.updateAllUI === 'function') window.updateAllUI(); } catch(e) {}
    try { if(typeof window.loadAdminApprovals === 'function') window.loadAdminApprovals(); } catch(e) {}
    try {
        const currentName = localStorage.getItem('currentUser');
        if(currentName && typeof window.loadSellerData === 'function') window.loadSellerData(currentName);
    } catch(e) {}
    
    // PROYEKTORNI AVTOMAT YANGILASH UCHUN QO'SHILGAN BUYRUQLAR:
    try { if(typeof window.updateProjector === 'function') window.updateProjector(); } catch(e) {}
    try { if(typeof window.renderProjector === 'function') window.renderProjector(); } catch(e) {}
    try { if(typeof window.initProjector === 'function') window.initProjector(); } catch(e) {}
};

// ================= ADMIN: TASDIQLASH VA SPRINT =================
window.approveSale = async function(id) {
    const dbData = window.getDB();
    if(!dbData.requests) return;
    const req = dbData.requests.find(r => r.id === id);
    if(req && req.status === 'pending') {
        req.status = 'approved'; 
        if(dbData.sellers[req.seller]) {
            const seller = dbData.sellers[req.seller];
            seller.sales += 1; 
            seller.revenue += req.amount; 
            seller.bonus += req.bonus; 
            
            if(seller.sprint < 6) {
                seller.sprint += 1;
                if(seller.sprint === 6) {
                    if(!dbData.sprintWinnersCount) dbData.sprintWinnersCount = 0;
                    dbData.sprintWinnersCount += 1;
                    
                    let weeklyBonus = 0;
                    if(dbData.sprintWinnersCount === 1) weeklyBonus = 500000;
                    else if(dbData.sprintWinnersCount === 2 || dbData.sprintWinnersCount === 3) weeklyBonus = 300000;
                    else weeklyBonus = 200000;
                    
                    seller.bonus += weeklyBonus;
                    alert(`🎉 SPRINT G'OLIBI!\n${req.seller} 6 ta sotuvni bajardi va ${window.formatUZS(weeklyBonus)} yutib oldi!`);
                }
            }
            
            seller.balance = seller.fixed + seller.bonus; 
            seller.conversion = Number((seller.sales * 3.5).toFixed(1)); 
        }
        await window.saveDB(dbData);
    }
};

window.rejectSale = async function(id) {
    const dbData = window.getDB();
    if(!dbData.requests) return;
    const req = dbData.requests.find(r => r.id === id);
    if(req && req.status === 'pending') { req.status = 'rejected'; await window.saveDB(dbData); }
};

window.resetSprint = async function() {
    if(confirm("Yangi hafta boshlandimi? Barcha xodimlarning haftalik sprint natijalari 0 qilinadi!")) {
        const dbData = window.getDB();
        for(const name in dbData.sellers) { dbData.sellers[name].sprint = 0; }
        dbData.sprintWinnersCount = 0;
        await window.saveDB(dbData);
        alert("✅ Haftalik sprint muvaffaqiyatli yangilandi!");
    }
};

// ================= ADMIN PANEL INTERFEYSI =================
window.updateAllUI = function() {
    const dbData = window.getDB();
    if(!dbData) return;
    let totalRev = 0, totalSales = 0, avgConv = 0;
    const sellersObj = dbData.sellers || defaultData.sellers;
    let sellerCount = Object.keys(sellersObj).length;

    for(const data of Object.values(sellersObj)) {
        totalRev += (data.revenue || 0); totalSales += (data.sales || 0); avgConv += (data.conversion || 0);
    }
    avgConv = sellerCount > 0 ? (avgConv / sellerCount).toFixed(1) : 0;
    if(dbData.manualTotalRevenue !== undefined && dbData.manualTotalRevenue > 0) totalRev = dbData.manualTotalRevenue;

    const dashVals = document.querySelectorAll('#dashboard .value');
    if(dashVals.length >= 3) {
        dashVals[0].innerText = window.formatUZS(totalRev);
        dashVals[1].innerText = totalSales + ' ta';
        dashVals[2].innerText = '⚡ ' + avgConv + '%';
    }

    const tbody = document.querySelector('#sellersListContainer tbody');
    if(tbody) {
        tbody.innerHTML = '';
        for(const [name, data] of Object.entries(sellersObj)) {
            tbody.insertAdjacentHTML('beforeend', `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 15px; font-weight: bold; color: var(--text-main);">👤 ${name}</td>
                    <td style="padding: 15px; color: var(--success); font-weight: bold;">${data.sales || 0} ta</td>
                    <td style="padding: 15px; font-weight: 500;">${window.formatUZS(data.revenue || 0)}</td>
                    <td style="padding: 15px; color: var(--warning); font-weight: bold;">🔥 ${data.conversion || 0}%</td>
                </tr>
            `);
        }
    }
};

window.loadAdminApprovals = function() {
    const listContainer = document.getElementById('approvalsList');
    if(!listContainer) return; 
    const dbData = window.getDB();
    const requests = dbData.requests || [];
    
    listContainer.innerHTML = '';
    if(requests.length === 0) {
        listContainer.innerHTML = '<div style="color:gray; padding: 20px; text-align:center;">Hozircha kutilayotgan sotuvlar yo\'q.</div>';
        return;
    }

    requests.slice().reverse().forEach(req => {
        let badge = req.status === 'pending' ? '🟡 Kutilmoqda' : (req.status === 'approved' ? '🟢 Tasdiqlandi' : '🔴 Rad etildi');
        let courseName = req.course === 'offline_buxoro' ? "Oflayn (Buxoro)" : (req.course === 'offline_toshkent' ? "Oflayn (Toshkent)" : "Onlayn");
        
        listContainer.insertAdjacentHTML('beforeend', `
            <li style="padding: 18px; background: var(--bg-color); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="font-size:16px;">👤 ${req.seller} | Mijoz: ${req.client}</strong>
                    <div style="color: var(--text-muted); font-size:14px; margin-top:5px;">Yo'nalish: ${courseName} | Chek summasi: ${window.formatUZS(req.amount)} | Bonus: +${window.formatUZS(req.bonus)} | O'qish: ${req.startDate}</div>
                    <div style="margin-top:6px; font-weight:bold;">Holat: ${badge}</div>
                </div>
                <div style="display:flex; gap:10px;">
                    ${req.status === 'pending' ? `
                        <button style="background:var(--success); color:white; padding:10px 18px; border:none; border-radius:10px; cursor:pointer; font-weight:bold;" onclick="window.approveSale(${req.id})">✅ Tasdiqlash</button>
                        <button style="background:var(--danger); color:white; padding:10px 18px; border:none; border-radius:10px; cursor:pointer; font-weight:bold;" onclick="window.rejectSale(${req.id})">❌ Rad</button>
                    ` : ``}
                </div>
            </li>
        `);
    });
};

// ================= SOTUVCHI KABINETI MANTIQ =================
window.handleNewSale = async function(event) {
    if(event) event.preventDefault();
    const seller = localStorage.getItem('currentUser');
    if(!seller) { alert("Tizimga qaytadan kiring!"); return; }

    const client = document.getElementById('clientNameInput').value.trim();
    const course = document.getElementById('courseTypeInput').value;
    const amt = parseFloat(document.getElementById('saleAmountInput').value);
    const startDate = document.getElementById('startDateInput').value;
    const date = new Date().toLocaleDateString();
    
    let bonus = window.calculateKPI(course, amt);
    
    let dbData = window.getDB();
    if(!dbData.requests) dbData.requests = [];
    dbData.requests.push({ 
        id: Date.now(), 
        seller: seller, 
        client: client, 
        course: course, 
        amount: amt, 
        startDate: startDate, 
        bonus: bonus, 
        date: date, 
        status: 'pending' 
    });
    
    await window.saveDB(dbData);
    alert("✅ Sotuv cheki muvaffaqiyatli yuborildi! Adminga xabar ketdi.");
    
    document.getElementById('saleForm').reset(); 
    document.getElementById('bonusPreview').innerText = '';
};

window.previewBonus = function() {
    const amt = document.getElementById('saleAmountInput').value;
    const course = document.getElementById('courseTypeInput').value;
    const preview = document.getElementById('bonusPreview');
    if (amt > 0) {
        let bonus = window.calculateKPI(course, amt);
        preview.innerText = `Kutilayotgan KPI bonus: + ${window.formatUZS(bonus)}`;
    } else { preview.innerText = ""; }
};

window.loadSellerData = function(sellerName) {
    const dbData = window.getDB();
    if(!dbData || !dbData.sellers || !dbData.sellers[sellerName]) return;
    const seller = dbData.sellers[sellerName];
    
    if(document.getElementById('sellerBalanceVal')) document.getElementById('sellerBalanceVal').innerText = window.formatUZS(seller.balance);
    if(document.getElementById('sellerFixedVal')) document.getElementById('sellerFixedVal').innerText = window.formatUZS(seller.fixed);
    if(document.getElementById('sellerBonusVal')) document.getElementById('sellerBonusVal').innerText = '+ ' + window.formatUZS(seller.bonus);
    if(document.getElementById('sprintTextVal')) document.getElementById('sprintTextVal').innerText = `${seller.sprint} / 6`;
    if(document.getElementById('sprintBarVal')) document.getElementById('sprintBarVal').style.width = ((seller.sprint / 6) * 100) + '%';
    if(document.getElementById('sellerNameDisplay')) document.getElementById('sellerNameDisplay').innerText = sellerName;

    const historyList = document.getElementById('mySalesHistoryList');
    if(historyList) {
        const requests = dbData.requests || [];
        const myReqs = requests.filter(r => r.seller === sellerName);
        
        if(myReqs.length > 0) {
            historyList.innerHTML = '';
            myReqs.slice().reverse().forEach(req => {
                let badge = req.status === 'approved' ? '🟢 Tasdiqlandi' : (req.status === 'rejected' ? '🔴 Rad etildi' : '🟡 Kutilmoqda');
                let cName = req.course === 'offline_buxoro' ? "Oflayn (Buxoro)" : (req.course === 'offline_toshkent' ? "Oflayn (Toshkent)" : "Onlayn");
                
                historyList.insertAdjacentHTML('beforeend', `
                    <li class="history-item">
                        <div style="font-weight: 700; font-size: 16px; margin-bottom: 5px;">${req.client} (${cName}) — ${window.formatUZS(req.amount)}</div>
                        <div style="color: var(--text-muted); font-size: 14px;">O'qish sanasi: ${req.startDate} | Bonus: +${window.formatUZS(req.bonus)} | Holat: <b>${badge}</b></div>
                    </li>
                `);
            });
        } else { 
            historyList.innerHTML = '<div style="text-align:center; color:gray; padding: 40px 0;">Sizda hozircha kiritilgan sotuvlar yo\'q.</div>'; 
        }
    }
};

// ================= EXCEL VA OYNI YOPISH =================
window.exportToExcel = function() {
    const dbData = window.getDB();
    let csv = "\uFEFF--- XODIMLAR OYLIK HISOBOTI ---\nF.I.O;Sotuvlar;Tushum;Konversiya;Fiks;Bonus;Jami Maosh\n";
    for(const [name, data] of Object.entries(dbData.sellers || {})) { csv += `${name};${data.sales};${data.revenue};${data.conversion}%;${data.fixed};${data.bonus};${data.balance}\n`; }
    csv += "\n\n--- BATAFSIL TARIX ---\nSotuvchi;Mijoz;Kurs;Summa;O'qish Sanasi;Bonus;Holati\n";
    if (dbData.requests) { dbData.requests.forEach(req => { csv += `${req.seller};${req.client};${req.course};${req.amount};${req.startDate};${req.bonus};${req.status}\n`; }); }
    const link = document.createElement("a"); link.setAttribute("href", URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))); link.setAttribute("download", `RRR_Fund_Hisobot_${new Date().toLocaleDateString()}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

window.resetMonth = async function() {
    if(confirm("DIQQAT! Barcha sotuvlar, kassa va bonuslar 0 ga tushiriladi. Oyni yopmoqchimisiz?")) {
        const dbData = window.getDB();
        for(const name in dbData.sellers) {
            dbData.sellers[name].sales = 0; dbData.sellers[name].revenue = 0; dbData.sellers[name].conversion = 0; dbData.sellers[name].bonus = 0; dbData.sellers[name].sprint = 0; dbData.sellers[name].balance = dbData.sellers[name].fixed; 
        }
        dbData.requests = []; dbData.manualTotalRevenue = 0; dbData.sprintWinnersCount = 0;
        await window.saveDB(dbData); alert("✅ Yangi oy muvaffaqiyatli ochildi!");
    }
};

// ================= SOZLAMALAR =================
window.openSettings = function() { document.getElementById('settingsModal').style.display = 'flex'; };
window.closeSettings = function() { document.getElementById('settingsModal').style.display = 'none'; };

window.saveSettingsCustom = async function() {
    const newLogin = document.getElementById('newLoginInp').value.trim().toLowerCase();
    const newPass = document.getElementById('newPassInp').value.trim();
    const currentLogin = localStorage.getItem('currentLogin');
    let dbData = window.getDB();
    
    if(!newLogin || !newPass) { alert("Login va parol bo'sh bo'lishi mumkin emas!"); return; }
    if(newLogin !== currentLogin && dbData.users[newLogin]) { alert("Bu login allaqachon band!"); return; }

    const userObj = dbData.users[currentLogin];
    dbData.users[newLogin] = { password: newPass, role: userObj.role, name: userObj.name };
    if(newLogin !== currentLogin) delete dbData.users[currentLogin];

    localStorage.setItem('currentLogin', newLogin);
    await window.saveDB(dbData);
    alert("✅ Sozlamalar muvaffaqiyatli saqlandi!");
    window.closeSettings();
};