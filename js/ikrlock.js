// ===============================
// CLEAN IKR + IMS SYSTEM (NO ERROR VERSION)
// ===============================

let dataIKR = [];
let dataIMS = [];
let popupExportData = [];

const SERVER_URL = window.SERVER_URL || "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  const fileIKR = document.getElementById("fileIKR");
  const checkIKR = document.getElementById("checkIKR");
  const fileIMS = document.getElementById("fileIMS");
  const checkIMS = document.getElementById("checkIMS");

  if (fileIKR) fileIKR.addEventListener("change", importIKR);
  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  if (checkIKR) {
    checkIKR.addEventListener("change", e => {
      document.querySelectorAll(".chkIKR").forEach(c => c.checked = e.target.checked);
    });
  }

  if (checkIMS) {
    checkIMS.addEventListener("change", e => {
      document.querySelectorAll("#tblIMS tbody input[type='checkbox']")
        .forEach(cb => cb.checked = e.target.checked);
    });
  }

  renderIKR();
  renderIMS();
  loadIMSServer();
});

// ================= TAB =================
function openTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".toolbar").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById("tab-" + id)?.classList.add("active");
  document.getElementById("tb-" + id)?.classList.add("active");
  btn?.classList.add("active");
}
window.openTab = openTab;

// ================= NORMAL REGION =================
function normalRegion(txt) {
  return String(txt || "").trim();
}

// ================= IMPORT IKR =================
function importIKR(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(evt) {

    const wb = XLSX.read(evt.target.result, { type: "binary" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet);

    let map = {};

    raw.forEach(r => {

      const region = normalRegion(r.City || r.city || "");
      const wo = String(r["WO Number"] || "-");
      const amount = parseInt(String(r["Invoice Total"] || 0).replace(/[^0-9]/g, "")) || 0;

      const key = region;

      if (!map[key]) {
        map[key] = {
          region,
          jumlah: 0,
          amount: 0,
          detail: []
        };
      }

      map[key].jumlah += 1;
      map[key].amount += amount;
      map[key].detail.push({ wo, amount });
    });

    dataIKR = Object.values(map);
    renderIKR();
    saveIKRToServer();

    e.target.value = "";
    alert("IKR OK");
  };

  reader.readAsBinaryString(file);
}

// ================= IMPORT IMS =================
function importIMS(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(evt) {

    const wb = XLSX.read(evt.target.result, { type: "binary" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(sheet);

    let map = {};

    raw.forEach(r => {

      const city = r.City || "";
      const wo = r["WO Number"] || "-";
      const amount = parseInt(String(r["Invoice Total"] || 0).replace(/[^0-9]/g, "")) || 0;

      const key = city;

      if (!map[key]) {
        map[key] = {
          city,
          jumlah: 0,
          total: 0,
          detail: []
        };
      }

      map[key].jumlah += 1;
      map[key].total += amount;
      map[key].detail.push({ wo, amount });
    });

    dataIMS = Object.values(map);
    renderIMS();
    saveIMSToServer();

    e.target.value = "";
    alert("IMS OK");
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER IKR =================
function renderIKR() {
  const tb = document.querySelector("#tblIKR tbody");
  if (!tb) return;

  tb.innerHTML = "";

  dataIKR.forEach((d, i) => {
    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${d.region}</td>
        <td>${d.jumlah}</td>
        <td>${formatRp(d.amount)}</td>
      </tr>
    `;
  });
}

// ================= RENDER IMS =================
function renderIMS() {
  const tb = document.querySelector("#tblIMS tbody");
  if (!tb) return;

  tb.innerHTML = "";

  dataIMS.forEach((d, i) => {
    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${d.city}</td>
        <td>${d.jumlah}</td>
        <td>${formatRp(d.total)}</td>
        <td onclick="showIMS(${i})" style="color:blue;cursor:pointer">Detail</td>
      </tr>
    `;
  });
}

// ================= POPUP IMS =================
function showIMS(i) {
  const d = dataIMS[i];
  const tb = document.getElementById("popupBody");
  const popup = document.getElementById("popup");

  if (!d || !tb || !popup) return;

  tb.innerHTML = "";

  d.detail.forEach(x => {
    tb.innerHTML += `
      <tr>
        <td>${x.wo}</td>
        <td>${formatRp(x.amount)}</td>
      </tr>
    `;
  });

  popup.style.display = "block";

  popupExportData = d.detail;
}
window.showIMS = showIMS;

// ================= DOWNLOAD IKR =================
function downloadIKR() {
  const ws = XLSX.utils.json_to_sheet(dataIKR);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "IKR");
  XLSX.writeFile(wb, "IKR.xlsx");
}
window.downloadIKR = downloadIKR;

// ================= SERVER =================
async function saveIKRToServer() {
  try {
    await fetch(SERVER_URL + "/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "IKR", data: dataIKR })
    });
  } catch (e) {}
}

async function saveIMSToServer() {
  try {
    await fetch(SERVER_URL + "/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "IMS", data: dataIMS })
    });
  } catch (e) {}
}

async function loadIMSServer() {
  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IMS");
    const data = await res.json();

    if (Array.isArray(data)) {
      dataIMS = data;
      renderIMS();
    }
  } catch (e) {}
}

// ================= UTIL =================
function parseAngka(v) {
  return parseInt(String(v || 0).replace(/[^0-9]/g, "")) || 0;
}

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

// ================= POPUP CLOSE =================
window.closePopup = () => {
  document.getElementById("popup")?.style.display = "none";
};
