// ikrlock.js FULL UPGRADE FINAL
// ========================================
// GLOBAL
// ========================================
let dataIKR = [];
let chart = null;

const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// popup data
let currentDetail = [];
let currentApproved = [];

// anti duplicate IMS
let paymentUsed = new Set();

// ========================================
// INIT
// ========================================
document.addEventListener("DOMContentLoaded", ()=>{

  const file = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if(file) file.addEventListener("change", importExcel);
  if(fileIMS) fileIMS.addEventListener("change", importIMS);

  if(checkAll){
    checkAll.addEventListener("change", e=>{
      document.querySelectorAll(".chk").forEach(c=>{
        c.checked = e.target.checked;
      });
    });
  }

  loadServer();
});

// ========================================
// TAB
// ========================================
function showTab(id,btn){

  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.remove("active");
  });

  const el = document.getElementById(id);
  if(el) el.classList.add("active");

  document.querySelectorAll(".menu button").forEach(b=>{
    b.classList.remove("active");
  });

  if(btn) btn.classList.add("active");

  if(id==="pivot") generatePivot();

  if(id==="status" && typeof generateStatus==="function"){
    generateStatus();
  }
}

// ========================================
// BUTTON
// ========================================
function triggerUpload(){
  document.getElementById("file").click();
}

function triggerUploadIMS(){
  document.getElementById("fileIMS").click();
}

// ========================================
// IMPORT DATA ORANGE
// ========================================
function importExcel(e){

  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(evt){

    const wb = XLSX.read(evt.target.result,{type:"binary"});
    let raw = [];
    let isIMS = false;

    wb.SheetNames.forEach(s=>{

      const json = XLSX.utils.sheet_to_json(
        wb.Sheets[s],
        {defval:"",raw:false}
      );

      if(json.length){

        const first = json[0];

        if(
          first["Wo End"] ||
          first["WO END"] ||
          first["woEnd"] ||
          first["City"] ||
          first["city"] ||
          first["Job Name"] ||
          first["jobName"]
        ){
          isIMS = true;
        }

        json.forEach(r=>raw.push(r));
      }
    });

    let newData = [];

    // ====================================
    // IMS RAW
    // ====================================
    if(isIMS){

      let map = {};
      let woUsed = new Set();
      let duplicate = 0;

      raw.forEach(r=>{

        let wonumber = String(
          r["Wonumber"] ||
          r["WONUMBER"] ||
          r["wonumber"] || ""
        ).trim();

        if(!wonumber) return;

        // anti duplicate wonumber
        if(woUsed.has(wonumber)){
          duplicate++;
          return;
        }

        woUsed.add(wonumber);

        let city =
          r.City || r.CITY || r.city || "";

        let woEnd =
          r["Wo End"] ||
          r["WO END"] ||
          r["woEnd"] || "";

        let job =
          r["Job Name"] ||
          r["JOB NAME"] ||
          r["jobName"] || "";

        if(!city || !woEnd) return;

        let woRaw =
          r["Wo Total"] ??
          r["WO TOTAL"] ??
          r["WoTotal"] ??
          0;

        let wo = parseAngka(woRaw);

        let date;

        if(typeof woEnd==="number"){
          date = new Date((woEnd-25569)*86400*1000);
        }else if(String(woEnd).includes("/")){
          let p = String(woEnd).split(" ")[0].split("/");
          date = new Date(`${p[2]}-${p[1]}-${p[0]}`);
        }else{
          date = new Date(woEnd);
        }

        if(isNaN(date)) return;

        let tahun = date.getFullYear();
        let bulan = date.toLocaleString("id-ID",{month:"short"});

        let key = city+"_"+tahun+"_"+bulan+"_"+job;

        if(!map[key]){
          map[key]={
            city,tahun,bulan,job,
            total:0,
            woTotal:0,
            listWO:[]
          };
        }

        map[key].total++;
        map[key].woTotal += wo;

        map[key].listWO.push({
          wo:wonumber,
          ref:r["Reference Code"] || "-",
          quo:r["Quotation Id"] || "-",
          status:r["Status"] || "-"
        });

      });

      Object.values(map).forEach(g=>{

        let amount = Math.round(g.woTotal * 1.11);

        newData.push({
          id:Date.now()+Math.random(),
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
          listWO:g.listWO,
          approvedList:[]
        });

      });

      alert("Upload selesai\nDuplikat Wonumber : "+duplicate);
    }

    // ====================================
    // FORMAT LAMA
    // ====================================
    else{

      raw.forEach(r=>{

        let region =
          r.REGION ||
          r.Region || "";

        if(!region) return;

        let amount = parseAngka(
          r.AMOUNT || r.Amount
        );

        let fs = parseAngka(
          r["FS AMOUNT"] ||
          r["FS Amount"]
        );

        newData.push({
          id:Date.now()+Math.random(),
          type:"IKR",
          region:region,
          tahun:r.TAHUN || r.Tahun || "",
          wotype:r["WO TYPE"] || "",
          bulan:r.BULAN || "",
          jumlah:Number(r["JUMLAH WO"]) || 0,
          approved:Number(r["WO APPROVED"]) || 0,
          amount:amount,
          fs:fs,
          selisih:amount-fs,
          remark:r.REMARK || "",
          invoice:r["NO INVOICE"] || "",
          note:r.NOTE || "",
          done:r.DONE || "NO",
          listWO:[],
          approvedList:[]
        });

      });
    }

    dataIKR = [...dataIKR,...newData];

    sortData();
    render();

    alert("Upload sukses : "+newData.length+" data");

    e.target.value="";
  };

  reader.readAsBinaryString(file);
}

