// ================= GLOBAL =================
let dataIMS = [];
let popupExportIMS = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("fileIMS");
  const check = document.getElementById("checkIMS");

  if (file) file.addEventListener("change", importIMS);

  if (check) {
    check.addEventListener("change", e => {
      document.querySelectorAll(".chkIMS").forEach(c => {
        c.checked = e.target.checked;
      });
    });
  }

  renderIMS();
});

// ================= IMPORT IMS =================
function importIMS(e) {
  const file = e.target.files[0];
  if (!file) return;

  
  if (!file.name.match(/\.(xlsx|xls)$/)) {
    alert("File harus Excel (.xlsx / .xls)");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("File terlalu besar (max 5MB)");
    return;
  }

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

  let city = (r.City || "").toString().trim();
  if (!city) return;

  let pra =
    r["Pra Invoice Number"] ||
    r["Pra Invoice"] ||
    "";

  let invoice =
    r["Invoice Number"] ||
    r["Invoice"] ||
    "";

 let wo =
  r["Wonumber"] ||
  r["WO Number"] ||
  "-";

wo = String(wo).trim().toUpperCase();

 let woTotal =
  parseInt(
    String(r["WO Total"] || r["WO"] || 0)
      .toString()
      .replace(/[^0-9]/g, "")
  ) || 0;

  let job = (r["Job Name"] || "").toString().trim();

  pra = String(pra).trim();
  invoice = String(invoice).trim();
  

  let key = (pra || "NO_PRA") + "_" + (invoice || "NO_INV");

  if (!map[key]) {
    map[key] = {
      city,
      pra,
      invoice,
      jumlah: 0,
      job,
      total: 0,
      detail: [],
    };
  }

  let existing = map[key].detail.find(d => d.wo === wo);

if (!existing) {
  map[key].jumlah++;

  map[key].detail.push({
    wo,
    total: woTotal
  });

  map[key].total += woTotal;
} else {
  existing.total += woTotal;
}
});

// ✅ PINDAH KE SINI (DI LUAR LOOP)
let hasilBaru = Object.values(map).map(x => {
  const ppn = x.total * 0.11;
  const fee = x.total * 0.0175;
  const fs = x.total - ppn + fee;

  return {
    ...x,
    ppn,
    fee,
    fs
  };
});
dataIMS = hasilBaru;
renderIMS();

if (typeof syncIMSkeIKR === "function") {
  syncIMSkeIKR();
}

e.target.value = "";
alert("UPLOAD IMS OK");
  };

  reader.readAsBinaryString(file);
}

// ================= DELETE =================
function hapusIMS() {
  const chk = document.querySelectorAll(".chkIMS");
  dataIMS = dataIMS.filter((_, i) => !chk[i]?.checked);

  renderIMS();

  if (typeof syncIMSkeIKR === "function") {
    syncIMSkeIKR();
  }
}

window.hapusIMS = hapusIMS;

// ================= DOWNLOAD =================
function downloadIMS() {
  if (!dataIMS.length) return alert("Tidak ada data");

  const ws = XLSX.utils.json_to_sheet(dataIMS);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DATA IMS");
  XLSX.writeFile(wb, "DATA_IMS.xlsx");
}
window.downloadIMS = downloadIMS;

// ================= POPUP =================
function showPopupIMS(i) {
  const d = dataIMS[i];
  if (!d) return;

  const tb = document.getElementById("popupBodyIMS");
  tb.innerHTML = "";

  popupExportIMS = [];

  (d.detail || []).forEach(x => {
    tb.innerHTML += `
      <tr>
        <td>${escapeHTML(d.pra)}</td>
        <td>${escapeHTML(d.invoice)}</td>
        <td>${escapeHTML(x.wo)}</td>
        <td>${formatRp(x.total)}</td>
        </tr>
    `;

    popupExportIMS.push({
      Pra_Invoice: d.pra,
      Invoice: d.invoice,
      WO: x.wo,
      Total: x.total
    });
  });

  document.getElementById("popupIMS").style.display = "block";
}
function closePopupIMS() {
  document.getElementById("popupIMS").style.display = "none";
}

// ================= EXPORT POPUP =================
function exportPopupIMS() {
  const ws = XLSX.utils.json_to_sheet(popupExportIMS);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DETAIL_IMS");
  XLSX.writeFile(wb, "DETAIL_IMS.xlsx");
}

// ================= FORMAT =================
function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}


function renderIMS() {
  const tb = document.querySelector("#tblIMS tbody");
  if (!tb) return;

  tb.innerHTML = "";

  dataIMS.forEach((d, i) => {
    tb.innerHTML += `
    <tr>
      <td>${i + 1}</td>
      <td><input type="checkbox" class="chkIMS"></td>

     <td onclick="showPopupIMS(${i})"
    style="cursor:pointer;font-weight:bold">
  ${escapeHTML(d.city)}
</td>

      <td>${escapeHTML(d.pra)}</td>
      <td>${escapeHTML(d.invoice)}</td>

      <td onclick="showPopupIMS(${i})"
          style="cursor:pointer;color:#1565c0;font-weight:bold">
        ${d.jumlah}
      </td>

      <td>${escapeHTML(d.job)}</td>
      <td>${formatRp(d.fs)}</td>
    </tr>
    `;
  });

  renderIMSFooter();
}

//==============

function renderIMSFooter() {
  const tb = document.querySelector("#tblIMS tbody");
  if (!tb) return;

  let totalWO = 0;
  let totalAmount = 0;

  dataIMS.forEach(d => {
    totalWO += Number(d.jumlah || 0);
    totalAmount += Number(d.fs || 0);
  });

  tb.innerHTML += `
    <tr style="background:#111;color:#fff;font-weight:bold">
      <td colspan="5">TOTAL</td>
      <td>${totalWO}</td>
      <td></td>
      <td>${formatRp(totalAmount)}</td>
    </tr>
  `;
}

  function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
