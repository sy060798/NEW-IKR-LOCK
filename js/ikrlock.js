// ================= GLOBAL =================
let dataIKR = [];
let chart = null;
const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// DETAIL POPUP
let currentDetail = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if (file) file.addEventListener("change", importExcel);
  if (fileIMS) fileIMS.addEventListener("change", importExcelIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll(".chk").forEach(c => {
        c.checked = e.target.checked;
      });
    });
  }

  loadServer?.();
});

// ================= TAB =================
function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  const el = document.getElementById(id);
  if (el) el.classList.add("active");

  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (id === "pivot") generatePivot?.();
}

// ================= UPLOAD =================
function triggerUpload() {
  document.getElementById("file")?.click();
}

function triggerUploadIMS() {
  document.getElementById("fileIMS")?.click();
}

window.triggerUpload = triggerUpload;
window.triggerUploadIMS = triggerUploadIMS;

// ================= HAPUS DATA =================
function hapusData() {
  const checkboxes = document.querySelectorAll(".chk");
  let deletedIds = [];

  if (!Array.from(checkboxes).some(c => c.checked)) {
    alert("Pilih data dulu!");
    return;
  }

  if (!confirm("Hapus data terpilih?")) return;

  const newData = [];

  dataIKR.forEach((d, i) => {
    const checked = checkboxes[i]?.checked;

    if (checked) {
      if (d.id) deletedIds.push(d.id);
    } else {
      newData.push(d);
    }
  });

  dataIKR = newData;
  render();

  if (deletedIds.length > 0) {
    fetch(SERVER_URL + "/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: deletedIds })
    })
      .then(r => r.json())
      .then(() => console.log("Server delete sukses"))
      .catch(err => console.error("Server delete gagal:", err));
  }
}

window.hapusData = hapusData;

// ================= IMPORT EXCEL =================
function importExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (evt) {
    const wb = XLSX.read(evt.target.result, { type: "binary" });

    let raw = [];
    let isIMS = false;

    wb.SheetNames.forEach(s => {
      const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
        defval: "",
        raw: false
      });

      if (json.length) {
        const first = json[0];

        if (
          first["Wo End"] ||
          first["City"] ||
          first["Job Name"] ||
          first["woEnd"] ||
          first["city"] ||
          first["jobName"]
        ) {
          isIMS = true;
        }

        json.forEach(r => raw.push(r));
      }
    });

    let newData = [];

    // ================= IMS =================
    if (isIMS) {
      let map = {};

      raw.forEach(r => {
        let city = r.City || r.city || "";
        let woEnd = r["Wo End"] || r["woEnd"] || "";
        let job = r["Job Name"] || r["jobName"] || "";

        if (!city || !woEnd) return;

        let wo = parseAngka(r["Wo Total"] || r["woTotal"] || 0);
        let woNumber = String(r["Wonumber"] || "").trim();

        let date = new Date(woEnd);
        if (isNaN(date)) return;

        let tahun = date.getFullYear();
        let bulan = date.toLocaleString("id-ID", { month: "short" });

        let key = city + "_" + tahun + "_" + bulan + "_" + job;

        if (!map[key]) {
          map[key] = {
            city,
            tahun,
            bulan,
            job,
            total: 0,
            woTotal: 0,
            listWO: [],
            woSet: new Set()
          };
        }

        if (woNumber && !map[key].woSet.has(woNumber)) {
          map[key].woSet.add(woNumber);
          map[key].total++;
          map[key].woTotal += wo;
        }

        if (woNumber && !map[key].listWO.find(x => x.wo === woNumber)) {
          map[key].listWO.push({
            wo: woNumber,
            ref: r["Reference Code"] || "-",
            quo: r["Quotation Id"] || "-",
            status: r["Status"] || "-"
          });
        }
      });

      Object.values(map).forEach(g => {
        let amount = Math.round(g.woTotal / 1.11); // FIX PPN

        newData.push({
          id: Date.now() + Math.random(),
          type: "IKR",
          region: g.city,
          tahun: g.tahun,
          wotype: g.job,
          bulan: g.bulan,
          jumlah: g.total,
          approved: 0,
          amount,
          fs: 0,
          selisih: amount,
          remark: "",
          invoice: "",
          note: "",
          done: "NO",
          listWO: g.listWO
        });
      });
    }

    dataIKR = [...dataIKR, ...newData];
    sortData();
    render();

    alert("Upload sukses: " + newData.length + " data");
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= EXPORT EXCEL (NEW) =================
function downloadExcel() {
  if (!dataIKR.length) return alert("Tidak ada data");

  const exportData = dataIKR.map(d => ({
    Region: d.region,
    Tahun: d.tahun,
    Bulan: d.bulan,
    WO_Type: d.wotype,
    Jumlah: d.jumlah,
    Approved: d.approved,
    Amount: d.amount,
    FS: d.fs,
    Selisih: d.selisih,
    Remark: d.remark,
    Invoice: d.invoice,
    Note: d.note,
    Done: d.done
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DATA");

  XLSX.writeFile(wb, "data_IKR.xlsx");
}

window.downloadExcel = downloadExcel;

// ================= SERVER =================
function uploadServer() {
  fetch(SERVER_URL + "/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataIKR)
  })
    .then(r => r.json())
    .then(() => alert("Upload server sukses"))
    .catch(() => alert("Upload server gagal"));
}

// ================= UTIL =================
function format(n) {
  return "Rp " + (Number(n) || 0).toLocaleString("id-ID");
}

function parseAngka(v) {
  if (!v) return 0;
  return parseInt(String(v).replace(/[^0-9]/g, "")) || 0;
}

// ================= STUB =================
function edit() {}
function toggleDone() {}
function generatePivot() {}
function closePopup() {
  document.getElementById("popupWO")?.style.display = "none";
}

// ================= WINDOW =================
window.showTab = showTab;
window.showDetail = showDetail;
window.hapusData = hapusData;
window.uploadServer = uploadServer;
window.closePopup = closePopup;