// ========================================
// IMPORT IMS UNGU
// duplicate by Pra Invoice + Invoice
// ========================================
function importIMS(e){

  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(evt){

    const wb = XLSX.read(evt.target.result,{type:"binary"});

    let totalUpdate = 0;
    let duplicate = 0;

    wb.SheetNames.forEach(name=>{

      const json = XLSX.utils.sheet_to_json(
        wb.Sheets[name],
        {defval:"",raw:false}
      );

      json.forEach(r=>{

        let pra = String(
          r["Pra Invoice Number"] ||
          r["Pra Invoice"] ||
          ""
        ).trim();

        let inv = String(
          r["Invoice Number"] ||
          ""
        ).trim();

        let status = String(
          r["Status"] || ""
        ).trim().toUpperCase();

        let wo = String(
          r["Wonumber"] ||
          r["WO Number"] ||
          ""
        ).trim();

        let amount = parseAngka(
          r["Invoice Total"] || 0
        );

        if(!pra && !inv) return;
        if(status!=="APPROVED") return;

        let key = pra+"_"+inv;

        if(paymentUsed.has(key)){
          duplicate++;
          return;
        }

        paymentUsed.add(key);

        // cari berdasarkan wonumber
        let row = dataIKR.find(x=>
          (x.listWO||[]).some(z=>
            String(z.wo).trim()===wo
          )
        );

        // fallback lama
        if(!row){
          row = dataIKR.find(x=>
            Number(x.approved) < Number(x.jumlah)
          );
        }

        if(row){

          row.approved =
            Number(row.approved)+1;

          row.fs =
            Number(row.fs)+amount;

          row.invoice = inv;
          row.remark = "APPROVED";
          row.note = "AUTO IMS";

          row.selisih =
            Number(row.amount) -
            Number(row.fs);

          if(!row.approvedList)
            row.approvedList=[];

          row.approvedList.push({
            pra:pra,
            invoice:inv,
            status:status,
            wo:wo
          });

          totalUpdate++;
        }

      });

    });

    sortData();
    render();

    alert(
      "IMS selesai\n"+
      "Update : "+totalUpdate+
      "\nDuplikat : "+duplicate
    );

    e.target.value="";
  };

  reader.readAsBinaryString(file);
}

// ========================================
// SORT
// ========================================
function sortData(){

  const urutBulan = {
    Jan:1,Feb:2,Mar:3,Apr:4,
    Mei:5,Jun:6,Jul:7,Agu:8,
    Sep:9,Okt:10,Nov:11,Des:12
  };

  dataIKR.sort((a,b)=>{

    if(a.region!==b.region)
      return a.region.localeCompare(b.region);

    if(Number(a.tahun)!==Number(b.tahun))
      return Number(a.tahun)-Number(b.tahun);

    if((urutBulan[a.bulan]||0)!==(urutBulan[b.bulan]||0))
      return (urutBulan[a.bulan]||0)-(urutBulan[b.bulan]||0);

    return a.wotype.localeCompare(b.wotype);
  });
}

