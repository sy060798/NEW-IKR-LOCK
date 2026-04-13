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

// ================= HAPUS DATA (FIXED TOTAL BLOCK BUG) =================
function hapusData() {
  const checkboxes = document.querySelectorAll(".chk");
  let deletedIds = [];

  if (!Array.from(checkboxes).some(c => c.checked)) {
    alert("Pilih data dulu!");
    return;
  }

  if (!confirm("Hapus data terpilih?")) return;

  dataIKR = dataIKR.filter((d, i) => {
    const checked = checkboxes[i]?.checked;

    if (checked) {
      if (d.id) deletedIds.push(d.id);
      return false;
    }
    return true;
  });

  render();

  // ================= SYNC SERVER =================
  if (deletedIds.length > 0) {
    fetch(SERVER_URL + "/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: deletedIds })
    })
      .then(async (r) => {
        const text = await r.text();
        try { return JSON.parse(text); } catch { return text; }
      })
      .then(() => {
        console.log("Server delete sukses");
        alert("Hapus sync server OK");
      })
      .catch(err => {
        console.error("Server delete gagal:", err);
        alert("Local sudah hapus, server gagal sync");
      });
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
            city, tahun, bulan, job,
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
        let amount = Math.round(g.woTotal); // ✅ PPN SUDAH DIHAPUS

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

    } else {
      raw.forEach(r => {
        let region = r.REGION || r.Region || "";
        if (!region) return;

        let amount = parseAngka(r.AMOUNT || r.Amount);
        let fs = parseAngka(r["FS AMOUNT"] || r["FS Amount"]);

        newData.push({
          id: Date.now() + Math.random(),
          type: "IKR",
          region,
          tahun: r.TAHUN || r.Tahun || "",
          wotype: r["WO TYPE"] || r["Wo Type"] || "",
          bulan: r.BULAN || r.Bulan || "",
          jumlah: r["JUMLAH WO"] || 0,
          approved: r["WO APPROVED"] || 0,
          amount,
          fs,
          selisih: amount - fs,
          remark: "",
          invoice: "",
          note: "",
          done: "NO",
          listWO: []
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

// ================= IMPORT IMS UPDATE =================
function importExcelIMS(e) {
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
    let statusMap = {};

    raw.forEach(r => {
      let city = r.City || r.city || "";
      let woEnd = r["Wo End"] || r["woEnd"] || "";
      let job = r["Job Name"] || r["jobName"] || "";
      let wo = r["Wonumber"] || "-";
      let status = r["Status"] || "-";

      if (!city || !woEnd) return;

      let date = new Date(woEnd);
      if (isNaN(date)) return;

      let tahun = date.getFullYear();
      let bulan = date.toLocaleString("id-ID", { month: "short" });

      let key = city + "_" + tahun + "_" + bulan + "_" + job;

      if (!map[key]) map[key] = 0;
      map[key]++;

      statusMap[wo] = status;
    });

    dataIKR.forEach(d => {
      let key = d.region + "_" + d.tahun + "_" + d.bulan + "_" + d.wotype;

      if (map[key]) d.approved = map[key];

      if (d.listWO?.length) {
        d.listWO.forEach(x => {
          if (statusMap[x.wo] !== undefined) {
            x.status = statusMap[x.wo];
          }
        });
      }
    });

    render();
    alert("IMS berhasil update");
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= SERVER =================
function uploadServer() {
  fetch(SERVER_URL + "/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataIKR)
  })
    .then(r => r.json())
    .then(() => alert("Upload ke server sukses"))
    .catch(err => {
      console.error(err);
      alert("Upload server gagal");
    });
}

// ================= UTIL =================
function format(n) {
  return "Rp " + (Number(n) || 0).toLocaleString("id-ID");
}

function parseAngka(v) {
  if (!v) return 0;
  return parseInt(String(v).replace(/[^0-9]/g, "")) || 0;
}

// ================= GLOBAL STUBS (NO OVERWRITE FIXED) =================
function edit() {}
function toggleDone() {}
function generatePivot() {}
function download() {}
function closePopup() {
  const popup = document.getElementById("popupWO");
  if (popup) popup.style.display = "none";
}

window.showTab = showTab;
window.showDetail = showDetail;
window.hapusData = hapusData;
window.closePopup = closePopup;
window.download = download;
window.generatePivot = generatePivot;
window.uploadServer = uploadServer;
