let dataIKR = [];
let chart = null;

const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// 🔥 SIMPAN DETAIL POPUP
let currentDetail = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", ()=>{

  const file = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if(file) file.addEventListener("change", importExcel);
  if(fileIMS) fileIMS.addEventListener("change", importIMS);

  if(checkAll){
    checkAll.addEventListener("change", e=>{
      document.querySelectorAll(".chk").forEach(c=>c.checked=e.target.checked);
    });
  }

  loadServer();
});

// ================= TAB =================
function showTab(id,btn){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".menu button").forEach(b=>b.classList.remove("active"));
  if(btn) btn.classList.add("active");

  if(id==="pivot") generatePivot();
}

// ================= UPLOAD =================
function triggerUpload(){
  document.getElementById("file").click();
}

// ================= UPLOAD IMS =================
function triggerUploadIMS(){
  document.getElementById("fileIMS").click();
}

// ================= IMPORT BIASA =================
function importExcel(e){

  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){

    let wb = XLSX.read(evt.target.result,{type:'binary'});
    dataIKR = [];

    let raw = [];

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);
      json.forEach(r=>raw.push(r));
    });

    raw.forEach(r=>{

      let amount = parseAngka(r.AMOUNT);
      let fs = parseAngka(r["FS AMOUNT"]);

      dataIKR.push({
        id: Date.now()+Math.random(),
        type:"IKR",
        region:r.REGION || "",
        tahun:r.TAHUN || "",
        wotype:r["WO TYPE"] || "",
        bulan:r.BULAN || "",
        jumlah:r["JUMLAH WO"] || 0,
        approved:r["WO APPROVED"] || 0,
        amount:amount,
        fs:fs,
        selisih:amount-fs,
        remark:r.REMARK || "",
        invoice:r["NO INVOICE"] || "",
        note:r.NOTE || "",
        done:r.DONE || "NO",
        listWO:[]
      });

    });

    render();
  };

  reader.readAsBinaryString(file);
}

// ================= IMPORT IMS =================
function importIMS(e){

  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){

    let wb = XLSX.read(evt.target.result,{type:'binary'});
    let raw = [];

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);
      json.forEach(r=>raw.push(r));
    });

    let map = {};

    raw.forEach(r=>{

      if(!r.City || !r["Wo End"]) return;

      let wo = parseAngka(
        r["Wo Total"] ??
        r["WO TOTAL"] ??
        r["WoTotal"] ??
        r["WO_TOTAL"] ??
        0
      );

      let tgl = r["Wo End"];
      let date;

      if(typeof tgl === "string" && tgl.includes("/")){
        let [d,m,y] = tgl.split(" ")[0].split("/");
        date = new Date(`${y}-${m}-${d}`);
      }else{
        date = new Date(tgl);
      }

      let tahun = date.getFullYear();
      let bulan = date.toLocaleString("id-ID",{month:"short"});

      let key = r.City + "_" + bulan + "_" + r["Job Name"];

      if(!map[key]){
        map[key] = {
          city:r.City,
          tahun:tahun,
          bulan:bulan,
          job:r["Job Name"],
          total:0,
          woTotal:0,
          listWO:[]
        };
      }

      map[key].total++;
      map[key].woTotal += wo;

      map[key].listWO.push({
        wo:r["Wonumber"] || "-",
        ref:r["Reference Code"] || "-",
        quo:r["Quotation Id"] || "-",
        status:r["Status"] || "-"
      });

    });

    Object.values(map).forEach(g=>{

      let amount = Math.round(g.woTotal * 1.11);

      dataIKR.push({
        id: Date.now()+Math.random(),
        type:"IKR",
        region:g.city,
        tahun:g.tahun,
        wotype:g.job,
        bulan:g.bulan,
        jumlah:g.total,
        approved:0,
        amount:amount,
        fs:0,
        selisih:amount,
        remark:"",
        invoice:"",
        note:"",
        done:"NO",
        listWO:g.listWO
      });

    });

    render();
    alert("Upload IMS berhasil");

  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function render(){

  let tb = document.querySelector("#tbl tbody");
  if(!tb) return;

  tb.innerHTML = "";

  dataIKR.forEach((d,i)=>{

    tb.innerHTML += `
    <tr>
      <td>${i+1}</td>
      <td><input type="checkbox" class="chk"></td>
      <td>${d.region}</td>
      <td>${d.tahun}</td>
      <td>${d.wotype}</td>
      <td>${d.bulan}</td>

      <td>
        <span onclick="showDetail(${i})"
        style="cursor:pointer;color:cyan;text-decoration:underline">
        ${d.jumlah}
        </span>
      </td>

      <td>${d.approved}</td>

      <td style="text-align:right">${format(d.amount)}</td>
      <td style="text-align:right">${format(d.fs)}</td>

      <td style="text-align:right;color:${d.selisih<0?'orange':(d.selisih>0?'red':'lime')}">
        ${format(d.selisih)}
      </td>

      <td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark}</td>
      <td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice}</td>
      <td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note}</td>

      <td>
        <input type="checkbox"
        ${d.done=="YES"?"checked":""}
        onchange="toggleDone(${i},this.checked)">
      </td>
    </tr>`;

  });

}

