// ================= GLOBAL =================
let dataIMS = [];

const SERVER_URL = window.SERVER_URL || "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("fileIKR");
  const check = document.getElementById("checkIKR");

  if (file) file.addEventListener("change", importIKR);
  const file = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkIMS");

  if (check) {
    check.addEventListener("change", e => {
      document.querySelectorAll(".chkIKR").forEach(c => {
        c.checked = e.target.checked;
      });
  if (file) file.addEventListener("change", importIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll("#tblIMS tbody input[type='checkbox']")
        .forEach(cb => cb.checked = e.target.checked);
    });
  }

  renderIKR();
  renderIMS();
  loadIMSServer(); // auto load
});

// ================= TAB FIX =================
function openTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".toolbar").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById("tab-" + id)?.classList.add("active");
  document.getElementById("tb-" + id)?.classList.add("active");

  btn?.classList.add("active");
}

window.openTab = openTab;
// ================= IMPORT IMS =================
function importIMS(e) {

// ================= IMPORT IKR =================
function importIKR(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (evt) {

    const wb = XLSX.read(evt.target.result, { type: "binary" });

    let raw = [];
@@ -52,688 +45,148 @@ function importIKR(e) {

    let map = {};

    // ================= WO EXISTING GLOBAL (ANTI DOUBLE TOTAL SYSTEM) =================
    let existingWO = new Set(
      dataIKR.flatMap(d => (d.detail || []).map(x => x.wo))
    );

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

      let namaBulan = [
        "Jan","Feb","Mar","Apr","Mei","Jun",
        "Jul","Agu","Sep","Okt","Nov","Des"
      ];

      let bulan = namaBulan[bln];

      let key =
        region.trim().toUpperCase() + "_" +
        thn + "_" +
        bulan + "_" +
        (wotype || "").trim().toUpperCase();

      // ================= INIT MAP =================
      let city = r.City || r.city || "";
      let pra = r["Pra Invoice Number"] || "";
      let inv = r["Invoice Number"] || "";
      let job = r["Job Name"] || "";

      if (!city) return;

      let key = city + "_" + pra;

      if (!map[key]) {
        map[key] = {
          region,
          tahun: thn,
          bulan,
          wotype,
          city,
          pra,
          inv,
          job,
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
          total: 0,
          detail: []
        };
      }

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

      // ================= 🔥 INTI PATCH: SKIP WO SUDAH ADA =================
      if (existingWO.has(wo)) return;

      if (!map[key].woSet.has(wo)) {
        map[key].woSet.add(wo);
        map[key].jumlah++;
      }

      map[key].amount += boq;
      map[key].jumlah++;
      map[key].total += parseAngka(r["Invoice Total"]);

      map[key].detail.push({
        wo,
        status,
        amount: boq
        wo: r.Wonumber || "-",
        status: r.Status || "-",
        amount: parseAngka(r["Invoice Total"])
      });

      existingWO.add(wo);
    });

    // ================= CLEAN MAP =================
    let hasilBaru = Object.values(map).map(x => {
      delete x.woSet;
      return x;
    });

    // ================= MERGE OLD + NEW =================
    let gabung = [...dataIKR, ...hasilBaru];

    let finalMap = {};

    gabung.forEach(d => {

      let key =
        d.region + "_" +
        d.tahun + "_" +
        d.bulan + "_" +
        d.wotype;

      if (!finalMap[key]) {
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
    dataIMS = Object.values(map);

    renderIKR();
    renderIMS();
    saveIMSToServer();

    alert("IMS upload sukses");
    e.target.value = "";
    alert("UPLOAD OK (WO DUPLICATE SKIP ACTIVE)");
  };

  reader.readAsBinaryString(file);
}
// ================= MASTER GRUOING =================

function renderIKR() {
  const tb = document.querySelector("#tblIKR tbody");
// ================= RENDER IMS =================
function renderIMS() {

  const tb = document.querySelector("#tblIMS tbody");
  if (!tb) return;

  tb.innerHTML = "";

  const sorted = [...dataIKR].sort((a, b) => {
    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;

    const bulanA = (a.bulan || "").localeCompare(b.bulan || "");
    if (bulanA !== 0) return bulanA;
  dataIMS.forEach((d, i) => {

    return (a.wotype || "").localeCompare(b.wotype || "");
  });

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

        <td contenteditable>${d.remark || ""}</td>
        <td contenteditable>${d.invoice || ""}</td>
        <td contenteditable>${d.note || ""}</td>

        <td>
          <input type="checkbox" ${d.done === "YES" ? "checked" : ""}>
        </td>
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
// ================= POPUP DETAIL =================
let popupExportData = [];

function showDetail(i) {
  const d = dataIKR[i];
  if (!d) return alert("Data tidak ditemukan");

  const tb = document.getElementById("popupBody");
  const popup = document.getElementById("popup");
// ================= POPUP =================
function showIMS(i) {

  if (!tb || !popup) return;
  const d = dataIMS[i];
  if (!d) return;

  const tb = document.getElementById("popupBody");
  tb.innerHTML = "";

  const uniqueMap = new Map();

  (d.detail || []).forEach(x => {
    if (x.wo && !uniqueMap.has(x.wo)) {
      uniqueMap.set(x.wo, x);
    }
    tb.innerHTML += `
      <tr>
        <td>${x.wo}</td>
        <td>${x.status}</td>
        <td>${formatRp(x.amount)}</td>
      </tr>
    `;
  });

  const uniqueData = [...uniqueMap.values()];

  popupExportData = uniqueData.map(x => ({
    WO: x.wo,
    Status: x.status,
    Amount: x.amount
  }));

  if (uniqueData.length === 0) {
    tb.innerHTML = `<tr><td colspan="3">Tidak ada data</td></tr>`;
  } else {
    uniqueData.forEach(x => {
      tb.innerHTML += `
        <tr>
          <td>${x.wo}</td>
          <td>${x.status}</td>
          <td>${formatRp(x.amount)}</td>
        </tr>
      `;
    });
  }

  popup.style.display = "block";
  document.getElementById("popup").style.display = "block";
}

window.showDetail = showDetail;

// ================= EXPORT DETAIL =================
function exportPopupExcel() {
  if (!popupExportData || popupExportData.length === 0) {
    alert("Tidak ada data untuk export");
    return;
  }
window.showIMS = showIMS;

  const ws = XLSX.utils.json_to_sheet(popupExportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DETAIL_WO");
  XLSX.writeFile(wb, "DETAIL_WO.xlsx");
// ================= UTIL =================
function parseAngka(v) {
  return parseInt(String(v || 0).replace(/[^0-9]/g, "")) || 0;
}

window.exportPopupExcel = exportPopupExcel;

// ================= UTIL =================
function formatRp(n) {
  return "Rp " + (Number(n || 0).toLocaleString("id-ID"));
}

// ================= HAPUS =================
function hapusIKR() {
  const chk = document.querySelectorAll(".chkIKR");

  dataIKR = dataIKR.filter((_, i) => !chk[i]?.checked);

  renderIKR();
}

window.hapusIKR = hapusIKR;

// ================= STUB BIAR AMAN =================
function downloadIKR() {}
function downloadIMS() {}
function hapusIMS() {}
function generatePivot() {}
function generateStatus() {}
function uploadServerAll() {}


// ================= DOWNLOAD EXCEL =================
function downloadIKR() {

  if (!dataIKR.length) {
    alert("Tidak ada data");
    return;
  }

  const exportData = dataIKR.map((d,i)=>({
    No: i+1,
    Region: d.region,
    Tahun: d.tahun,
    "WO Type": d.wotype,
    Bulan: d.bulan,
    "Jumlah WO": d.jumlah,
    "WO Approved": d.approved,
    Amount: d.amount,
    "FS Amount": d.fs,
    Remark: d.remark,
    Invoice: d.invoice,
    Note: d.note,
    Done: d.done
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DATA IKR");

  XLSX.writeFile(wb, "DATA_IKR_LOCK.xlsx");
}

function downloadIMS() {}
function hapusIMS() {}
function generatePivot() {}
function generateStatus() {}
function uploadServerAll() {}

window.downloadIKR = downloadIKR;

// ===============================
// AMBIL DATA IKR DARI SERVER
// sinkron dengan server.js
// ===============================
async function loadIKRFromServer() {

// ================= SAVE SERVER =================
async function saveIMSToServer() {
  try {

    const res = await fetch(
      SERVER_URL + "/api/get?type=IKR"
    );

    if (!res.ok) {
      throw new Error("Gagal ambil data");
    }

    const hasil = await res.json();

    if (!Array.isArray(hasil)) {
      dataIKR = [];
     renderIKR();
      return;
    }

    dataIKR = hasil;

    renderIKR();

    console.log("Data IKR berhasil dimuat");

  } catch (err) {

    console.log("Load server gagal", err);

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


// ===============================
// SIMPAN DATA IKR KE SERVER
// ===============================
async function saveIKRToServer() {
// ================= LOAD SERVER =================
async function loadIMSServer() {

  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IMS");
    const data = await res.json();

    await fetch(
      SERVER_URL + "/api/save",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "IKR",
          data: dataIKR
        })
      }
    );

    console.log("Data IKR tersimpan");

  } catch (err) {

    console.log("Save gagal", err);

  }

}


// ===============================
// AUTO LOAD SAAT BUKA
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadIKRFromServer();
});

function normalRegion(txt){

  let r = String(txt || "")
    .trim()
    .toLowerCase();

  // hapus awalan umum
  r = r.replace(/^kota\s+/,"");
  r = r.replace(/^kabupaten\s+/,"");
  r = r.replace(/^kab\.\s+/,"");
  r = r.replace(/^kab\s+/,"");

  // rapihin spasi
  r = r.replace(/\s+/g," ").trim();

  // ================= TYPO MANUAL =================
  const typoMap = {
    "pelembang":"palembang",
    "palembng":"palembang",
    "plembang":"palembang",

    "beksi":"bekasi",
    "beksai":"bekasi",
    "bks":"bekasi",

    "jombnag":"jombang",
    "jombng":"jombang",

    "surbaya":"surabaya",
    "sby":"surabaya",

    "bdg":"bandung",
    "smg":"semarang",
    "jkt barat":"jakbar",
    "jakarta barat":"jakbar",
    "jkt selatan":"jaksel",
    "jakarta selatan":"jaksel",

    "yk":"jogja",
    "yogyakarta":"jogja"
  };

  if (typoMap[r]) r = typoMap[r];

  // ================= MASTER REGION =================
  const regionMap = {

    // BEKASI
    "bekasi":"bekasi",
    "kota bekasi":"bekasi",
    "kab bekasi":"bekasi",
    "bekasi timur":"bekasi",
    "bekasi barat":"bekasi",
    "bekasi utara":"bekasi",
    "bekasi selatan":"bekasi",

    // PALEMBANG
    "palembang":"palembang",
    "kota palembang":"palembang",

    // BANDUNG
    "bandung":"bandung",
    "kota bandung":"bandung",
    "kab bandung":"bandung",
    "bandung barat":"bandung",

    // BOGOR
    "bogor":"bogor",
    "kota bogor":"bogor",
    "kab bogor":"bogor",

    // JAKARTA
    "jakbar":"jakbar",
    "jakarta barat":"jakbar",

    "jaksel":"jaksel",
    "jakarta selatan":"jaksel",

    // JOGJA
    "jogja":"jogja",
    "yogyakarta":"jogja",

    // SURABAYA
    "surabaya":"surabaya",

    // SEMARANG
    "semarang":"semarang",

    // SOLO
    "solo":"solo",
    "surakarta":"solo",

    // TASIK
    "tasik":"tasikmalaya",
    "tasikmalaya":"tasikmalaya",

    // LAINNYA
    "bali":"bali",
    "banjarmasin":"banjarmasin",
    "cirebon":"cirebon",
    "legok":"legok",
    "makassar":"makassar",
    "malang":"malang",
    "medan":"medan",
    "purwokerto":"purwokerto",
    "binjai":"binjai",
    "ciamis":"ciamis",
    "garut":"garut",
    "lampung":"lampung",
    "majalengka":"majalengka",
    "cianjur":"cianjur",
    "jatinegara":"jatinegara",
    "purwakarta":"purwakarta",
    "serang":"serang",
    "jember":"jember",
    "jombang":"jombang",
    "karawang":"karawang",
    "kediri":"kediri",
    "lubuk pakam":"lubuk pakam",
    "meruya":"meruya",
    "probolinggo":"probolinggo",
    "sukabumi":"sukabumi"
  };

  if (regionMap[r]) r = regionMap[r];

  // kapital semua kata
  return r.replace(/\b\w/g, s => s.toUpperCase());
}

 
// ===============================
window.closePopup = () => {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
};
// ===============SISTEM GRUPING===============
function renderIKRGroupFooter() {

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
      };
    if (Array.isArray(data)) {
      dataIMS = data;
      renderIMS();
    }

    group[key].jumlah += Number(d.jumlah || 0);
    group[key].amount += Number(d.amount || 0);
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
        📊 SUMMARY REGION GROUPING
      </td>
    </tr>
  `;

  sortedGroup.forEach(g => {

    tb.innerHTML += `
      <tr style="background:#f2f2f2;font-weight:bold">
        <td colspan="5">
          ${g.region} | ${g.tahun} | ${g.bulan} | ${g.wotype}
        </td>

        <td>${g.jumlah}</td>
        <td></td>
        <td>${formatRp(g.amount)}</td>
        <td>${formatRp(g.fs)}</td>
        <td colspan="4"></td>
      </tr>
    `;
  });
  } catch (e) {
    console.log("Load IMS gagal", e);
  }
}

// ================= DELETE =================
function hapusIMS() {

// ================= sistem sycron ims =================
function recalcApprovedValues() {

  if (!Array.isArray(dataIKR)) return;

  dataIKR.forEach(group => {

    let approvedSet = new Set();
    let fsTotal = 0;

    const details = Array.isArray(group.detail) ? group.detail : [];

    details.forEach(d => {

      const status = String(d.status || "").toLowerCase();
  const chk = document.querySelectorAll("#tblIMS tbody input[type='checkbox']");

      if (status.includes("approved")) {
  dataIMS = dataIMS.filter((_, i) => !chk[i]?.checked);

        if (d.wo) approvedSet.add(d.wo);

        const amount = Number(d.amount || 0);

        if (!isNaN(amount)) {
          fsTotal += amount;
        }

      }

    });

    group.approved = approvedSet.size;
    group.fs = fsTotal;

  });
  renderIMS();
}
