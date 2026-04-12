// ======================================
// ikrlock.js FULL FINAL
// SYSTEM LAMA DIPERTAHANKAN
// + UPDATE IMS AUTO APPROVED
// + AMBIL INVOICE TOTAL
// ======================================

// ---------- GLOBAL ----------
let dataIKR = [];
let chart = null;

const SERVER_URL =
"https://tracking-server-production-6a12.up.railway.app";

let currentDetail = [];
let currentApproved = [];

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {

  const file = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if (file) file.addEventListener("change", importExcel);
  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll(".chk").forEach(x => {
        x.checked = e.target.checked;
      });
    });
  }

  loadServer();
});

// ======================================
// TAB
// ======================================
function showTab(id, btn) {

  document.querySelectorAll(".tab")
    .forEach(t => t.classList.remove("active"));

  let el = document.getElementById(id);
  if (el) el.classList.add("active");

  document.querySelectorAll(".menu button")
    .forEach(b => b.classList.remove("active"));

  if (btn) btn.classList.add("active");

  if (id === "pivot") generatePivot();
}

// ======================================
// BUTTON
// ======================================
function triggerUpload() {
  document.getElementById("file").click();
}

function triggerUploadIMS() {
  document.getElementById("fileIMS").click();
}

// ======================================
// IMPORT DATA UTAMA (SYSTEM LAMA)
// ======================================
function importExcel(e) {

  let file = e.target.files[0];
  if (!file) return;

  showLoading("Upload Data...");

  let reader = new FileReader();

  reader.onload = function (evt) {

    let wb = XLSX.read(evt.target.result, {
      type: "binary"
    });

    let raw = [];

    wb.SheetNames.forEach(s => {
      let json = XLSX.utils.sheet_to_json(
        wb.Sheets[s],
        { defval: "", raw: false }
      );

      json.forEach(r => raw.push(r));
    });

    let newData = [];

    raw.forEach(r => {

      let region =
        r["REGION"] ||
        r["Region"] || "";

      if (!region) return;

      let amount = parseAngka(
        r["AMOUNT"] ||
        r["Amount"]
      );

      let fs = parseAngka(
        r["FS AMOUNT"] ||
        r["FS Amount"]
      );

      newData.push({
        id: Date.now() + Math.random(),
        type: "IKR",
        region: region,
        tahun: r["TAHUN"] || "",
        wotype: r["WO TYPE"] || "",
        bulan: r["BULAN"] || "",
        jumlah: Number(r["JUMLAH WO"]) || 0,
        approved: Number(r["WO APPROVED"]) || 0,
        amount: amount,
        fs: fs,
        selisih: amount - fs,
        remark: r["REMARK"] || "",
        invoice: r["NO INVOICE"] || "",
        note: r["NOTE"] || "",
        done: r["DONE"] || "NO",
        listWO: [],
        approvedList: []
      });

    });

    dataIKR = [...dataIKR, ...newData];

    sortData();
    render();

    hideLoading();

    alert("Upload sukses : " + newData.length);

    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ======================================
// IMPORT IMS (UPDATE BARU)
// COCOKKAN WONUMBER
// AMBIL INVOICE TOTAL
// ======================================
function importIMS(e) {

  let file = e.target.files[0];
  if (!file) return;

  showLoading("Upload IMS...");

  let reader = new FileReader();

  reader.onload = function (evt) {

    let wb = XLSX.read(
      evt.target.result,
      { type: "binary" }
    );

    let totalUpdate = 0;
    let duplicate = 0;

    let woUsed = new Set();

    wb.SheetNames.forEach(s => {

      let json =
        XLSX.utils.sheet_to_json(
          wb.Sheets[s],
          { defval: "", raw: false }
        );

      json.forEach(r => {

        let wo = String(
          r["Wonumber"] ||
          r["WONUMBER"] ||
          r["WO Number"] ||
          ""
        ).trim();

        if (!wo) return;

        if (woUsed.has(wo)) {
          duplicate++;
          return;
        }

        woUsed.add(wo);

        let invoiceTotal = parseAngka(
          r["Invoice Total"] ||
          r["INVOICE TOTAL"] ||
          r["InvoiceTotal"] ||
          0
        );

        let woFix = wo.replace(/\D/g, '');

        let row = dataIKR.find(x =>
          (x.listWO || []).some(a =>
            String(a.wo)
              .replace(/\D/g, '') === woFix
          )
        );

        if (!row) return;

        let sudahAda =
          (row.approvedList || [])
            .some(x =>
              String(x.wo).trim() === wo
            );

        if (sudahAda) return;

        // update approved
        row.approved =
          Number(row.approved || 0) + 1;

        // update FS
        row.fs =
          Number(row.fs || 0) +
          invoiceTotal;

        // update selisih
        row.selisih =
          Number(row.amount || 0) -
          Number(row.fs || 0);

        row.remark = "APPROVED";
        row.note = "AUTO IMS";

        row.approvedList.push({
          wo: wo,
          invoice: invoiceTotal,
          status: "APPROVED"
        });

        totalUpdate++;

      });

    });

    render();
    hideLoading();

    alert(
      "IMS selesai\n" +
      "Update : " + totalUpdate +
      "\nDuplikat : " + duplicate
    );

    e.target.value = "";

  };

  reader.readAsBinaryString(file);
}

// ======================================
// SORT
// ======================================
function sortData() {

  const bulanMap = {
    Jan: 1, Feb: 2, Mar: 3,
    Apr: 4, Mei: 5, Jun: 6,
    Jul: 7, Agu: 8, Sep: 9,
    Okt: 10, Nov: 11, Des: 12
  };

  dataIKR.sort((a, b) => {

    if (a.region !== b.region)
      return a.region.localeCompare(b.region);

    if (Number(a.tahun) !== Number(b.tahun))
      return Number(a.tahun) - Number(b.tahun);

    if ((bulanMap[a.bulan] || 0) !==
      (bulanMap[b.bulan] || 0))
      return (bulanMap[a.bulan] || 0) -
        (bulanMap[b.bulan] || 0);

    return a.wotype.localeCompare(
      b.wotype
    );

  });
}

// ======================================
// RENDER
// ======================================
function render() {

  let tb =
    document.querySelector("#tbl tbody");

  if (!tb) return;

  tb.innerHTML = "";

  dataIKR.forEach((d, i) => {

    tb.innerHTML += `
<tr>
<td>${i + 1}</td>
<td><input type="checkbox" class="chk"></td>
<td>${d.region}</td>
<td>${d.tahun}</td>
<td>${d.wotype}</td>
<td>${d.bulan}</td>
<td>${d.jumlah}</td>
<td style="color:lime">${d.approved}</td>
<td>${format(d.amount)}</td>
<td>${format(d.fs)}</td>
<td style="color:${d.selisih > 0 ? 'red' : 'lime'}">
${format(d.selisih)}
</td>
<td contenteditable oninput="edit(${i},'remark',this.innerText)">
${d.remark}
</td>
<td contenteditable oninput="edit(${i},'invoice',this.innerText)">
${d.invoice}
</td>
<td contenteditable oninput="edit(${i},'note',this.innerText)">
${d.note}
</td>
<td>
<input type="checkbox"
${d.done === "YES" ? "checked" : ""}
onchange="toggleDone(${i},this.checked)">
</td>
</tr>
`;

  });
}

// ======================================
// EDIT
// ======================================
function edit(i, f, v) {
  dataIKR[i][f] = v;
}

function toggleDone(i, v) {
  dataIKR[i].done = v ? "YES" : "NO";
}

// ======================================
// DELETE
// ======================================
function hapusData() {

  let c =
    document.querySelectorAll(".chk");

  dataIKR =
    dataIKR.filter((d, i) =>
      !c[i].checked
    );

  render();
}

// ======================================
// DOWNLOAD
// ======================================
function download() {

  let ws =
    XLSX.utils.json_to_sheet(dataIKR);

  let wb =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb, ws, "IKR"
  );

  XLSX.writeFile(
    wb, "IKR_LOCK.xlsx"
  );
}

// ======================================
// PIVOT
// ======================================
function generatePivot() {

  let map = {};

  dataIKR.forEach(d => {
    if (!map[d.bulan]) map[d.bulan] = 0;
    map[d.bulan] += Number(d.amount) || 0;
  });

  let ctx =
    document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(map),
      datasets: [{
        label: "Total Amount",
        data: Object.values(map)
      }]
    }
  });
}

