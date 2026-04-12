// ======================================================
// STATUS.JS
// KHUSUS MENU STATUS (pisah dari ikrlock.js)
// Ambil data dari global dataIKR
// ======================================================

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  buatMenuStatus();
});

// ================= BUAT MENU =================
function buatMenuStatus() {

  // tombol menu
  let menu = document.querySelector(".menu");

  if (menu && !document.getElementById("btnStatus")) {
    let btn = document.createElement("button");
    btn.id = "btnStatus";
    btn.innerText = "Status";
    btn.onclick = function () {
      showTab("status", this);
      generateStatus();
    };
    menu.appendChild(btn);
  }

  // tab status
  if (!document.getElementById("status")) {

    let div = document.createElement("div");
    div.id = "status";
    div.className = "tab";

    div.innerHTML = `
      <div style="padding:15px">

        <h2 style="margin-bottom:10px;color:#fff">
          STATUS INVOICE
        </h2>

        <button onclick="downloadStatus()"
        style="
          background:#00c853;
          border:none;
          padding:8px 15px;
          color:#fff;
          border-radius:6px;
          margin-bottom:10px;
          cursor:pointer;
        ">
          Download Excel
        </button>

        <table id="tblStatus"
        style="
          width:100%;
          border-collapse:collapse;
          background:#111;
          color:#fff;
        ">
          <thead>
            <tr style="background:#8e24aa">
              <th>No</th>
              <th>Jenis</th>
              <th>Tahun</th>
              <th>Total WO Approved</th>
              <th>Total Invoice</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>

      </div>
    `;

    document.body.appendChild(div);
  }
}

// ================= GENERATE STATUS =================
function generateStatus() {

  if (typeof dataIKR === "undefined") return;

  let tbody = document.querySelector("#tblStatus tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  let map = {};

  dataIKR.forEach(d => {

    let jenis = d.wotype || "-";
    let tahun = d.tahun || "-";

    let key = jenis + "_" + tahun;

    if (!map[key]) {
      map[key] = {
        jenis: jenis,
        tahun: tahun,
        approved: 0,
        invoice: 0
      };
    }

    map[key].approved += Number(d.approved) || 0;
    map[key].invoice += Number(d.fs) || 0;

  });

  let arr = Object.values(map);

  if (arr.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">Tidak ada data</td>
      </tr>
    `;
    return;
  }

  let totalApproved = 0;
  let totalInvoice = 0;

  arr.forEach((d, i) => {

    totalApproved += d.approved;
    totalInvoice += d.invoice;

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${d.jenis}</td>
        <td>${d.tahun}</td>
        <td>${d.approved}</td>
        <td>${formatRupiahStatus(d.invoice)}</td>
      </tr>
    `;
  });

  tbody.innerHTML += `
    <tr style="background:#222;font-weight:bold">
      <td colspan="3">TOTAL</td>
      <td>${totalApproved}</td>
      <td>${formatRupiahStatus(totalInvoice)}</td>
    </tr>
  `;
}

// ================= FORMAT =================
function formatRupiahStatus(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

// ================= DOWNLOAD =================
function downloadStatus() {

  let rows = [];

  document.querySelectorAll("#tblStatus tbody tr").forEach(tr => {

    let td = tr.querySelectorAll("td");

    if (td.length >= 5) {
      rows.push({
        No: td[0].innerText,
        Jenis: td[1].innerText,
        Tahun: td[2].innerText,
        Total_WO_Approved: td[3].innerText,
        Total_Invoice: td[4].innerText
      });
    }

  });

  let ws = XLSX.utils.json_to_sheet(rows);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "STATUS");
  XLSX.writeFile(wb, "STATUS_INVOICE.xlsx");
}
