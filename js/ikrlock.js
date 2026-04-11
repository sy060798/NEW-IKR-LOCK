let dataIKR = [];
let chart = null;

const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", ()=>{
  const file = document.getElementById("file");
  const checkAll = document.getElementById("checkAll");

  if(file) file.addEventListener("change", importExcel);

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
  btn.classList.add("active");

  if(id==="pivot") generatePivot();
}

// ================= UPLOAD =================
function triggerUpload(){
  document.getElementById("file").click();
}

function importExcel(e){
  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){
    let wb = XLSX.read(evt.target.result,{type:'binary'});
    dataIKR = [];

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

      json.forEach(r=>{
        let amount = parseInt(r.AMOUNT)||0;
        let fs = parseInt(r["FS AMOUNT"])||0;

        dataIKR.push({
          id: Date.now() + Math.random(), // 🔥 WAJIB (ANTI TABRAKAN)
          type: "IKR",
          region: r.REGION||"",
          tahun: r.TAHUN||"",
          wotype: r["WO TYPE"]||"",
          bulan: r.BULAN||"",
          jumlah: r["JUMLAH WO"]||0,
          approved: r["WO APPROVED"]||0,
          amount: amount,
          fs: fs,
          selisih: amount - fs,
          remark: r.REMARK||"",
          invoice: r["NO INVOICE"]||"",
          note: r.NOTE||"",
          done: r.DONE||"NO"
        });
      });
    });

    render();
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
      <td>${d.jumlah}</td>
      <td>${d.approved}</td>
      <td>${format(d.amount)}</td>
      <td>${format(d.fs)}</td>
      <td style="color:${d.selisih!=0?'red':'lime'}">${format(d.selisih)}</td>
      <td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark}</td>
      <td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice}</td>
      <td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note}</td>
      <td>
        <input type="checkbox" ${d.done=="YES"?"checked":""}
        onchange="toggleDone(${i},this.checked)">
      </td>
    </tr>`;
  });
}

// ================= EDIT =================
function edit(i,f,v){dataIKR[i][f]=v;}
function toggleDone(i,v){dataIKR[i].done=v?"YES":"NO";}

// ================= DELETE =================
function hapusData(){
  let c = document.querySelectorAll(".chk");
  dataIKR = dataIKR.filter((_,i)=>!c[i].checked);
  render();
}

// ================= DOWNLOAD =================
function download(){
  let ws = XLSX.utils.json_to_sheet(dataIKR);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "IKCR");
  XLSX.writeFile(wb,"IKCR_LOCK.xlsx");
}

function format(n){return Number(n).toLocaleString("id-ID");}

// ================= PIVOT =================
function generatePivot(){
  let map = {};
  dataIKR.forEach(d=>{
    if(!map[d.bulan]) map[d.bulan]=0;
    map[d.bulan]+=d.amount;
  });

  let ctx = document.getElementById("chart");
  if(!ctx) return;

  if(chart) chart.destroy();

  chart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:Object.keys(map),
      datasets:[{label:"Total Amount",data:Object.values(map)}]
    }
  });
}

// ================= SERVER =================
async function uploadServer(){
  try{
    await fetch(SERVER_URL + "/api/save",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
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
  }catch{
    console.log("Gagal load server");
  }
}

// ================= GLOBAL =================
window.triggerUpload = triggerUpload;
window.download = download;
window.hapusData = hapusData;
window.generatePivot = generatePivot;
window.uploadServer = uploadServer;
window.showTab = showTab;
