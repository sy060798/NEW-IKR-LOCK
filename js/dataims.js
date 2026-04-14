// ================= GLOBAL =================
let dataIMS = [];
const SERVER_URL = window.SERVER_URL;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  const fileIMS = document.getElementById("fileIMS");
  const checkAllIMS = document.getElementById("checkIMS");

  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  if (checkAllIMS) {
    checkAllIMS.addEventListener("change", e => {
      const checked = e.target.checked;

      document
        .querySelectorAll("#tblIMS tbody input[type='checkbox']")
        .forEach(cb => cb.checked = checked);
    });
  }

  renderIMS();
});

// ================= import excel =================
/let existingKey = new Set();

raw.forEach(r => {

  let city = r.City || r.city || "";
  let pra = r["Pra Invoice Number"] || "";
  let inv = r["Invoice Number"] || "";
  let job = r["Job Name"] || "";

  if (!city) return;

  // ================= 🔥 ANTI DUPLICATE (GLOBAL ROW) =================
  let keyUniq = String(pra).trim() + "_" + String(inv).trim();

  if (existingKey.has(keyUniq)) return;
  existingKey.add(keyUniq);

  // ================= 🔥 GROUP KEY (STABIL) =================
  let keyGroup = city + "_" + pra + "_" + inv;

  if (!map[keyGroup]) {
    map[keyGroup] = {
      city,
      pra,
      inv,
      job,
      jumlah: 0,
      total: 0,
      detail: []
    };
  }

  map[keyGroup].jumlah++;
  map[keyGroup].total += parseAngka(r["Invoice Total"]);

  map[keyGroup].detail.push({
    wo: r.Wonumber || "-",
    status: r.Status || "-",
    amount: parseAngka(r["Invoice Total"]),
    pra,
    inv
  });
});

// ================= RENDER IMS =================
function renderIMS() {

  const tb = document.querySelector("#tblIMS tbody");
  if (!tb) return;

  tb.innerHTML = "";

  dataIMS.forEach((d, i) => {

    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><input type="checkbox"></td>
        <td>${d.city}</td>
        <td>${d.pra}</td>
        <td>${d.inv}</td>
        <td onclick="showIMS(${i})" style="cursor:pointer;color:blue">
          ${d.jumlah}
        </td>
        <td>${d.job}</td>
        <td>${formatRp(d.total)}</td>
      </tr>
    `;
  });
}


// ================= POPUP =================
function showIMS(i) {

  let d = dataIMS[i];
  if (!d) return;

  let tb = document.getElementById("popupBody");
  tb.innerHTML = "";

  (d.detail || []).forEach(x => {
    tb.innerHTML += `
      <tr>
        <td>${x.wo}</td>
        <td>${x.status}</td>
        <td>${formatRp(x.amount)}</td>
      </tr>
    `;
  });

  document.getElementById("popup").style.display = "block";
}

window.showIMS = showIMS;


// ================= UTIL =================
function parseAngka(v) {
  return parseInt(String(v || 0).replace(/[^0-9]/g, "")) || 0;
}

function formatRp(n) {
  return "Rp " + (Number(n || 0)).toLocaleString("id-ID");
}


// ================= SYNC SERVER =================
async function syncIMSServer() {
  await fetch(SERVER_URL + "/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "IMS",
      data: dataIMS
    })
  });
}


// ================= LOAD SERVER =================
async function loadIMSServer() {

  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IMS");
    const hasil = await res.json();

    if (Array.isArray(hasil)) {
      dataIMS = hasil;
      renderIMS();
    }

  } catch (err) {
    console.log("Load IMS gagal", err);
  }
}


// ================= DELETE SELECTED =================
function hapusIMS() {

  const chk = document.querySelectorAll("#tblIMS tbody input[type='checkbox']");

  dataIMS = dataIMS.filter((_, i) => !chk[i]?.checked);

  renderIMS();
}


// ================= AUTO CLEAN (OPTIONAL SAFE) =================
function autoCleanApprovedWO() {
  const now = new Date();

  function isExpired(dateStr) {
    if (!dateStr) return false;
    let d = new Date(dateStr);
    if (isNaN(d)) return false;
    return (now - d) / (1000 * 60 * 60 * 24) >= 2;
  }

  dataIMS = dataIMS.map(g => {

    if (!g.detail) return g;

    g.detail = g.detail.filter(x => {
      if ((x.status || "").toLowerCase().includes("approved")) {
        if (isExpired(x.date || x.approvedDate)) {
          g.jumlah = Math.max(0, g.jumlah - 1);
          return false;
        }
      }
      return true;
    });

    return g;
  });

  renderIMS();
}


// ===============================
// 🔥 IMS → IKR SYNC PATCH (BY WO)
// ===============================

function syncIMS_to_IKR() {

  if (!Array.isArray(dataIMS) || !Array.isArray(dataIKR)) return;

  // ================= INDEX IKR BY WO =================
  const woMap = new Map();

  dataIKR.forEach((group, gi) => {
    (group.detail || []).forEach((d, di) => {

      const wo = String(d.wo || "").trim().toUpperCase();
      if (!wo) return;

      if (!woMap.has(wo)) woMap.set(wo, []);
      woMap.get(wo).push({ gi, di });

    });
  });

  // ================= UPDATED WO (ANTI DUPLICATE) =================
  const updatedWO = new Set();

  // ================= LOOP IMS =================
  dataIMS.forEach(ims => {

    (ims.detail || []).forEach(x => {

      const wo = String(x.wo || "").trim().toUpperCase();
      if (!wo) return;

      const list = woMap.get(wo);
      if (!list) return;

      list.forEach(pos => {

        const detail = dataIKR[pos.gi].detail[pos.di];
        if (!detail) return;

        // ================= UPDATE ONLY STATUS =================
        detail.status = x.status || detail.status;

      });

      updatedWO.add(wo);

    });

  });

  // ================= RECALC =================
  recalcIKR();
  renderIKR();

  // ================= SAVE SERVER =================
  fetch(SERVER_URL + "/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "IKR",
      data: dataIKR,
      updatedWO: [...updatedWO]
    })
  }).catch(err => console.log("SYNC ERROR:", err));
}

function recalcIKR() {

  dataIKR.forEach(group => {

    const approvedSet = new Set();
    let fsTotal = 0;

    (group.detail || []).forEach(d => {

      const status = String(d.status || "").toLowerCase();

      if (status.includes("approved")) {

        if (d.wo) approvedSet.add(d.wo);

        fsTotal += Number(d.amount || 0) || 0;
      }

    });

    group.approved = approvedSet.size;
    group.fs = fsTotal;

  });
}