// ================= DETAIL =================
function showDetail(index){

  let data = dataIKR[index];
  currentDetail = data.listWO || [];

  let tb = document.querySelector("#tblDetail tbody");
  if(!tb) return;

  tb.innerHTML = "";

  currentDetail.forEach(d=>{

    tb.innerHTML += `
    <tr>
      <td>${d.wo}</td>
      <td>${d.ref}</td>
      <td>${d.quo}</td>
      <td>${d.status}</td>
    </tr>`;

  });

  document.getElementById("popupWO").style.display = "block";
}

function closePopup(){
  document.getElementById("popupWO").style.display = "none";
}

// ================= DOWNLOAD DETAIL =================
function downloadDetail(){

  let ws = XLSX.utils.json_to_sheet(currentDetail);

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"DETAIL_WO");

  XLSX.writeFile(wb,"DETAIL_WO.xlsx");
}

function editDetail(){
  alert("Mode edit bisa dikembangkan nanti");
}

// ================= EDIT =================
function edit(i,f,v){
  dataIKR[i][f] = v;
}

function toggleDone(i,v){
  dataIKR[i].done = v ? "YES" : "NO";
}

// ================= DELETE =================
function hapusData(){

  let c = document.querySelectorAll(".chk");

  dataIKR = dataIKR.filter((_,i)=>!c[i].checked);

  render();
}

// ================= DOWNLOAD =================
function download(){

  let ws = XLSX.utils.json_to_sheet(dataIKR);

  let range = XLSX.utils.decode_range(ws['!ref']);

  for(let R=1; R<=range.e.r; ++R){

    ["H","I","J"].forEach(col=>{

      let cell = ws[col+(R+1)];

      if(cell){
        cell.t = "n";
        cell.z = '"Rp" #,##0;[Red]("Rp" #,##0)';
      }

    });

  }

  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"IKCR");

  XLSX.writeFile(wb,"IKCR_LOCK.xlsx");
}

// ================= FORMAT =================
function format(n){

  let num = Number(n) || 0;

  if(num < 0){
    return `Rp (${Math.abs(num).toLocaleString("id-ID")})`;
  }else{
    return `Rp ${num.toLocaleString("id-ID")}`;
  }
}

// ================= PARSE =================
function parseAngka(v){
  if(!v) return 0;
  return parseInt(String(v).replace(/[^0-9]/g,"")) || 0;
}

// ================= PIVOT =================
function generatePivot(){

  let map = {};

  dataIKR.forEach(d=>{
    if(!map[d.bulan]) map[d.bulan]=0;
    map[d.bulan]+=Number(d.amount)||0;
  });

  let ctx = document.getElementById("chart");
  if(!ctx) return;

  if(chart) chart.destroy();

  chart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:Object.keys(map),
      datasets:[{
        label:"Total Amount",
        data:Object.values(map)
      }]
    }
  });

}

// ================= SERVER =================
async function uploadServer(){

  try{

    await fetch(SERVER_URL + "/api/save",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        type:"IKR",
        data:dataIKR
      })
    });

    alert("Upload berhasil");

  }catch(e){
    alert("Gagal upload");
  }

}

async function loadServer(){

  try{

    let r = await fetch(SERVER_URL + "/api/get?type=IKR");
    dataIKR = await r.json();

    render();

  }catch(e){
    console.log("Gagal load server");
  }

}

// ================= GLOBAL =================
window.triggerUpload = triggerUpload;
window.triggerUploadIMS = triggerUploadIMS;
window.download = download;
window.hapusData = hapusData;
window.generatePivot = generatePivot;
window.uploadServer = uploadServer;
window.showTab = showTab;

window.showDetail = showDetail;
window.closePopup = closePopup;
window.downloadDetail = downloadDetail;
window.editDetail = editDetail;
