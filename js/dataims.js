// js/dataims.js

let dataIMS = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  const fileIMS = document.getElementById("fileIMS");

  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  document.getElementById("searchPra")?.addEventListener("input", renderIMS);
  document.getElementById("searchInv")?.addEventListener("input", renderIMS);
  document.getElementById("searchRegion")?.addEventListener("input", renderIMS);
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
      const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
        defval: "",
        raw: false
      });

      json.forEach(r => raw.push(r));
    });

    let group = {};

    raw.forEach(r => {

      let city = r.City || "";
      let pra = r["Pra Invoice Number"] || "";
      let inv = r["Invoice Number"] || "";
      let job = r["Job Name"] || "";
      let wo = r.Wonumber || "";
      let total = angka(r["Boq Total"]);

      if (!pra) return;

      if (!group[pra]) {
        group[pra] = {
          city,
          pra,
          inv,
          job,
          jumlah: 0,
          total: 0,
          detail: []
        };
      }

      group[pra].jumlah++;
      group[pra].total += total;

      group[pra].detail.push({
        wo,
        total
      });

    });

    dataIMS = Object.values(group);

    renderIMS();

    syncIMSKeIKR();

    alert("Upload IMS berhasil");
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function renderIMS() {

  let tb = document.querySelector("#tblIMS tbody");
  tb.innerHTML = "";

  let sPra = document.getElementById("searchPra")?.value.toLowerCase() || "";
  let sInv = document.getElementById("searchInv")?.value.toLowerCase() || "";
  let sReg = document.getElementById("searchRegion")?.value.toLowerCase() || "";

  let rows = dataIMS.filter(x => {

    return x.pra.toLowerCase().includes(sPra) &&
           x.inv.toLowerCase().includes(sInv) &&
           x.city.toLowerCase().includes(sReg);
  });

  rows.forEach((d, i) => {

    tb.innerHTML += `
    <tr>
      <td>${i + 1}</td>
      <td><input type="checkbox" class="chkIMS"></td>
      <td>${d.city}</td>
      <td>${d.pra}</td>
      <td>${d.inv}</td>
      <td>
        <span class="click" onclick="detailIMS('${d.pra}')">
          ${d.jumlah}
        </span>
      </td>
      <td>${d.job}</td>
      <td>${rupiah(d.total)}</td>
    </tr>`;
  });
}

// ================= DETAIL =================
function detailIMS(pra) {

  let d = dataIMS.find(x => x.pra === pra);
  if (!d) return;

  let thead = document.querySelector("#tblPopup thead");
  let tbody = document.querySelector("#tblPopup tbody");

  thead.innerHTML = `
  <tr>
    <th>WO Number</th>
    <th>Total</th>
  </tr>`;

  tbody.innerHTML = "";

  d.detail.forEach(x => {
    tbody.innerHTML += `
    <tr>
      <td>${x.wo}</td>
      <td>${rupiah(x.total)}</td>
    </tr>`;
  });

  document.getElementById("popupTitle").innerText = "DETAIL PRA INVOICE";
  document.getElementById("popup").style.display = "block";
}

// ================= DELETE =================
function hapusIMS() {

  let chk = document.querySelectorAll(".chkIMS");

  dataIMS = dataIMS.filter((x, i) => !chk[i].checked);

  renderIMS();
}

// ================= DOWNLOAD =================
function downloadIMS() {

  let ws = XLSX.utils.json_to_sheet(dataIMS);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "IMS");
  XLSX.writeFile(wb, "DATA_IMS.xlsx");
}

// ================= SYNC IMS KE IKR =================
function syncIMSKeIKR() {

  if (!dataIKR.length) return;

  dataIKR.forEach(r => {

    let cocok = dataIMS.filter(x =>
      x.city.toLowerCase() === r.region.toLowerCase()
    );

    r.approved = cocok.length;
    r.fs = cocok.reduce((a, b) => a + b.total, 0);
  });

  renderIKR();
}
