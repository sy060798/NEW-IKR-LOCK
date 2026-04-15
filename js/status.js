// ================= STATUS MENU =================

function generateStatus() {

  let tbody = document.querySelector("#tblStatus tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!Array.isArray(dataIKR) || dataIKR.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">Tidak ada data</td></tr>`;
    return;
  }

  let map = {};

  dataIKR.forEach(d => {

    let jenis = (d.wotype || "-").toString().trim();
    let tahun = (d.tahun || "-").toString().trim();

    // ================= FIX KEY CONSISTENT =================
    let key = jenis.toUpperCase() + "_" + tahun;

    if (!map[key]) {
      map[key] = {
        jenis,
        tahun,
        approved: 0,
        invoice: 0,
        woList: []
      };
    }

    let woApproved = Number(d.approved) || 0;
    let fsAmount = Number(d.fs) || 0;

    map[key].approved += woApproved;
    map[key].invoice += fsAmount;

    // ================= WO LIST =================
    if (Array.isArray(d.approvedList)) {
      d.approvedList.forEach(x => {
        if (x && x.wo) {
          map[key].woList.push({
            wo: x.wo,
            invoice: x.invoice || "",
            pra: x.pra || "",
            status: x.status || "APPROVED"
          });
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
          <span
            onclick="showStatusWO(${JSON.stringify(r.jenis)},${JSON.stringify(r.tahun)})"
            style="color:#00ff90;cursor:pointer;text-decoration:underline;font-weight:bold">
            ${r.approved}
          </span>
        </td>

        <td>${window.format ? format(r.invoice) : r.invoice}</td>

        <td>
          <button
            style="background:#e74c3c;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer"
            onclick="hapusStatus(${JSON.stringify(r.jenis)},${JSON.stringify(r.tahun)})">
            Hapus
          </button>
        </td>
      </tr>
    `;

  });

  tbody.innerHTML = html;
}


// ================= POPUP DETAIL WO APPROVED =================

function showStatusWO(jenis, tahun) {

  let list = [];

  dataIKR.forEach(d => {

    if (
      String(d.wotype).trim().toUpperCase() === String(jenis).trim().toUpperCase() &&
      String(d.tahun).trim() === String(tahun).trim()
    ) {

      if (Array.isArray(d.approvedList)) {
        d.approvedList.forEach(x => {
          if (x && x.wo) {
            list.push({
              pra: x.pra || "",
              invoice: x.invoice || "",
              status: x.status || "",
              wo: x.wo
            });
          }
        });
      }

    }

  });

  // ================= REMOVE DUPLICATE WO =================
  let unique = [];
  let seen = new Set();

  list.forEach(x => {
    let woKey = String(x.wo).trim().toUpperCase();
    if (!seen.has(woKey)) {
      seen.add(woKey);
      unique.push(x);
    }
  });

  let head = document.querySelector("#tblDetail thead");
  let tb = document.querySelector("#tblDetail tbody");

  head.innerHTML = `
    <tr>
      <th>Pra Invoice</th>
      <th>Invoice Number</th>
      <th>Status</th>
      <th>Wonumber</th>
    </tr>
  `;

  if (unique.length === 0) {
    tb.innerHTML = `<tr><td colspan="4">Tidak ada WO Approved</td></tr>`;
  } else {

    let html = "";

    unique.forEach(x => {
      html += `
        <tr>
          <td>${x.pra}</td>
          <td>${x.invoice}</td>
          <td>${x.status}</td>
          <td>${x.wo}</td>
        </tr>
      `;
    });

    tb.innerHTML = html;
  }

  document.getElementById("popupWO").style.display = "block";
}


// ================= HAPUS STATUS =================

function hapusStatus(jenis, tahun) {

  let ok = confirm(`Hapus semua data:\n${jenis} - ${tahun} ?`);
  if (!ok) return;

  dataIKR = dataIKR.filter(d =>
    !(
      String(d.wotype).trim().toUpperCase() === String(jenis).trim().toUpperCase() &&
      String(d.tahun).trim() === String(tahun).trim()
    )
  );

  render();
  generateStatus();
  generatePivot();
}


// ================= DOWNLOAD STATUS =================

function downloadStatus() {

  let map = {};

  dataIKR.forEach(d => {

    let jenis = (d.wotype || "-").toString().trim();
    let tahun = (d.tahun || "-").toString().trim();

    // ================= FIX KEY CONSISTENT =================
    let key = jenis.toUpperCase() + "_" + tahun;

    if (!map[key]) {
      map[key] = {
        Jenis: jenis,
        Tahun: tahun,
        "Total WO Approved": 0,
        "Total Invoice": 0
      };
    }

    map[key]["Total WO Approved"] += Number(d.approved) || 0;
    map[key]["Total Invoice"] += Number(d.fs) || 0;

  });

  let rows = Object.values(map);

  let ws = XLSX.utils.json_to_sheet(rows);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "STATUS");

  XLSX.writeFile(wb, "STATUS_IKCR.xlsx");
}


// ================= AUTO GLOBAL =================

window.generateStatus = generateStatus;
window.downloadStatus = downloadStatus;
window.hapusStatus = hapusStatus;
window.showStatusWO = showStatusWO;
