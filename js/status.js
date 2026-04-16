// status.js

function formatNumber(n){
  return Number(n || 0).toLocaleString("id-ID");
}

// ================= CEK DATA GLOBAL =================
function getDataIKR(){
  return window.dataIKR || [];
}

// ================= POPUP =================
function showStatusWO(jenis, tahun) {

  let dataIKR = getDataIKR(); // 🔥 ambil dari ikrlock.js

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

  tb.innerHTML = unique.length === 0
    ? `<tr><td colspan="4">Tidak ada data</td></tr>`
    : unique.map(x => `
        <tr>
          <td>${x.pra}</td>
          <td>${x.invoice}</td>
          <td>${x.name}</td>
          <td>${formatNumber(x.total)}</td>
        </tr>
      `).join("");

  document.getElementById("popupWO").classList.add("active");
}

function closePopupWO() {
  document.getElementById("popupWO").classList.remove("active");
}

// ================= GENERATE =================
function generateStatus() {

  let dataIKR = getDataIKR(); // 🔥 penting

  let tbody = document.querySelector("#tblStatus tbody");
  tbody.innerHTML = "";

  if (!dataIKR.length) {
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
          map[key].invoiceCount++;
          map[key].invoiceTotal += Number(x.total || 0);
        }

      });
    }

  });

  let no = 1;

  tbody.innerHTML = Object.values(map).map(r => `
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
  `).join("");
}

// ================= DELETE =================
function hapusStatus(jenis, tahun) {

  let dataIKR = getDataIKR();

  if (!confirm(`Hapus ${jenis} - ${tahun}?`)) return;

  window.dataIKR = dataIKR.filter(d =>
    !(d.wotype === jenis && d.tahun === tahun)
  );

  generateStatus();
}

// ================= INIT =================
window.addEventListener("load", () => {
  generateStatus();
});

// ================= EXPORT =================
window.generateStatus = generateStatus;
window.showStatusWO = showStatusWO;
window.closePopupWO = closePopupWO;
window.hapusStatus = hapusStatus;
