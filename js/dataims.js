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
      let city = r.City || r.city || "";
      if (!city) return;

      let pra = r["Pra Invoice"] || r["PRA INVOICE"] || "";
      let invoice = r.Invoice || r["INVOICE"] || "";

      let wo =
        parseInt(
          String(
            r["Jumlah WO"] ||
            r["JUMLAH WO"] ||
            0
          ).replace(/[^0-9]/g, "")
        ) || 0;

      let job = r["Job Name"] || r["JOB NAME"] || "";

      let total =
        parseInt(
          String(
            r["Invoice Total"] ||
            r["INVOICE TOTAL"] ||
            0
          ).replace(/[^0-9]/g, "")
        ) || 0;

      let key =
        city.trim().toUpperCase() + "_" +
        pra + "_" +
        invoice + "_" +
        job;

      if (!map[key]) {
        map[key] = {
          city,
          pra,
          invoice,
          jumlah: 0,
          job,
          total: 0
        };
      }

      map[key].jumlah += wo;
      map[key].total += total;
    });

    let hasilBaru = Object.values(map);

    let gabung = [...dataIMS, ...hasilBaru];
    let finalMap = {};

    gabung.forEach(d => {
      let key =
        d.city + "_" +
        d.pra + "_" +
        d.invoice + "_" +
        d.job;

      if (!finalMap[key]) {
        finalMap[key] = { ...d };
      } else {
        finalMap[key].jumlah += Number(d.jumlah || 0);
        finalMap[key].total += Number(d.total || 0);
      }
    });

    dataIMS = Object.values(finalMap);

    renderIMS();

    e.target.value = "";
    alert("UPLOAD IMS OK");
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function renderIMS() {
  const tb = document.querySelector("#tblIMS tbody");
  if (!tb) return;

  tb.innerHTML = "";

  dataIMS.forEach((d, i) => {
    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><input type="checkbox" class="chkIMS"></td>
        <td onclick="showPopupIMS(${i})" style="cursor:pointer;font-weight:bold">
          ${d.city}
        </td>
        <td>${d.pra}</td>
        <td>${d.invoice}</td>
        <td>${d.jumlah}</td>
        <td>${d.job}</td>
        <td>${formatRp(d.total)}</td>
      </tr>
    `;
  });
}

// ================= DELETE =================
function hapusIMS() {
  const chk = document.querySelectorAll(".chkIMS");
  dataIMS = dataIMS.filter((_, i) => !chk[i]?.checked);
  renderIMS();
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

  tb.innerHTML = `
    <tr>
      <td>${d.city}</td>
      <td>${d.pra}</td>
      <td>${d.invoice}</td>
      <td>${d.jumlah}</td>
      <td>${d.job}</td>
      <td>${formatRp(d.total)}</td>
    </tr>
  `;

  popupExportIMS.push({
    City: d.city,
    Pra_Invoice: d.pra,
    Invoice: d.invoice,
    Jumlah_WO: d.jumlah,
    Job_Name: d.job,
    Invoice_Total: d.total
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