// ========================================
// RENDER
// ========================================
function render(){

  let tb = document.querySelector("#tbl tbody");
  if(!tb) return;

  tb.innerHTML="";

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
        ${d.jumlah||0}
        </span>
      </td>

      <td>
        <span onclick="showApproved(${i})"
        style="cursor:pointer;color:lime;text-decoration:underline">
        ${d.approved||0}
        </span>
      </td>

      <td>${format(d.amount)}</td>
      <td>${format(d.fs)}</td>

      <td style="color:${d.selisih>0?'red':'lime'}">
        ${format(d.selisih)}
      </td>

      <td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark||""}</td>
      <td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice||""}</td>
      <td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note||""}</td>

      <td>
        <input type="checkbox"
        ${d.done==="YES"?"checked":""}
        onchange="toggleDone(${i},this.checked)">
      </td>
    </tr>`;
  });
}

// ========================================
// POPUP
// ========================================
function showDetail(i){

  currentDetail = dataIKR[i].listWO || [];
  currentApproved = [];

  const tb = document.querySelector("#tblDetail tbody");
  tb.innerHTML="";

  currentDetail.forEach(x=>{
    tb.innerHTML += `
    <tr>
      <td>${x.wo}</td>
      <td>${x.ref}</td>
      <td>${x.quo}</td>
      <td>${x.status}</td>
    </tr>`;
  });

  document.getElementById("popupWO").style.display="block";
}

function showApproved(i){

  currentApproved = dataIKR[i].approvedList || [];
  currentDetail = [];

  const tb = document.querySelector("#tblDetail tbody");
  tb.innerHTML="";

  currentApproved.forEach(x=>{
    tb.innerHTML += `
    <tr>
      <td>${x.pra}</td>
      <td>${x.invoice}</td>
      <td>${x.status}</td>
      <td>${x.wo}</td>
    </tr>`;
  });

  document.getElementById("popupWO").style.display="block";
}

function closePopup(){
  document.getElementById("popupWO").style.display="none";
}

function downloadDetail(){

  let arr =
    currentApproved.length
    ? currentApproved
    : currentDetail;

  let ws = XLSX.utils.json_to_sheet(arr);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb,ws,"DETAIL");
  XLSX.writeFile(wb,"DETAIL.xlsx");
}

// ========================================
// EDIT
// ========================================
function edit(i,f,v){
  dataIKR[i][f]=v;
}

function toggleDone(i,v){
  dataIKR[i].done = v ? "YES":"NO";
}

// ========================================
// DELETE
// ========================================
async function hapusData(){

  const c = document.querySelectorAll(".chk");
  let ids=[];

  dataIKR = dataIKR.filter((d,i)=>{
    if(c[i].checked){
      ids.push(String(d.id));
      return false;
    }
    return true;
  });

  render();

  try{
    await fetch(SERVER_URL+"/api/delete",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        type:"IKR",
        ids:ids
      })
    });
  }catch(e){}
}

// ========================================
// DOWNLOAD
// ========================================
function download(){

  let ws = XLSX.utils.json_to_sheet(dataIKR);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb,ws,"IKCR");
  XLSX.writeFile(wb,"IKCR_LOCK.xlsx");
}

// ========================================
// PIVOT
// ========================================
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

// ========================================
// SERVER
// ========================================
async function uploadServer(){

  if(dataIKR.length===0){
    alert("Data kosong");
    return;
  }

  try{

    let chunk=100;

    for(let i=0;i<dataIKR.length;i+=chunk){

      await fetch(SERVER_URL+"/api/save",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          type:"IKR",
          data:dataIKR.slice(i,i+chunk)
        })
      });
    }

    alert("Upload berhasil");

  }catch(e){
    alert("Upload gagal");
  }
}

async function loadServer(){

  try{

    let r = await fetch(
      SERVER_URL+"/api/get?type=IKR"
    );

    dataIKR = await r.json();

    if(!Array.isArray(dataIKR))
      dataIKR=[];

    sortData();
    render();

  }catch(e){
    console.log("Gagal load server");
  }
}

// ========================================
// FORMAT
// ========================================
function format(n){

  let num = Number(n)||0;

  if(num<0){
    return "Rp ("+
      Math.abs(num).toLocaleString("id-ID")+
      ")";
  }

  return "Rp "+
    num.toLocaleString("id-ID");
}

function parseAngka(v){
  if(!v) return 0;
  return parseInt(
    String(v).replace(/[^0-9]/g,"")
  ) || 0;
}

// ========================================
// GLOBAL
// ========================================
window.triggerUpload = triggerUpload;
window.triggerUploadIMS = triggerUploadIMS;
window.download = download;
window.hapusData = hapusData;
window.generatePivot = generatePivot;
window.uploadServer = uploadServer;
window.showTab = showTab;
window.showDetail = showDetail;
window.showApproved = showApproved;
window.closePopup = closePopup;
window.downloadDetail = downloadDetail;
