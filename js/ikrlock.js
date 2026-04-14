let dataIKR = [];

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

  renderIKR();
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

    let map = {};

   // ================= LOOP DATA =================
raw.forEach(r => {

  // ================= AMBIL DATA =================
  let region =
    r.City ||
    r.city ||
    r.Region ||
    r.region ||
    "";

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
  let key = region + "_" + tahun + "_" + bulan;

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

  // kalau kosong isi
  if (!map[key].wotype && wotype) {
    map[key].wotype = wotype;
  }

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

  // ================= DETAIL =================
  map[key].detail.push({
    wo,
    status,
    amount: boq
  });

});

    // ================= FINAL CLEAN =================
    dataIKR = Object.values(map).map(x => {
      delete x.woSet;
      return x;
    });

    renderIKR();

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

  dataIKR.forEach((d, i) => {
    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><input type="checkbox" class="chkIKR"></td>
        <td>${d.region}</td>
        <td>${d.tahun}</td>
        <td>${d.wotype}</td>
        <td>${d.bulan}</td>

       <td>
        <span style="color:#000;cursor:pointer;font-weight:bold"
          onclick="showDetail(${i})">
          ${d.jumlah}
          </span>
          </td>

        <td>${d.approved}</td>
        <td>${formatRp(d.amount)}</td>
        <td>${formatRp(d.fs)}</td>

        <td contenteditable>${d.remark}</td>
        <td contenteditable>${d.invoice}</td>
        <td contenteditable>${d.note}</td>

        <td><input type="checkbox" ${d.done === "YES" ? "checked" : ""}></td>
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

  if (!tb || !popup) return;

  tb.innerHTML = "";

  const uniqueMap = new Map();

  (d.detail || []).forEach(x => {
    if (x.wo && !uniqueMap.has(x.wo)) {
      uniqueMap.set(x.wo, x);
    }
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
}

window.showDetail = showDetail;

// ================= EXPORT DETAIL =================
function exportPopupExcel() {
  if (!popupExportData || popupExportData.length === 0) {
    alert("Tidak ada data untuk export");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(popupExportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DETAIL_WO");
  XLSX.writeFile(wb, "DETAIL_WO.xlsx");
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

  }

}


// ===============================
// SIMPAN DATA IKR KE SERVER
// ===============================
async function saveIKRToServer() {

  try {

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


// ===============================
window.closePopup = () => {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
};
