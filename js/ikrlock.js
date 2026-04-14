// ================= GLOBAL =================
let dataIKR = [];
let dataIMS = [];
let popupExportData = [];

const SERVER_URL =
  window.SERVER_URL ||
  "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const fileIKR = document.getElementById("fileIKR"); // ✅ FIX
  const fileIMS = document.getElementById("fileIMS");
  const checkIKR = document.getElementById("checkIKR");

  if (fileIKR) fileIKR.addEventListener("change", importIKR);
  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  if (checkIKR) {
    checkIKR.addEventListener("change", e => {
      document.querySelectorAll(".chkIKR").forEach(c => {
        c.checked = e.target.checked;
      });
    });
  }

  renderIKR();
  renderIMS();
});

// ================= IMPORT IKR =================
function importIKR(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = evt => {
    const wb = XLSX.read(evt.target.result, { type: "binary" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws);

    let map = {};

    raw.forEach(r => {
      let region = normalRegion(r.Region || r.City || "");
      let wotype = r["Job Name"] || "";
      let wo = String(r["WO Number"] || "").trim();
      let status = r.Status || "-";

      let date = new Date(r["WO END"]);
      if (!region || !wo || isNaN(date)) return;

      let bulan = date.toLocaleString("id-ID", { month: "short" });
      let tahun = date.getFullYear();

      let key = region + "_" + tahun + "_" + bulan + "_" + wotype;

      if (!map[key]) {
        map[key] = {
          region,
          tahun,
          bulan,
          wotype,
          jumlah: 0,
          approved: 0,
          amount: 0,
          fs: 0,
          remark: "",
          invoice: "",
          note: "",
          done: "NO",
          detail: []
        };
      }

      map[key].jumlah++;
      map[key].amount += parseAngka(r["BOQ TOTAL"]);

      map[key].detail.push({
        wo,
        status,
        amount: parseAngka(r["BOQ TOTAL"])
      });
    });

    dataIKR = Object.values(map);

    renderIKR();

    console.log("IKR:", dataIKR); // 🔥 DEBUG
    alert("UPLOAD IKR OK");
  };

  reader.readAsBinaryString(file);
}

// ================= IMPORT IMS =================
function importIMS(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = evt => {
    const wb = XLSX.read(evt.target.result, { type: "binary" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws);

    dataIMS = raw.map(r => ({
      wo: String(r["WO Number"] || "").trim(),
      status: r.Status || "-",
      amount: parseAngka(r["Invoice Total"])
    }));

    // MATCH
    dataIKR.forEach(d => {
      let total = 0;
      let count = 0;

      dataIMS.forEach(i => {
        if (d.detail.some(x => x.wo === i.wo)) {
          total += i.amount;
          count++;
        }
      });

      d.approved = count;
      d.fs = total;
    });

    renderIKR();
    renderIMS();

    console.log("IMS:", dataIMS); // 🔥 DEBUG
    alert("IMS MATCHED");
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER IKR =================
function renderIKR() {
  const tb = document.querySelector("#tblIKR tbody"); // ✅ FIX
  if (!tb) return;

  tb.innerHTML = "";

  dataIKR.forEach((d, i) => {
    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><input type="checkbox" class="chkIKR"></td>
        <td>${d.region}</td>
        <td>${d.tahun}</td>
        <td>${d.wotype}</td>
        <td>${d.bulan}</td>
        <td onclick="showDetail(${i})" style="cursor:pointer;color:blue">${d.jumlah}</td>
        <td>${d.approved}</td>
        <td>${formatRp(d.amount)}</td>
        <td>${formatRp(d.fs)}</td>
        <td contenteditable>${d.remark}</td>
        <td contenteditable>${d.invoice}</td>
        <td contenteditable>${d.note}</td>
        <td><input type="checkbox"></td>
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
        <td><input type="checkbox"></td>
        <td>-</td>
        <td>-</td>
        <td>${d.wo}</td>
        <td>-</td>
        <td>${d.status}</td>
        <td>${formatRp(d.amount)}</td>
      </tr>
    `;
  });
}

// ================= POPUP =================
function showDetail(i) {
  const d = dataIKR[i];
  if (!d) return;

  const tb = document.getElementById("popupBody");
  const popup = document.getElementById("popup"); 

  tb.innerHTML = "";
  popupExportData = [];

  d.detail.forEach(x => {
    tb.innerHTML += `
      <tr>
        <td>${x.wo}</td>
        <td>${x.status}</td>
        <td>${formatRp(x.amount)}</td>
      </tr>
    `;

    popupExportData.push(x);
  });

  popup.style.display = "block";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}
