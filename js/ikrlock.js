// ================= GLOBAL =================
let dataIKR = [];
let dataIMS = [];
let popupExportData = [];

const SERVER_URL =
  window.SERVER_URL ||
  "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const fileIKR = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if (fileIKR) fileIKR.addEventListener("change", importIKR);
  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll(".chkIKR").forEach(c => {
        c.checked = e.target.checked;
      });
    });
  }

  renderIKR();
  renderIMS();
});

// ================= TAB =================
function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById(id)?.classList.add("active");
  btn?.classList.add("active");
}

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

    let existingWO = new Set(
      dataIKR.flatMap(d => (d.detail || []).map(x => x.wo))
    );

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
          detail: [],
          woSet: new Set()
        };
      }

      // 🔥 ANTI DUPLICATE GLOBAL
      if (existingWO.has(wo)) return;

      if (!map[key].woSet.has(wo)) {
        map[key].woSet.add(wo);
        map[key].jumlah++;
      }

      map[key].amount += parseAngka(r["BOQ TOTAL"]);

      map[key].detail.push({
        wo,
        status,
        amount: parseAngka(r["BOQ TOTAL"])
      });

      existingWO.add(wo);
    });

    let hasilBaru = Object.values(map).map(x => {
      delete x.woSet;
      return x;
    });

    dataIKR = [...dataIKR, ...hasilBaru];

    renderIKR();
    alert("UPLOAD IKR OK (ANTI DOUBLE AKTIF)");
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

    // 🔥 MATCH KE IKR
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

    alert("IMS MATCHED");
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER IKR =================
function renderIKR() {
  const tb = document.querySelector("#tbl tbody");
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
        <td onclick="showDetail(${i})" style="cursor:pointer;color:cyan">${d.jumlah}</td>
        <td>${d.approved}</td>
        <td>${formatRp(d.amount)}</td>
        <td>${formatRp(d.fs)}</td>
        <td>${formatRp(d.amount - d.fs)}</td>
        <td contenteditable>${d.remark}</td>
        <td contenteditable>${d.invoice}</td>
        <td contenteditable>${d.note}</td>
        <td><input type="checkbox" ${d.done==="YES"?"checked":""}></td>
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
        <td>${d.wo}</td>
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

  const tb = document.querySelector("#tblDetail tbody");
  const popup = document.getElementById("popupWO");

  tb.innerHTML = "";

  popupExportData = [];

  d.detail.forEach(x => {
    tb.innerHTML += `
      <tr>
        <td>${x.wo}</td>
        <td>-</td>
        <td>${formatRp(x.amount)}</td>
        <td>${x.status}</td>
      </tr>
    `;

    popupExportData.push({
      WO: x.wo,
      Amount: x.amount,
      Status: x.status
    });
  });

  popup.style.display = "block";
}

function closePopup() {
  document.getElementById("popupWO").style.display = "none";
}

// ================= DOWNLOAD DETAIL =================
function downloadDetail() {
  if (!popupExportData.length) return;

  const ws = XLSX.utils.json_to_sheet(popupExportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DETAIL");
  XLSX.writeFile(wb, "DETAIL_WO.xlsx");
}

// ================= HAPUS =================
function hapusData() {
  const chk = document.querySelectorAll(".chkIKR");
  dataIKR = dataIKR.filter((_, i) => !chk[i]?.checked);
  renderIKR();
}

// ================= SERVER (MINIMAL) =================
function uploadServer() {
  fetch(SERVER_URL + "/api/save", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      type: "IKR",
      data: dataIKR
    })
  }).then(() => {
    alert("Upload server sukses");
  });
}

// ================= UTIL =================
function parseAngka(v) {
  return parseInt(String(v || 0).replace(/[^0-9]/g, "")) || 0;
}

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

function normalRegion(txt) {
  return String(txt || "")
    .toLowerCase()
    .replace(/\b\w/g, s => s.toUpperCase());
}

// ================= TRIGGER =================
function triggerUpload() {
  document.getElementById("file").click();
}

function triggerUploadIMS() {
  document.getElementById("fileIMS").click();
}
