// ================= GLOBAL =================
let dataIMS = [];

const SERVER_URL =
  window.SERVER_URL ||
  "https://tracking-server-production-6a12.up.railway.app";


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


// ================= IMPORT IMS =================
function importIMS(e) {

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (evt) {

    const wb = XLSX.read(evt.target.result, { type: "binary" });

    let raw = [];

    wb.SheetNames.forEach(s => {
      const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
        defval: "",
        raw: false
      });
      json.forEach(r => raw.push(r));
    });

    let map = {};

    raw.forEach(r => {

      let city = r.City || r.city || "";
      let pra = r["Pra Invoice Number"] || "";
      let inv = r["Invoice Number"] || "";
      let job = r["Job Name"] || "";

      if (!city) return;

      let key = city + "_" + pra;

      if (!map[key]) {
        map[key] = {
          city,
          pra,
          inv,
          job,
          jumlah: 0,
          total: 0,
          detail: []
        };
      }

      map[key].jumlah++;
      map[key].total += parseAngka(r["Invoice Total"]);

      map[key].detail.push({
        wo: r.Wonumber || "-",
        status: r.Status || "-",
        amount: parseAngka(r["Invoice Total"])
      });
    });

    dataIMS = Object.values(map);

    renderIMS();
    alert("IMS upload sukses");
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
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
