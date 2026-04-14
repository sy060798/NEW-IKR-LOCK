// ================= GLOBAL =================
let dataIKR = [];
let popupExportData = [];
const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";


// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
const file = document.getElementById("fileIKR");
const check = document.getElementById("checkIKR");
@@ -19,11 +14,10 @@ document.addEventListener("DOMContentLoaded", () => {

  if (file) file.addEventListener("change", importIKR);

  if (check) {
    check.addEventListener("change", e => {
      document.querySelectorAll(".chkIKR").forEach(c => {
        c.checked = e.target.checked;
      });
});
}

  loadIKRFromServer();
renderIKR();
});


// ================= TAB =================
// ================= TAB FIX =================
function openTab(id, btn) {
document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
document.querySelectorAll(".toolbar").forEach(t => t.classList.remove("active"));
@@ -34,8 +28,8 @@ function openTab(id, btn) {
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById("tab-" + id)?.classList.add("active");
  document.getElementById("tb-" + id)?.classList.add("active");

btn?.classList.add("active");
}
window.openTab = openTab;

window.openTab = openTab;

// ================= IMPORT IKR =================
function importIKR(e) {
@@ -58,200 +52,695 @@ function importIKR(e) {
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
    // ================= WO EXISTING GLOBAL (ANTI DOUBLE TOTAL SYSTEM) =================
    let existingWO = new Set(
      dataIKR.flatMap(d => (d.detail || []).map(x => x.wo))
    );

      let region = normalRegion(r.City || r.city || r.Region || r.region || "");
      let woEnd = r["Wo End"] || r["WO END"] || r["wo end"] || "";

      let boq = parseInt(String(
        r["Boq Total"] || r["BOQ TOTAL"] || r["boq total"] || 0
      ).replace(/[^0-9]/g, "")) || 0;
   // ================= LOOP DATA =================
raw.forEach(r => {

  // ================= AMBIL DATA =================
  let region =
  r.City ||
  r.city ||
  r.Region ||
  r.region ||
  "";

region = normalRegion(region);

  let woEnd =
    r["Wo End"] ||
    r["WO END"] ||
    r["wo end"] ||
    "";

  let boq =
    parseInt(
      String(
        r["Boq Total"] ||
        r["BOQ TOTAL"] ||
        r["boq total"] ||
        0
      ).replace(/[^0-9]/g, "")
    ) || 0;

  // ================= WO TYPE =================
  let wotype =
    r["Job Name"] ||
    r["JOB NAME"] ||
    r["job name"] ||
    "";

  if (!region || !woEnd) return;

  // ================= FORMAT TANGGAL =================
  let txt = String(woEnd).trim().split(" ")[0];
  let p = txt.split("/");

  if (p.length !== 3) return;

  let hari = parseInt(p[0]);
  let bln  = parseInt(p[1]) - 1;
  let thn  = parseInt(p[2]);

  let dt = new Date(thn, bln, hari);

  if (isNaN(dt)) return;

  let tahun = thn;

  let namaBulan = [
    "Jan","Feb","Mar","Apr","Mei","Jun",
    "Jul","Agu","Sep","Okt","Nov","Des"
  ];

  let bulan = namaBulan[bln];

  // ================= INI YANG KURANG =================
  let key =
(region || "").trim().toUpperCase() + "_" +
tahun + "_" +
bulan + "_" +
(wotype || "").trim().toUpperCase();
  // ================= INIT MAP =================
  if (!map[key]) {
    map[key] = {
      region,
      tahun,
      bulan,
      wotype: wotype,
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
    // ================= LOOP DATA =================
    raw.forEach(r => {

      let wotype = r["Job Name"] || r["JOB NAME"] || r["job name"] || "";
  // kalau kosong isi
  if (!map[key].wotype && wotype) {
    map[key].wotype = wotype;
  }
      // ================= AMBIL DATA =================
      let region =
        r.City ||
        r.city ||
        r.Region ||
        r.region ||
        "";

      region = normalRegion(region);

      let woEnd =
        r["Wo End"] ||
        r["WO END"] ||
        r["wo end"] ||
        "";

      let boq =
        parseInt(
          String(
            r["Boq Total"] ||
            r["BOQ TOTAL"] ||
            r["boq total"] ||
            0
          ).replace(/[^0-9]/g, "")
        ) || 0;

      let wotype =
        r["Job Name"] ||
        r["JOB NAME"] ||
        r["job name"] ||
        "";

if (!region || !woEnd) return;
  // ================= AMOUNT =================
  map[key].amount += boq;

  // ================= WO =================
  const wo =
    String(
      r.Wonumber ||
      r["Wonumber"] ||
      r["WO Number"] ||
      r["WO NUMBER"] ||
      "-"
    ).trim();

  const status =
    r.Status ||
    r["Status"] ||
    "-";

  // ================= WO UNIK =================
  if (!map[key].woSet.has(wo)) {
    map[key].woSet.add(wo);
    map[key].jumlah++;
  }

      let txt = String(woEnd).split(" ")[0];
      // ================= FORMAT TANGGAL =================
      let txt = String(woEnd).trim().split(" ")[0];
let p = txt.split("/");
  // ================= DETAIL =================
  map[key].detail.push({
    wo,
    status,
    amount: boq
  });

if (p.length !== 3) return;
});

let hari = parseInt(p[0]);
      let bln = parseInt(p[1]) - 1;
      let thn = parseInt(p[2]);
    // ================= FINAL CLEAN =================
let hasilBaru = Object.values(map).map(x => {
  delete x.woSet;
  return x;
});
      let bln  = parseInt(p[1]) - 1;
      let thn  = parseInt(p[2]);

      let dt = new Date(thn, bln, hari);
      if (isNaN(dt)) return;

      let namaBulan = [
        "Jan","Feb","Mar","Apr","Mei","Jun",
        "Jul","Agu","Sep","Okt","Nov","Des"
      ];

      let namaBulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
let bulan = namaBulan[bln];
// gabung lama + baru
let gabung = [...dataIKR, ...hasilBaru];

      let key = region.toUpperCase() + "_" + thn + "_" + bulan + "_" + (wotype || "").toUpperCase();
// merge anti dobel row
let finalMap = {};
      let key =
        region.trim().toUpperCase() + "_" +
        thn + "_" +
        bulan + "_" +
        (wotype || "").trim().toUpperCase();

      // ================= INIT MAP =================
if (!map[key]) {
map[key] = {
region,
@@ -210,200 +139,139 @@ let finalMap = {};
woSet: new Set()
};
}
gabung.forEach(d => {

      map[key].amount += boq;
  let key =
    d.region + "_" +
    d.tahun + "_" +
    d.bulan + "_" +
    d.wotype;
      const wo =
        String(
          r.Wonumber ||
          r["Wonumber"] ||
          r["WO Number"] ||
          r["WO NUMBER"] ||
          "-"
        ).trim();

      const status =
        r.Status ||
        r["Status"] ||
        "-";

      let wo = String(r.Wonumber || r["WO Number"] || "-").trim();
      let status = r.Status || "-";
  if (!finalMap[key]) {
      // ================= 🔥 INTI PATCH: SKIP WO SUDAH ADA =================
      if (existingWO.has(wo)) return;

if (!map[key].woSet.has(wo)) {
map[key].woSet.add(wo);
map[key].jumlah++;
}
    finalMap[key] = {
      ...d,
      detail: [...(d.detail || [])]
    };

      map[key].detail.push({ wo, status, amount: boq });
      map[key].amount += boq;

      map[key].detail.push({
        wo,
        status,
        amount: boq
      });

      existingWO.add(wo);
});
  } else {

    // ================= CLEAN MAP =================
let hasilBaru = Object.values(map).map(x => {
delete x.woSet;
return x;
});
    finalMap[key].jumlah += Number(d.jumlah || 0);
    finalMap[key].approved += Number(d.approved || 0);
    finalMap[key].amount += Number(d.amount || 0);
    finalMap[key].fs += Number(d.fs || 0);

    // ================= MERGE OLD + NEW =================
let gabung = [...dataIKR, ...hasilBaru];
    finalMap[key].detail.push(
      ...(d.detail || [])
    );

let finalMap = {};
  }

gabung.forEach(d => {
      let key = d.region + "_" + d.tahun + "_" + d.bulan + "_" + d.wotype;
});

      let key =
        d.region + "_" +
        d.tahun + "_" +
        d.bulan + "_" +
        d.wotype;

if (!finalMap[key]) {
        finalMap[key] = { ...d, detail: [...(d.detail || [])] };
        finalMap[key] = {
          ...d,
          detail: [...(d.detail || [])]
        };
} else {
finalMap[key].jumlah += Number(d.jumlah || 0);
        finalMap[key].approved += Number(d.approved || 0);
finalMap[key].amount += Number(d.amount || 0);
finalMap[key].fs += Number(d.fs || 0);

finalMap[key].detail.push(...(d.detail || []));
}
});
dataIKR = Object.values(finalMap);

dataIKR = Object.values(finalMap);
renderIKR();

renderIKR();

e.target.value = "";
    alert("UPLOAD OK");
    alert("UPLOAD OK (WO DUPLICATE SKIP ACTIVE)");
};
e.target.value = "";
alert("UPLOAD OK");
};

reader.readAsBinaryString(file);
reader.readAsBinaryString(file);
}
// ================= MASTER GRUOING =================

function renderIKRGroup() {

// ================= NORMAL REGION =================
function normalRegion(txt) {
  let r = String(txt || "").toLowerCase().trim();
function renderIKR() {
const tb = document.querySelector("#tblIKR tbody");
if (!tb) return;

  const map = {
    "bks": "bekasi",
    "bdg": "bandung",
    "sby": "surabaya",
    "yk": "jogja"
  };
tb.innerHTML = "";

  if (map[r]) r = map[r];
  let group = {};
  const sorted = [...dataIKR].sort((a, b) => {
    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

  return r.replace(/\b\w/g, s => s.toUpperCase());
}
  dataIKR.forEach(d => {
    let key = d.region + "_" + d.tahun + "_" + d.bulan;
    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;

    if (!group[key]) {
      group[key] = {
        region: d.region,
        tahun: d.tahun,
        bulan: d.bulan,
        items: []
      };
    }
    const bulanA = (a.bulan || "").localeCompare(b.bulan || "");
    if (bulanA !== 0) return bulanA;

// ================= RENDER =================
function renderIKR() {
  const tb = document.querySelector("#tblIKR tbody");
  if (!tb) return;
    group[key].items.push(d);
    return (a.wotype || "").localeCompare(b.wotype || "");
});

  tb.innerHTML = "";
  let no = 1;

  Object.values(group).forEach(g => {

  dataIKR.forEach((d, i) => {
  sorted.forEach((d, i) => {
tb.innerHTML += `
     <tr>
       <td>${i + 1}</td>
       <td><input type="checkbox" class="chkIKR"></td>

       <td>${d.region}</td>
       <td>${d.tahun}</td>
       <td>${d.wotype}</td>
       <td>${d.bulan}</td>

       <td>${d.jumlah}</td>

        <td>${d.approved || 0}</td>

       <td>${formatRp(d.amount)}</td>
       <td>${formatRp(d.fs)}</td>
      <tr style="background:#222;color:#fff;font-weight:bold">
        <td colspan="13">
          📍 ${g.region} | ${g.tahun} | ${g.bulan}

        <td contenteditable>${d.remark || ""}</td>
        <td contenteditable>${d.invoice || ""}</td>
        <td contenteditable>${d.note || ""}</td>

        <td>
          <input type="checkbox" ${d.done === "YES" ? "checked" : ""}>
       </td>
     </tr>
   `;
});
}


// ================= FORMAT =================
function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

    g.items.forEach(d => {
      tb.innerHTML += `
        <tr>
          <td>${no++}</td>
          <td><input type="checkbox" class="chkIKR"></td>
          <td>${d.region}</td>
          <td>${d.tahun}</td>
          <td>${d.wotype}</td>
          <td>${d.bulan}</td>

          <td>
            <span onclick="showDetail(${dataIKR.indexOf(d)})"
              style="cursor:pointer;font-weight:bold">
              ${d.jumlah}
            </span>
          </td>

          <td>${d.approved}</td>
          <td>${formatRp(d.amount)}</td>
          <td>${formatRp(d.fs)}</td>

          <td contenteditable>${d.remark || ""}</td>
          <td contenteditable>${d.invoice || ""}</td>
          <td contenteditable>${d.note || ""}</td>

          <td>
            <input type="checkbox" ${d.done === "YES" ? "checked" : ""}>
          </td>
        </tr>
      `;
    });

// ================= DELETE =================
function hapusIKR() {
  const chk = document.querySelectorAll(".chkIKR");
  dataIKR = dataIKR.filter((_, i) => !chk[i]?.checked);
  renderIKR();
  });
}
window.hapusIKR = hapusIKR;

// ================= POPUP DETAIL =================
let popupExportData = [];

// ================= DETAIL =================
function showDetail(i) {
const d = dataIKR[i];
  if (!d) return;
if (!d) return alert("Data tidak ditemukan");

const tb = document.getElementById("popupBody");
@@ -416,13 +284,6 @@ function showDetail(i) {
const uniqueMap = new Map();

(d.detail || []).forEach(x => {
    tb.innerHTML += `
      <tr>
        <td>${x.wo}</td>
        <td>${x.status}</td>
        <td>${formatRp(x.amount)}</td>
      </tr>
    `;
if (x.wo && !uniqueMap.has(x.wo)) {
uniqueMap.set(x.wo, x);
}
@@ -465,7 +326,6 @@ function exportPopupExcel() {
const ws = XLSX.utils.json_to_sheet(popupExportData);
const wb = XLSX.utils.book_new();

// ================= EXPORT =================
XLSX.utils.book_append_sheet(wb, ws, "DETAIL_WO");
XLSX.writeFile(wb, "DETAIL_WO.xlsx");
}
@@ -499,7 +359,6 @@ function uploadServerAll() {}

// ================= DOWNLOAD EXCEL =================
function downloadIKR() {
  const ws = XLSX.utils.json_to_sheet(dataIKR);

if (!dataIKR.length) {
alert("Tidak ada data");
@@ -524,22 +383,18 @@ function downloadIKR() {

const ws = XLSX.utils.json_to_sheet(exportData);
const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "IKR");
  XLSX.writeFile(wb, "DATA_IKR.xlsx");

XLSX.utils.book_append_sheet(wb, ws, "DATA IKR");

XLSX.writeFile(wb, "DATA_IKR_LOCK.xlsx");
}
window.downloadIKR = downloadIKR;

function downloadIMS() {}
function hapusIMS() {}
function generatePivot() {}
function generateStatus() {}
function uploadServerAll() {}

// ================= SERVER LOAD =================
window.downloadIKR = downloadIKR;

// ===============================
@@ -549,10 +404,7 @@ window.downloadIKR = downloadIKR;
async function loadIKRFromServer() {

try {
    const res = await fetch(SERVER_URL + "/api/get?type=IKR");
    const data = await res.json();

    dataIKR = Array.isArray(data) ? data : [];
const res = await fetch(
SERVER_URL + "/api/get?type=IKR"
);
@@ -573,8 +425,6 @@ async function loadIKRFromServer() {

renderIKR();

  } catch (e) {
    console.log("server error");
console.log("Data IKR berhasil dimuat");

} catch (err) {
@@ -755,7 +605,7 @@ function normalRegion(txt){
return r.replace(/\b\w/g, s => s.toUpperCase());
}

 

// ===============================
window.closePopup = () => {
const popup = document.getElementById("popup");
@@ -767,17 +617,34 @@ function renderIKRGroupFooter() {
const tb = document.querySelector("#tblIKR tbody");
if (!tb) return;

  const monthOrder = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
    "Mei": 5, "Jun": 6, "Jul": 7, "Agu": 8,
    "Sep": 9, "Okt": 10, "Nov": 11, "Des": 12
  };

  const woOrder = {
    "Activation Broadband": 1,
    "TroubleShooting BroadBand": 2
  };

let group = {};

  // ================= GROUP FIX =================
dataIKR.forEach(d => {

    let key = d.region + "_" + d.tahun + "_" + d.bulan;
    let key =
      d.region + "_" +
      d.tahun + "_" +
      d.bulan + "_" +
      d.wotype;   // 🔥 INI WAJIB TAMBAH WO TYPE

if (!group[key]) {
group[key] = {
region: d.region,
tahun: d.tahun,
bulan: d.bulan,
        wotype: d.wotype,
jumlah: 0,
amount: 0,
fs: 0
@@ -789,6 +656,25 @@ function renderIKRGroupFooter() {
group[key].fs += Number(d.fs || 0);
});

  // ================= SORT RAPI =================
  let sortedGroup = Object.values(group).sort((a, b) => {

    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;

    const bulanA = (monthOrder[a.bulan] || 99) - (monthOrder[b.bulan] || 99);
    if (bulanA !== 0) return bulanA;

    const woA = (woOrder[a.wotype] || 99) - (woOrder[b.wotype] || 99);
    if (woA !== 0) return woA;

    return 0;
  });

  // ================= RENDER =================
tb.innerHTML += `
   <tr style="background:#111;color:#fff">
     <td colspan="13" style="padding:10px">
@@ -797,12 +683,12 @@ function renderIKRGroupFooter() {
   </tr>
 `;

  Object.values(group).forEach(g => {
  sortedGroup.forEach(g => {

tb.innerHTML += `
     <tr style="background:#f2f2f2;font-weight:bold">
       <td colspan="5">
          ${g.region} | ${g.tahun} | ${g.bulan}
          ${g.region} | ${g.tahun} | ${g.bulan} | ${g.wotype}
       </td>

       <td>${g.jumlah}</td>
@@ -812,50 +698,30 @@ function renderIKRGroupFooter() {
       <td colspan="4"></td>
     </tr>
   `;

});
}


// ===============================
// TARUH INI PALING BAWAH FILE
// ===============================
// taruh di bawah semua function IKR kamu
function recalcApprovedValues() {
  if (!Array.isArray(dataIKR)) return;

function renderIKR() {
  const tb = document.querySelector("#tblIKR tbody");
  if (!tb) return;
  dataIKR.forEach(group => {

  tb.innerHTML = "";
    let approvedSet = new Set();
    let fsTotal = 0;

  // ================= SORTING (TAMBAHAN SAJA) =================
  const sorted = [...dataIKR].sort((a, b) => {
    (group.detail || []).forEach(d => {

    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;
      if ((d.status || "").toLowerCase().includes("approved")) {
        approvedSet.add(d.wo);
        fsTotal += Number(d.amount || 0);
      }

    const bulanA = (a.bulan || "").localeCompare(b.bulan || "");
    if (bulanA !== 0) return bulanA;
    });

    return (a.wotype || "").localeCompare(b.wotype || "");
  });
    group.approved = approvedSet.size;
    group.fs = fsTotal;

 
