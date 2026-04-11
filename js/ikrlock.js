// ================= GLOBAL =================
let dataList = [];
let currentEditId = null;

const SERVER_URL = "https://tracking-server";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", function(){

  document.getElementById("upload").addEventListener("change", importExcel);

  document.getElementById("checkAll").addEventListener("change", function(e){
    document.querySelectorAll("#tableData tbody input[type=checkbox]")
    .forEach(c => c.checked = e.target.checked);
  });

});

// ================= IMPORT =================
function importExcel(e){
  let file = e.target.files[0];
  if(!file){ alert("File tidak ada"); return; }

  let reader = new FileReader();

  reader.onload = function(evt){
    let wb = XLSX.read(evt.target.result,{type:'binary'});

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

      json.forEach(r=>{

        let data = {
          id: r.ID || Date.now()+Math.random(),

          region: r.REGION || "",
          tahun: r.TAHUN || "",
          wotype: r["WO TYPE"] || "",
          bulan: r.BULAN || "",

          jumlah_wo: parseInt(r["JUMLAH WO"]) || 0,
          wo_approved: parseInt(r["WO APPROVED"]) || 0,

          amount: parseInt(r.AMOUNT) || 0,
          fs_amount: parseInt(r["FS AMOUNT"]) || 0,
          selisih: 0,

          remark: r.REMARK || "NOT PAID",
          noinvoice: r["NO INVOICE"] || "",
          note: "",
          done_summary: "",

          server: "-"
        };

        hitungSelisih(data);
        dataList.push(data);

      });
    });

    renderTable();
  };

  reader.readAsBinaryString(file);
}

// ================= HITUNG =================
function hitungSelisih(d){
  d.selisih = (Number(d.amount)||0) - (Number(d.fs_amount)||0);
}

// ================= RENDER =================
function renderTable(){
  let tbody = document.querySelector("#tableData tbody");
  tbody.innerHTML = "";

  dataList.forEach((d,i)=>{

    let tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i+1}</td>
      <td><input type="checkbox" data-id="${d.id}"></td>

      <td>${d.region}</td>
      <td>${d.tahun}</td>
      <td>${d.wotype}</td>
      <td>${d.bulan}</td>

      <td>${d.jumlah_wo}</td>
      <td>${d.wo_approved}</td>

      <td>${d.amount}</td>
      <td>${d.fs_amount}</td>
      <td>${d.selisih}</td>

      <td>${d.remark}</td>

      <td>
        <input value="${d.noinvoice || ""}" 
        oninput="updateField('${d.id}','noinvoice',this.value)">
      </td>

      <td>
        <input value="${d.note || ""}" 
        oninput="updateField('${d.id}','note',this.value)">
      </td>

      <td>
        <select onchange="updateField('${d.id}','done_summary',this.value)">
          <option value="">-</option>
          <option value="DONE" ${d.done_summary==="DONE"?"selected":""}>DONE</option>
          <option value="PENDING" ${d.done_summary==="PENDING"?"selected":""}>PENDING</option>
        </select>
      </td>

      <td><button onclick="editData('${d.id}')">✏</button></td>
    `;

    tbody.appendChild(tr);
  });
}

// ================= UPDATE =================
function updateField(id, field, value){
  let d = dataList.find(x=>String(x.id)===String(id));
  if(d){
    d[field] = value;
    hitungSelisih(d);
    renderTable();
  }
}

// ================= HAPUS =================
function hapusTerpilih(){
  let ids=[...document.querySelectorAll("#tableData tbody input:checked")]
    .map(c=>String(c.dataset.id));

  dataList = dataList.filter(d=>!ids.includes(String(d.id)));
  renderTable();
}

// ================= EXPORT =================
function exportExcel(){
  if(dataList.length===0){
    alert("Data kosong");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(dataList);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DATA");

  XLSX.writeFile(wb, "IKCR_LOCK.xlsx");
}

// ================= UPLOAD =================
function triggerUpload(){
  document.getElementById('upload').click();
}
