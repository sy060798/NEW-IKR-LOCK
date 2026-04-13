// js/ikrlock.js

let dataIKR = [];
let popupDetailIKR = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

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

// ================= IMPORT DATA IKR =================
function importIKR(e) {

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

      let region = r.City || r.city || r.Region || "";
      let woEnd = r["Wo End"] || "";
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

    alert("Upload data berhasil");
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function renderIKR() {

  let tb = document.querySelector("#tblIKR tbody");
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
        <span class="click" onclick="detailIKR(${i})">
          ${d.jumlah}
        </span>
      </td>
      <td>${d.approved}</td>
      <td>${rupiah(d.amount)}</td>
      <td>${rupiah(d.fs)}</td>
      <td contenteditable oninput="editIKR(${i},'remark',this.innerText)">${d.remark}</td>
      <td contenteditable oninput="editIKR(${i},'invoice',this.innerText)">${d.invoice}</td>
      <td contenteditable oninput="editIKR(${i},'note',this.innerText)">${d.note}</td>
      <td>
        <input type="checkbox"
        ${d.done==="YES"?"checked":""}
        onchange="doneIKR(${i},this.checked)">
      </td>
    </tr>`;
  });
}

// ================= DETAIL =================
function detailIKR(i) {

  let d = dataIKR[i];
  if (!d) return;

  popupDetailIKR = d.detail;

  let thead = document.querySelector("#tblPopup thead");
  let tbody = document.querySelector("#tblPopup tbody");

  thead.innerHTML = `
  <tr>
    <th>WO Number</th>
    <th>Status</th>
    <th>Amount</th>
  </tr>`;

  tbody.innerHTML = "";

  d.detail.forEach(x => {
    tbody.innerHTML += `
    <tr>
      <td>${x.wo}</td>
      <td>${x.status}</td>
      <td>${rupiah(x.amount)}</td>
    </tr>`;
  });

  document.getElementById("popupTitle").innerText = "DETAIL WO";
  document.getElementById("popup").style.display = "block";
}

// ================= DELETE =================
function hapusIKR() {

  let chk = document.querySelectorAll(".chkIKR");

  dataIKR = dataIKR.filter((x, i) => !chk[i].checked);

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
  dataIKR[i][field] = val;
}

function doneIKR(i, val) {
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
  document.getElementById("popup").style.display = "none";
}