// ======================================
// SERVER
// ======================================
async function uploadServer() {

  if (dataIKR.length === 0) {
    alert("Data kosong");
    return;
  }

  showLoading("Upload Server...");

  try {

    await fetch(
      SERVER_URL + "/api/save",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          type: "IKR",
          data: dataIKR
        })
      }
    );

    hideLoading();
    alert("Upload berhasil");

  } catch (e) {
    hideLoading();
    alert("Upload gagal");
  }
}

async function loadServer() {

  showLoading("Load Server...");

  try {

    let r = await fetch(
      SERVER_URL +
      "/api/get?type=IKR"
    );

    let j = await r.json();

    if (Array.isArray(j))
      dataIKR = j;
    else
      dataIKR = [];

    sortData();
    render();

    hideLoading();

  } catch (e) {
    hideLoading();
  }
}

// ======================================
// FORMAT
// ======================================
function parseAngka(v) {

  return parseInt(
    String(v || 0)
      .replace(/[^0-9]/g, "")
  ) || 0;
}

function format(v) {

  return "Rp " +
    Number(v || 0)
      .toLocaleString("id-ID");
}

// ======================================
// LOADING
// ======================================
function showLoading(text = "Loading...") {

  let box =
    document.getElementById("loadingBox");

  if (!box) return;

  box.style.display = "flex";

  box.innerHTML = `
<div class="loader"></div>
<div class="loadingText">${text}</div>
`;
}

function hideLoading() {

  let box =
    document.getElementById("loadingBox");

  if (box)
    box.style.display = "none";
}

// ======================================
// GLOBAL
// ======================================
window.triggerUpload = triggerUpload;
window.triggerUploadIMS = triggerUploadIMS;
window.download = download;
window.hapusData = hapusData;
window.uploadServer = uploadServer;
window.showTab = showTab;
window.generatePivot = generatePivot;
