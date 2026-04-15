// ================= POPUP DETAIL =================
function showStatusWO(jenis, tahun) {

  let list = [];

  dataIKR.forEach(d => {

    if (
      String(d.wotype || "").trim().toUpperCase() === String(jenis).trim().toUpperCase() &&
      String(d.tahun || "").trim() === String(tahun).trim()
    ) {

      if (Array.isArray(d.approvedList)) {
        d.approvedList.forEach(x => {
          if (x && (x.pra || x.invoice)) {
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

  document.getElementById("popupWO").classList.add("active");
}

function closePopupWO() {
  document.getElementById("popupWO").classList.remove("active");
}


// ================= GENERATE STATUS =================
function generateStatus() {

  let tbody = document.querySelector("#tblStatus tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!Array.isArray(dataIKR) || dataIKR.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">Tidak ada data</td></tr>`;
    return;
  }

  let map = {};

  dataIKR.forEach(d => {

    let jenis = (d.wotype || "").trim();
    let tahun = (d.tahun || "").trim();

    if (!jenis || !tahun) return;

    let key = jenis.toUpperCase() + "_" + tahun;

    if (!map[key]) {
      map[key] = {
        jenis,
        tahun,
        approved: 0,
        invoiceCount: 0,
        invoiceTotal: 0,
        invSet: new Set()
      };
    }

    map[key].approved += Number(d.approved) || 0;

    if (Array.isArray(d.approvedList)) {

      d.approvedList.forEach(x => {

        if (!x) return;

        let invKey = (x.invoice || "") + "|" + (x.pra || "");

        if (!map[key].invSet.has(invKey)) {
          map[key].invSet.add(invKey);

          map[key].invoiceCount += 1;
          map[key].invoiceTotal += Number(x.total || x.amount || 0);
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
                style="color:green;cursor:pointer;font-weight:bold">
            ${r.approved}
          </span>
        </td>

        <td>${r.invoiceCount}</td>
        <td>${r.invoiceTotal}</td>

        <td>
          <button onclick="hapusStatus(${JSON.stringify(r.jenis)},${JSON.stringify(r.tahun)})">
            Hapus
          </button>
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
    !(
      String(d.wotype || "").toUpperCase() === String(jenis).toUpperCase() &&
      String(d.tahun || "") === String(tahun)
    )
  );

  generateStatus();
}


// ================= GLOBAL =================
window.generateStatus = generateStatus;
window.showStatusWO = showStatusWO;
window.closePopupWO = closePopupWO;
window.hapusStatus = hapusStatus;
