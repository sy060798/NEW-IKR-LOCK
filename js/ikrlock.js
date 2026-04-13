// ================= GLOBAL =================
let dataIKR = [];
let popupDetailIKR = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  console.log("IKRLOCK LOADED");

  const fileIKR = document.getElementById("fileIKR");
  const checkIKR = document.getElementById("checkIKR");

  if (fileIKR) fileIKR.addEventListener("change", importIKR);

  if (checkIKR) {
    checkIKR.addEventListener("change", e => {
      document.querySelectorAll(".chkIKR").forEach(x => {
        x.checked = e.target.checked;
      });
    });
  }
});

// ================= IMPORT EXCEL =================
function importIKR(e) {

  const file = e.target.files[0];
  if (!file) return alert("File kosong");

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

      let region = r.City || r.city || r.Region || "";
      let woEnd = r["Wo End"] || r["woEnd"] || "";
      let status = r.Status || "";
      let wo = r.Wonumber || "";
      let boq = angka(r["Boq Total"]);

      if (!region || !woEnd) return;

      let dt = new Date(woEnd);
      if (isNaN(dt)) return;

      let tahun = dt.getFullYear();
      let bulan = dt.toLocaleString("id-ID", { month: "short" });

      let key = region + "_" + tahun + "_" + bulan + "_" + status;

      if (!group[key]) {
        group[key] = {
          region,
          tahun,
          bulan,
          wotype: status,
          jumlah: 0,
          approved: 0,
          amount: 0,
          fs: 0,
          remark: "",
          invoice: "",
          note: "",
          done: "NO",
          detail: []
        };
      }

      group[key].jumlah++;
      group[key].amount += boq;

      group[key].detail.push({
        wo,
        status,
        amount: boq
      });
    });

    dataIKR = Object.values(group);

    renderIKR();

    alert("Upload IKR sukses: " + dataIKR.length);
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function renderIKR() {

  let tb = document.querySelector("#tblIKR tbody");
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
        <span class="click" onclick="detailIKR(${i})">${d.jumlah}</span>
      </td>
      <td>${d.approved}</td>
      <td>${rupiah(d.amount)}</td>
      <td>${rupiah(d.fs)}</td>
      <td contenteditable oninput="editIKR(${i},'remark',this.innerText)">${d.remark}</td>
      <td contenteditable oninput="editIKR(${i},'invoice',this.innerText)">${d.invoice}</td>
      <td contenteditable oninput="editIKR(${i},'note',this.innerText)">${d.note}</td>
      <td>
        <input type="checkbox"
          ${d.done === "YES" ? "checked" : ""}
          onchange="doneIKR(${i},this.checked)">
      </td>
    </tr>`;
  });
}

// ================= DETAIL POPUP =================
function detailIKR(i) {

  let d = dataIKR[i];
  if (!d) return alert("Data tidak ditemukan");

  popupDetailIKR = d.detail || [];

  let thead = document.querySelector("#tblPopup thead");
  let tbody = document.querySelector("#tblPopup tbody");

  if (!thead || !tbody) return;

  thead.innerHTML = `
    <tr>
      <th>WO Number</th>
      <th>Status</th>
      <th>Amount</th>
    </tr>`;

  tbody.innerHTML = "";

  popupDetailIKR.forEach(x => {
    tbody.innerHTML += `
      <tr>
        <td>${x.wo}</td>
        <td>${x.status}</td>
        <td>${rupiah(x.amount)}</td>
      </tr>`;
  });

  let popup = document.getElementById("popup");
  if (popup) popup.style.display = "block";
}

// ================= DELETE =================
function hapusIKR() {

  let chk = document.querySelectorAll(".chkIKR");

  dataIKR = dataIKR.filter((x, i) => !chk[i]?.checked);

  renderIKR();
}

// ================= DOWNLOAD =================
function downloadIKR() {

  let out = dataIKR.map(x => ({
    Region: x.region,
    Tahun: x.tahun,
    Bulan: x.bulan,
    WOType: x.wotype,
    JumlahWO: x.jumlah,
    Approved: x.approved,
    Amount: x.amount,
    FSAmount: x.fs
  }));

  let ws = XLSX.utils.json_to_sheet(out);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "IKR");
  XLSX.writeFile(wb, "DATA_IKR.xlsx");
}

// ================= EDIT =================
function editIKR(i, field, val) {
  if (!dataIKR[i]) return;
  dataIKR[i][field] = val;
}

function doneIKR(i, val) {
  if (!dataIKR[i]) return;
  dataIKR[i].done = val ? "YES" : "NO";
}

// ================= UTIL =================
function angka(v) {
  return parseInt(String(v || 0).replace(/[^0-9]/g, "")) || 0;
}

function rupiah(v) {
  return "Rp " + Number(v || 0).toLocaleString("id-ID");
}

function closePopup() {
  let p = document.getElementById("popup");
  if (p) p.style.display = "none";
}

// ================= GLOBAL FIX (ANTI GITHUB ERROR) =================
window.importIKR = importIKR;
window.renderIKR = renderIKR;
window.detailIKR = detailIKR;
window.hapusIKR = hapusIKR;
window.downloadIKR = downloadIKR;
window.editIKR = editIKR;
window.doneIKR = doneIKR;
window.closePopup = closePopup;
