<style>
.status-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:10px;
}

.status-header h2{
  color:#1565c0;
  font-size:20px;
}

.status-header button{
  background:#1565c0;
  color:#fff;
  border:none;
  padding:8px 14px;
  border-radius:8px;
  cursor:pointer;
  font-weight:600;
}

.status-header button:hover{
  background:#0d57ab;
}

.wrap{
  background:#fff;
  border:1px solid #dce6f2;
  border-radius:10px;
  overflow:auto;
}

#tblStatus{
  width:100%;
  border-collapse:collapse;
}

#tblStatus th, #tblStatus td{
  padding:10px;
  border-bottom:1px solid #e6eef7;
  text-align:center;
  font-size:13px;
}

#tblStatus th{
  background:#eaf3ff;
  color:#1565c0;
}

#tblStatus tfoot td{
  background:#f1f7ff;
  font-weight:bold;
}
</style>

<div id="tab-status" class="tab">

  <div class="status-header">
    <h2>STATUS REPORT</h2>
    <button onclick="generateStatus()">REFRESH STATUS</button>
  </div>

  <div class="wrap">
    <table id="tblStatus">
      <thead>
        <tr>
          <th>No</th>
          <th>WO Type</th>
          <th>Tahun</th>
          <th>Total Approved</th>
          <th>Total Invoice</th>
          <th>Total FS Amount</th>
        </tr>
      </thead>

      <tbody></tbody>

      <tfoot>
        <tr>
          <td colspan="3"><b>GRAND TOTAL</b></td>
          <td id="gtApproved">0</td>
          <td id="gtInvoice">0</td>
          <td id="gtFS">0</td>
        </tr>
      </tfoot>
    </table>
  </div>

</div>

<script>
function formatNumber(n){
  return Number(n || 0).toLocaleString("id-ID");
}

function getDataIKR(){
  return Array.isArray(window.dataIKR) ? window.dataIKR : [];
}

function generateStatus(){

  let dataIKR = getDataIKR();
  let tbody = document.querySelector("#tblStatus tbody");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!dataIKR.length){
    tbody.innerHTML = `<tr><td colspan="6">Tidak ada data</td></tr>`;
    return;
  }

  const allowedWO = [
    "ALL ACTIVATION",
    "BROADBAND",
    "TROUBLESHOOTING BROADBAND"
  ];

  let map = {};

  let grandApproved = 0;
  let grandInvoice = 0;
  let grandFS = 0;

  dataIKR.forEach(d => {

    let wotype = String(d.wotype || "").toUpperCase();
    let tahun = String(d.tahun || "");

    if (!allowedWO.includes(wotype)) return;
    if (!tahun) return;

    let key = wotype + "_" + tahun;

    if (!map[key]) {
      map[key] = {
        jenis: wotype,
        tahun: tahun,
        approved: 0,
        invoiceCount: 0,
        fsTotal: 0,
        invSet: new Set()
      };
    }

    let approved = Number(d.approved) || 0;
    let fs = Number(d.fsAmount || d.fs_amount) || 0;

    map[key].approved += approved;
    map[key].fsTotal += fs;

    grandApproved += approved;
    grandFS += fs;

    let invKey = (d.invoice || d.noInvoice || "") + "|" + wotype;

    if (!map[key].invSet.has(invKey)){
      map[key].invSet.add(invKey);
      map[key].invoiceCount++;
      grandInvoice++;
    }

  });

  let no = 1;

  tbody.innerHTML = Object.values(map).map(r => `
    <tr>
      <td>${no++}</td>
      <td>${r.jenis}</td>
      <td>${r.tahun}</td>
      <td>${r.approved}</td>
      <td>${r.invoiceCount}</td>
      <td>${formatNumber(r.fsTotal)}</td>
    </tr>
  `).join("");

  document.getElementById("gtApproved").innerText = grandApproved;
  document.getElementById("gtInvoice").innerText = grandInvoice;
  document.getElementById("gtFS").innerText = formatNumber(grandFS);
}

window.generateStatus = generateStatus;

// auto load
window.addEventListener("load", () => {
  setTimeout(generateStatus, 300);
});
</script>
