<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Status WO</title>

<style>
body {
  font-family: Arial;
  padding: 20px;
}

/* TABLE */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

th {
  background: #2c3e50;
  color: #fff;
}

/* BUTTON */
button {
  padding: 5px 10px;
  border: none;
  background: #e74c3c;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
}

/* POPUP */
.popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: none;
  background: rgba(0,0,0,0.5);
}

.popup.active {
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-content {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
}
</style>
</head>

<body>

<h2>Status WO</h2>

<table id="tblStatus">
  <thead>
    <tr>
      <th>No</th>
      <th>WO Type</th>
      <th>Tahun</th>
      <th>Total WO</th>
      <th>Jumlah Invoice</th>
      <th>Total Invoice</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <tr><td colspan="7">Tidak ada data</td></tr>
  </tbody>
</table>

<!-- POPUP -->
<div id="popupWO" class="popup">
  <div class="popup-content">
    <h3>Detail Invoice</h3>

    <table id="tblDetail">
      <thead></thead>
      <tbody></tbody>
    </table>

    <br>
    <button onclick="closePopupWO()">Tutup</button>
  </div>
</div>

<script>

// ================= FORMAT ANGKA =================
function formatNumber(n){
  return Number(n || 0).toLocaleString("id-ID");
}

// ================= SAMPLE DATA =================
let dataIKR = [
  {
    wotype: "Activation Broadband",
    tahun: "2026",
    approved: 1,
    approvedList: [
      {
        pra: "PRA001",
        invoice: "INV001",
        name: "Customer A",
        total: 280000
      }
    ]
  }
];


// ================= POPUP =================
function showStatusWO(jenis, tahun) {

  let list = [];

  dataIKR.forEach(d => {

    if (
      String(d.wotype).toUpperCase() === String(jenis).toUpperCase() &&
      String(d.tahun) === String(tahun)
    ) {

      if (Array.isArray(d.approvedList)) {
        d.approvedList.forEach(x => {
          list.push({
            pra: x.pra || "",
            invoice: x.invoice || "",
            name: x.name || "",
            total: Number(x.total || 0)
          });
        });
      }

    }

  });

  // UNIQUE
  let seen = new Set();
  let unique = [];

  list.forEach(x => {
    let key = x.pra + "|" + x.invoice;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(x);
    }
  });

  let head = document.querySelector("#tblDetail thead");
  let tb = document.querySelector("#tblDetail tbody");

  head.innerHTML = `
    <tr>
      <th>Pra Invoice</th>
      <th>Invoice</th>
      <th>Nama</th>
      <th>Total</th>
    </tr>
  `;

  if(unique.length === 0){
    tb.innerHTML = `<tr><td colspan="4">Tidak ada data</td></tr>`;
  } else {
    let html = "";
    unique.forEach(x => {
      html += `
        <tr>
          <td>${x.pra}</td>
          <td>${x.invoice}</td>
          <td>${x.name}</td>
          <td>${formatNumber(x.total)}</td>
        </tr>
      `;
    });
    tb.innerHTML = html;
  }

  document.getElementById("popupWO").classList.add("active");
}

function closePopupWO() {
  document.getElementById("popupWO").classList.remove("active");
}


// ================= GENERATE STATUS =================
function generateStatus() {

  let tbody = document.querySelector("#tblStatus tbody");
  tbody.innerHTML = "";

  if(!dataIKR.length){
    tbody.innerHTML = `<tr><td colspan="7">Tidak ada data</td></tr>`;
    return;
  }

  let map = {};

  dataIKR.forEach(d => {

    let key = d.wotype.toUpperCase() + "_" + d.tahun;

    if (!map[key]) {
      map[key] = {
        jenis: d.wotype,
        tahun: d.tahun,
        approved: 0,
        invoiceCount: 0,
        invoiceTotal: 0,
        invSet: new Set()
      };
    }

    map[key].approved += Number(d.approved) || 0;

    if (Array.isArray(d.approvedList)) {

      d.approvedList.forEach(x => {

        let invKey = (x.invoice || "") + "|" + (x.pra || "");

        if (!map[key].invSet.has(invKey)) {
          map[key].invSet.add(invKey);

          map[key].invoiceCount += 1;
          map[key].invoiceTotal += Number(x.total || 0);
        }

      });

    }

  });

  let html = "";
  let no = 1;

  Object.values(map).forEach(r => {

    html += `
      <tr>
        <td>${no++}</td>
        <td>${r.jenis}</td>
        <td>${r.tahun}</td>

        <td>
          <span onclick="showStatusWO('${r.jenis}','${r.tahun}')"
                style="color:green;cursor:pointer;font-weight:bold">
            ${r.approved}
          </span>
        </td>

        <td>${r.invoiceCount}</td>
        <td>${formatNumber(r.invoiceTotal)}</td>

        <td>
          <button onclick="hapusStatus('${r.jenis}','${r.tahun}')">Hapus</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}


// ================= DELETE =================
function hapusStatus(jenis, tahun) {

  if (!confirm(`Hapus ${jenis} - ${tahun}?`)) return;

  dataIKR = dataIKR.filter(d =>
    !(d.wotype === jenis && d.tahun === tahun)
  );

  generateStatus();
}


// ================= INIT =================
generateStatus();


// ================= GLOBAL EXPORT (WAJIB) =================
window.generateStatus = generateStatus;
window.showStatusWO = showStatusWO;
window.closePopupWO = closePopupWO;
window.hapusStatus = hapusStatus;

</script>

</body>
</html>
