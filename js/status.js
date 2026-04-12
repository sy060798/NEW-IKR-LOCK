// ================= STATUS MENU =================

function generateStatus(){

  let tbody = document.querySelector("#tblStatus tbody");
  if(!tbody) return;

  tbody.innerHTML = "";

  if(!Array.isArray(dataIKR) || dataIKR.length === 0){
    tbody.innerHTML = `
      <tr>
        <td colspan="6">Tidak ada data</td>
      </tr>
    `;
    return;
  }

  let map = {};

  dataIKR.forEach(d=>{

    let jenis = d.wotype || "-";
    let tahun = d.tahun || "-";

    let key = jenis + "_" + tahun;

    if(!map[key]){
      map[key] = {
        jenis: jenis,
        tahun: tahun,
        approved: 0,
        invoice: 0
      };
    }

    let woApproved = Number(d.approved) || 0;
    let fsAmount = Number(d.fs) || 0;

    map[key].approved += woApproved;
    map[key].invoice += fsAmount;

  });

  let no = 1;

  Object.values(map).forEach(r=>{

    tbody.innerHTML += `
      <tr>
        <td>${no++}</td>
        <td>${r.jenis}</td>
        <td>${r.tahun}</td>
        <td>${r.approved}</td>
        <td>${format(r.invoice)}</td>
        <td>
          <button 
            style="background:#e74c3c;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer"
            onclick="hapusStatus('${r.jenis}','${r.tahun}')">
            Hapus
          </button>
        </td>
      </tr>
    `;

  });

}

// ================= HAPUS STATUS =================
function hapusStatus(jenis,tahun){

  let ok = confirm(
    "Hapus semua data:\n" + jenis + " - " + tahun + " ?"
  );

  if(!ok) return;

  dataIKR = dataIKR.filter(d => {

    return !(
      String(d.wotype) === String(jenis) &&
      String(d.tahun) === String(tahun)
    );

  });

  render();
  generateStatus();
  generatePivot();

}

// ================= DOWNLOAD STATUS =================
function downloadStatus(){

  let rows = [];

  let map = {};

  dataIKR.forEach(d=>{

    let jenis = d.wotype || "-";
    let tahun = d.tahun || "-";

    let key = jenis + "_" + tahun;

    if(!map[key]){
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

  rows = Object.values(map);

  let ws = XLSX.utils.json_to_sheet(rows);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "STATUS");

  XLSX.writeFile(wb, "STATUS_IKCR.xlsx");

}

// ================= AUTO GLOBAL =================
window.generateStatus = generateStatus;
window.downloadStatus = downloadStatus;
window.hapusStatus = hapusStatus;
