// ================= POPUP DETAIL WO =================
function showStatusWO(jenis, tahun) {

  let list = [];

  dataIKR.forEach(d => {

    if (
      String(d.wotype || "").trim().toUpperCase() === String(jenis).trim().toUpperCase() &&
      String(d.tahun || "").trim() === String(tahun).trim()
    ) {

      if (Array.isArray(d.approvedList)) {
        d.approvedList.forEach(x => {
          if (x && (x.pra || x.invoice || x.wo || x.name)) {
            list.push({
              pra: x.pra || "",
              invoice: x.invoice || "",
              name: x.name || x.invoiceName || "",
              total: Number(x.total || x.amount || 0)
            });
          }
        });
      }

    }

  });

  // ================= UNIQUE =================
  let seen = new Set();
  let unique = [];

  list.forEach(x => {

    let key =
      String(x.pra).trim().toUpperCase() +
      "|" +
      String(x.invoice).trim().toUpperCase();

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(x);
    }

  });

  // ================= RENDER =================
  let head = document.querySelector("#tblDetail thead");
  let tb = document.querySelector("#tblDetail tbody");

  head.innerHTML = `
    <tr>
      <th>Pra Invoice Number</th>
      <th>Invoice Number</th>
      <th>Invoice Name</th>
      <th>Invoice Total</th>
    </tr>
  `;

  if (unique.length === 0) {
    tb.innerHTML = `<tr><td colspan="4">Tidak ada data</td></tr>`;
  } else {

    let html = "";

    unique.forEach(x => {
      html += `
        <tr>
          <td>${x.pra}</td>
          <td>${x.invoice}</td>
          <td>${x.name}</td>
          <td>${x.total}</td>
        </tr>
      `;
    });

    tb.innerHTML = html;
  }

  // ================= SHOW POPUP =================
  document.getElementById("popupWO").classList.add("active");
}


// ================= CLOSE POPUP =================
function closePopupWO() {
  document.getElementById("popupWO").classList.remove("active");
}



// ================= STATUS TABLE =================
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

    let jenis = (d.wotype || "").toString().trim();
    let tahun = (d.tahun || "").toString().trim();

    if (!jenis || !tahun) return;

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
          <span onclick="showStatusWO(${JSON.stringify(r.jenis)},${JSON.stringify(r.tahun)})"
                style="color:#00ff90;cursor:pointer;text-decoration:underline;font-weight:bold">
            ${r.approved}
          </span>
        </td>

        <td>${typeof window.format === "function" ? window.format(r.invoice) : r.invoice}</td>

        <td>
          <button onclick="hapusStatus(${JSON.stringify(r.jenis)},${JSON.stringify(r.tahun)})"
                  style="background:#e74c3c;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer">
            Hapus
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}



// ================= DELETE STATUS =================
function hapusStatus(jenis, tahun) {

  let ok = confirm(`Hapus data:\n${jenis} - ${tahun} ?`);
  if (!ok) return;

  dataIKR = dataIKR.filter(d =>
    !(
      String(d.wotype || "").trim().toUpperCase() === String(jenis).trim().toUpperCase() &&
      String(d.tahun || "").trim() === String(tahun).trim()
    )
  );

  generateStatus();
}



// ================= GLOBAL EXPORT =================
window.generateStatus = generateStatus;
window.showStatusWO = showStatusWO;
window.hapusStatus = hapusStatus;
window.closePopupWO = closePopupWO;
