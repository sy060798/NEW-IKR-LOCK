// ================= GLOBAL =================
let dataList = [];
let dataIKR = [];

// ================= TAB =================
function showTab(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", function(){

  let up = document.getElementById("upload");
  if(up){
    up.addEventListener("change", importExcel);
  }

  let upIKR = document.getElementById("uploadIKR");
  if(upIKR){
    upIKR.addEventListener("change", importIKR);
  }

});

// ================= MY REP =================
function importExcel(e){
  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){
    let wb = XLSX.read(evt.target.result,{type:'binary'});

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

      json.forEach(r=>{
        dataList.push({
          wo: r.WO || "",
          area: r.AREA || "",
          bulan: r.BULAN || "",
          stb: parseInt(r.STB)||0
        });
      });
    });

    renderTable();
  };

  reader.readAsBinaryString(file);
}

function renderTable(){
  let tbody = document.querySelector("#tableData tbody");
  tbody.innerHTML = "";

  dataList.forEach((d,i)=>{
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${d.wo}</td>
        <td>${d.area}</td>
        <td>${d.bulan}</td>
        <td>${d.stb}</td>
      </tr>
    `;
  });
}

function triggerUpload(){
  document.getElementById("upload").click();
}

// ================= PIVOT =================
function buatPivot(){
  let map = {};

  dataList.forEach(d=>{
    let key = d.area;

    if(!map[key]) map[key]=0;
    map[key]+=d.stb;
  });

  let thead = document.querySelector("#pivotTable thead");
  let tbody = document.querySelector("#pivotTable tbody");

  thead.innerHTML = "<tr><th>Area</th><th>Total STB</th></tr>";
  tbody.innerHTML = "";

  Object.keys(map).forEach(k=>{
    tbody.innerHTML += `<tr><td>${k}</td><td>${map[k]}</td></tr>`;
  });
}

// ================= IKCR =================
function importIKR(e){
  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){
    let wb = XLSX.read(evt.target.result,{type:'binary'});

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

      json.forEach(r=>{
        let d = {
          region: r.REGION || "",
          tahun: r.TAHUN || "",
          wotype: r["WO TYPE"] || "",
          bulan: r.BULAN || "",
          jumlah: parseInt(r["JUMLAH WO"])||0,
          approved: parseInt(r["WO APPROVED"])||0,
          amount: parseInt(r.AMOUNT)||0,
          fs: parseInt(r["FS AMOUNT"])||0
        };

        d.selisih = d.amount - d.fs;
        dataIKR.push(d);
      });
    });

    renderIKR();
  };

  reader.readAsBinaryString(file);
}

function renderIKR(){
  let tbody = document.querySelector("#tableIKR tbody");
  tbody.innerHTML = "";

  dataIKR.forEach((d,i)=>{
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${d.region}</td>
        <td>${d.tahun}</td>
        <td>${d.wotype}</td>
        <td>${d.bulan}</td>
        <td>${d.jumlah}</td>
        <td>${d.approved}</td>
        <td>${d.amount}</td>
        <td>${d.fs}</td>
        <td style="color:${d.selisih<0?'red':'lime'}">
          ${d.selisih}
        </td>
      </tr>
    `;
  });
}

function exportIKR(){
  if(dataIKR.length===0){
    alert("Data kosong");
    return;
  }

  let ws = XLSX.utils.json_to_sheet(dataIKR);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "IKCR");
  XLSX.writeFile(wb, "IKCR_LOCK.xlsx");
}

function triggerUploadIKR(){
  document.getElementById("uploadIKR").click();
}
