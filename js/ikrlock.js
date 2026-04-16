// ================= GLOBAL =================
let dataIKR = [];
let popupExportData = [];

if (typeof SERVER_URL === "undefined") {
  var SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("fileIKR");
  const check = document.getElementById("checkIKR");

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
function openTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".toolbar").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById("tab-" + id)?.classList.add("active");
  document.getElementById("tb-" + id)?.classList.add("active");

  btn?.classList.add("active");
}
window.openTab = openTab;

// ================= IMPORT IKR =================
function importIKR(e) {
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

    let existingWO = new Set(
      dataIKR.flatMap(d => (d.detail || []).map(x => x.wo))
    );

    let map = {};

    raw.forEach(r => {
      const ref =
    r["Reference Code"] ||
    r["REFERENCE CODE"] ||
    "-";

  const quo =
    r["Quotation Id"] ||
    r["QUOTATION ID"] ||
    "-";

      let region = normalRegion(
        r.City || r.city || r.Region || r.region || ""
      );

      let woEnd =
        r["Wo End"] ||
        r["WO END"] ||
        r["wo end"] ||
        "";

      if (!region || !woEnd) return;

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

      let txt = String(woEnd).trim().split(" ")[0];
      let p = txt.split("/");
      if (p.length !== 3) return;

      let hari = parseInt(p[0]);
      let bln = parseInt(p[1]) - 1;
      let thn = parseInt(p[2]);

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

      if (!map[key]) {
        map[key] = {
          region,
          tahun: thn,
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

      const wo =
        String(
          r.Wonumber ||
          r["WO Number"] ||
          "-"
        ).trim();

      if (existingWO.has(wo)) return;

      const status = r.Status || "-";

      if (!map[key].woSet.has(wo)) {
        map[key].woSet.add(wo);
        map[key].jumlah++;
      }

      map[key].amount += boq;

      map[key].detail.push({
        wo,
        ref,
        quo,
        status,
        amount: boq
        });

      existingWO.add(wo);
    });

    let hasilBaru = Object.values(map).map(x => {
      delete x.woSet;
      return x;
    });

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

    recalcApprovedValues();
    renderIKR();
    syncIMSkeIKR();

    e.target.value = "";
    alert("UPLOAD OK");
  };

  reader.readAsBinaryString(file);
}




// ================= RENDER =================
function renderIKR() {
  const tb = document.querySelector("#tblIKR tbody");
  if (!tb) return;

  tb.innerHTML = "";

  const sorted = [...dataIKR].sort((a, b) => {
    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;

    const bulanA = (a.bulan || "").localeCompare(b.bulan || "");
    if (bulanA !== 0) return bulanA;

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
        <td>
          <span onclick="showDetail(${i})"
            style="cursor:pointer;font-weight:bold">
            ${d.jumlah}
          </span>
        </td>
        <td>${d.approved || 0}</td>
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
}

// ================= FORMAT =================
function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

// ================= DELETE =================
function hapusIKR() {
  const chk = document.querySelectorAll(".chkIKR");
  dataIKR = dataIKR.filter((_, i) => !chk[i]?.checked);
  syncIMSkeIKR(); 
  renderIKR();
}
window.hapusIKR = hapusIKR;

// ================= DETAIL =================
function showDetail(i) {
  const sorted = [...dataIKR].sort((a, b) => {
    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;

    const bulanA = (a.bulan || "").localeCompare(b.bulan || "");
    if (bulanA !== 0) return bulanA;

    return (a.wotype || "").localeCompare(b.wotype || "");
  });

  const d = sorted[i];
  if (!d) return alert("Data tidak ditemukan");

  const tb = document.getElementById("popupBody");
  tb.innerHTML = "";

  popupExportData = [];

(d.detail || []).forEach(x => {
  tb.innerHTML += `
    <tr>
      <td>${x.wo}</td>
      <td>${x.ref || "-"}</td>
      <td>${x.quo || "-"}</td>
      <td>${x.status}</td>
      <td>${formatRp(x.amount)}</td>
    </tr>
  `;

  popupExportData.push({
    WO: x.wo,
    Reference: x.ref,
    Quotation: x.quo,
    Status: x.status,
    Amount: x.amount
  });
});

document.getElementById("popup").style.display = "block";

} 


// ================= EXPORT DETAIL =================
function exportPopupExcel() {
  const ws = XLSX.utils.json_to_sheet(popupExportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DETAIL_WO");
  XLSX.writeFile(wb, "DETAIL_WO.xlsx");
}

// ================= DOWNLOAD =================
function downloadExcelIKR() {
  if (!dataIKR.length) return alert("Tidak ada data");

  const exportData = dataIKR.map(d => ({
    Region: d.region || "",
    Tahun: d.tahun || "",
    Bulan: d.bulan || "",
    WOType: d.wotype || "",

    Jumlah: d.jumlah || 0,
    Approved: d.approved || 0,

    Amount: d.amount || 0,
    FS: d.fs || 0,

    Remark: d.remark || "",
    Invoice: d.invoice || "",
    Note: d.note || "",
    Done: d.done || "NO"
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "IKR");
  XLSX.writeFile(wb, "DATA_IKR.xlsx");
}

// ================= SERVER =================
async function loadIKRFromServer() {
  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IKR");
    const data = await res.json();

    dataIKR = Array.isArray(data) ? data : [];

    recalcApprovedValues();
    syncIMSkeIKR();
    renderIKR();
  } catch (err) {
    console.log("server error");
  }
}

// ================= RECALC =================
function recalcApprovedValues() {
  if (!Array.isArray(dataIKR)) return;

  dataIKR.forEach(group => {
    group.approved = 0;
    group.fs = 0;
  });
}

// ===============================
// AUTO LOAD SAAT BUKA
// ===============================

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
    <td colspan="14" style="padding:10px">
      📊 SUMMARY REGION GROUPING
    </td>
  </tr>
`;

sortedGroup.forEach(g => {
  tb.innerHTML += `
    <tr style="background:#f2f2f2;font-weight:bold">
      <td colspan="6">
        ${g.region} | ${g.tahun} | ${g.bulan} | ${g.wotype}
      </td>

      <td>${g.jumlah}</td>
      <td>0</td>
      <td>${formatRp(g.amount)}</td>
      <td>${formatRp(g.fs)}</td>

      <td colspan="4"></td>
    </tr>
  `;
});
}
 // ================= sincron =================

function syncIMSkeIKR() {
  if (!Array.isArray(dataIMS) || !Array.isArray(dataIKR)) return;

  let mapWO = {};

  dataIMS.forEach(d => {
    (d.detail || []).forEach(x => {
      const wo = String(x.wo || "").trim();
      if (!wo) return;

      mapWO[wo] = Number(x.total || 0);
    });
  });

  // reset
  dataIKR.forEach(group => {
    group.approved = 0;
    group.fs = 0;
  });

  // sync
  dataIKR.forEach(group => {
    let counted = new Set();

    (group.detail || []).forEach(x => {
      const wo = String(x.wo || "").trim();
      if (!wo) return;

      if (mapWO[wo] !== undefined && !counted.has(wo)) {
        counted.add(wo);

        group.approved += 1;
        group.fs += mapWO[wo];

        x.status = "APPROVED";
      } else {
        x.status = "OPEN";
      }
    });
  });

  console.log("SYNC IMS -> IKR SELESAI");

  // 🔥 WAJIB
  renderIKR();
}


// ================= SEARCH + CLEAR IKR (ANTI SILANG) =================
document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("searchIKR");
  const btnClear = document.getElementById("clearSearchIKR");

  if (!input) return;

  function filterTable() {
    let keyword = input.value.toLowerCase().trim();

    const filtered = dataIKR.filter(d =>
      (d.region || "").toLowerCase().includes(keyword) ||
      (d.wotype || "").toLowerCase().includes(keyword) ||
      (d.bulan || "").toLowerCase().includes(keyword)
    );

    renderIKRCustom(filtered);
  }

  // realtime
  input.addEventListener("input", filterTable);

  // enter
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") filterTable();
  });

  // CLEAR = balik normal
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      input.value = "";
      renderIKR(); // 🔥 ini kunci anti silang
    });
  }

});


//============================

function renderIKRCustom(list) {
  const tb = document.querySelector("#tblIKR tbody");
  if (!tb) return;

  tb.innerHTML = "";

  list.forEach((d, i) => {
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
        <td>${d.remark || ""}</td>
        <td>${d.invoice || ""}</td>
        <td>${d.note || ""}</td>
        <td>${d.done || "NO"}</td>
      </tr>
    `;
  });
}


// ================= PATCH FIX SAVE FIELD + DONE =================

// FIX: update field lebih aman (tidak rusak sistem lama)
function updateField(i, field, value){
  if (!dataIKR[i]) return;

  dataIKR[i][field] = (typeof value === "string")
    ? value.trim()
    : value;

  localStorage.setItem("dataIKR", JSON.stringify(dataIKR));
}

// FIX: checkbox DONE di renderIKR (biar benar-benar update)
function renderIKR() {
  const tb = document.querySelector("#tblIKR tbody");
  if (!tb) return;

  tb.innerHTML = "";

  const sorted = [...dataIKR].sort((a, b) => {
    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;

    const bulanA = (a.bulan || "").localeCompare(b.bulan || "");
    if (bulanA !== 0) return bulanA;

    return (a.wotype || "").localeCompare(b.wotype || "");
  });

  sorted.forEach((d, i) => {

    const realIndex = dataIKR.findIndex(x =>
      x.region === d.region &&
      x.tahun === d.tahun &&
      x.bulan === d.bulan &&
      x.wotype === d.wotype
    );

    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><input type="checkbox" class="chkIKR"></td>

        <td>${d.region}</td>
        <td>${d.tahun}</td>
        <td>${d.wotype}</td>
        <td>${d.bulan}</td>

        <td>
          <span onclick="showDetail(${i})"
            style="cursor:pointer;font-weight:bold">
            ${d.jumlah}
          </span>
        </td>

        <td>${d.approved || 0}</td>
        <td>${formatRp(d.amount)}</td>
        <td>${formatRp(d.fs)}</td>

        <!-- REMARK -->
        <td contenteditable
          oninput="updateField(${realIndex}, 'remark', this.innerText)">
          ${d.remark || ""}
        </td>

        <!-- INVOICE -->
        <td contenteditable
          oninput="updateField(${realIndex}, 'invoice', this.innerText)">
          ${d.invoice || ""}
        </td>

        <!-- NOTE -->
        <td contenteditable
          oninput="updateField(${realIndex}, 'note', this.innerText)">
          ${d.note || ""}
        </td>

        <!-- DONE (FIX SAVE REAL TIME) -->
        <td>
          <input type="checkbox"
            ${d.done === "YES" ? "checked" : ""}
            onchange="updateField(${realIndex}, 'done', this.checked ? 'YES' : 'NO')">
        </td>

      </tr>
    `;
  });
}

// FIX: supaya data tidak hilang saat refresh browser
(function restoreLocal(){
  const saved = localStorage.getItem("dataIKR");
  if (saved) {
    try {
      dataIKR = JSON.parse(saved);
    } catch(e){}
  }
})();


function syncGlobalIKR(){
  window.dataIKR = Array.isArray(dataIKR) ? dataIKR : [];
}

// auto sync setiap perubahan data
function pushToGlobal(){
  syncGlobalIKR();

  // kalau STATUS ada, langsung refresh
  if (typeof generateStatus === "function") {
    generateStatus();
  }
}

// ================= AUTO INIT =================
(function initGlobalBridge(){
  syncGlobalIKR();

  // backup safety (biar tidak hilang saat reload data)
  window.addEventListener("load", () => {
    syncGlobalIKR();

    setTimeout(() => {
      if (typeof generateStatus === "function") {
        generateStatus();
      }
    }, 500);
  });
})();
