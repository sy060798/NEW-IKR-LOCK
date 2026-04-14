// ================= GLOBAL =================
let dataIMS = [];

const SERVER_URL = window.SERVER_URL || "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  const file = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkIMS");

  if (file) file.addEventListener("change", importIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll("#tblIMS tbody input[type='checkbox']")
        .forEach(cb => cb.checked = e.target.checked);
    });
  }

  renderIMS();
  loadIMSServer(); // auto load
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
      XLSX.utils.sheet_to_json(wb.Sheets[s], {
        defval: "",
        raw: false
      }).forEach(r => raw.push(r));
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
    saveIMSToServer();

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
        <td onclick="showIMS(${i})" style="cursor:pointer;color:blue">${d.jumlah}</td>
        <td>${d.job}</td>
        <td>${formatRp(d.total)}</td>
      </tr>
    `;
  });
}

// ================= POPUP =================
function showIMS(i) {

  const d = dataIMS[i];
  if (!d) return;

  const tb = document.getElementById("popupBody");
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
  return "Rp " + (Number(n || 0).toLocaleString("id-ID"));
}

// ================= SAVE SERVER =================
async function saveIMSToServer() {
  try {
    await fetch(SERVER_URL + "/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "IMS",
        data: dataIMS
      })
    });
  } catch (e) {
    console.log("Save IMS gagal", e);
  }
}

// ================= LOAD SERVER =================
async function loadIMSServer() {

  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IMS");
    const data = await res.json();

    if (Array.isArray(data)) {
      dataIMS = data;
      renderIMS();
    }

  } catch (e) {
    console.log("Load IMS gagal", e);
  }
}

// ================= DELETE =================
function hapusIMS() {

  const chk = document.querySelectorAll("#tblIMS tbody input[type='checkbox']");

  dataIMS = dataIMS.filter((_, i) => !chk[i]?.checked);

  renderIMS();
}
