// ikrlock.js FULL FINAL
// ========================================
// GLOBAL
// ========================================
let dataIKR = [];
let chart = null;

let currentDetail = [];
let currentApproved = [];

const SERVER_URL =
"https://tracking-server-production-6a12.up.railway.app";

// anti duplicate IMS
let paymentUsed = new Set();

// ========================================
// INIT
// ========================================
document.addEventListener("DOMContentLoaded",()=>{

  const file     = document.getElementById("file");
  const fileIMS  = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if(file) file.addEventListener("change",importExcel);
  if(fileIMS) fileIMS.addEventListener("change",importIMS);

  if(checkAll){
    checkAll.addEventListener("change",e=>{
      document.querySelectorAll(".chk").forEach(x=>{
        x.checked = e.target.checked;
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
// IMPORT DATA AWAL / IMS RAW
// ========================================
function importExcel(e){

  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(evt){

    const wb = XLSX.read(evt.target.result,{type:"binary"});
    let rows = [];
    let isIMSRaw = false;

    wb.SheetNames.forEach(name=>{

      const json = XLSX.utils.sheet_to_json(
        wb.Sheets[name],
        {defval:"",raw:false}
      );

      if(json.length){

        const first = json[0];

        if(
          first["Wo End"] ||
          first["WO END"] ||
          first["City"] ||
          first["Job Name"]
        ){
          isIMSRaw = true;
        }

        json.forEach(r=>rows.push(r));
      }
    });

    let newData = [];

    // ====================================
    // IMS RAW
    // ====================================
   if(isIMSRaw){

  let map = {};
  let woUsed = new Set();   // anti duplicate Wonumber
  let duplikat = 0;

  rows.forEach(r=>{

    const wonumber = String(
      r["Wonumber"] ||
      r["WONUMBER"] ||
      r["wonumber"] || ""
    ).trim();

    if(!wonumber) return;

    // jika sama skip
    if(woUsed.has(wonumber)){
      duplikat++;
      return;
    }

    woUsed.add(wonumber);

    const city =
      r.City || r.CITY || r.city || "";

    const woEnd =
      r["Wo End"] ||
      r["WO END"] ||
      r["woEnd"] || "";

    const job =
      r["Job Name"] ||
      r["JOB NAME"] ||
      r["jobName"] || "";

    if(!city || !woEnd) return;

    let woTotal = parseAngka(
      r["Wo Total"] ||
      r["WO TOTAL"] ||
      r["WoTotal"] || 0
    );

    let dt = new Date(woEnd);

    if(isNaN(dt)){
      if(String(woEnd).includes("/")){
        let p = String(woEnd).split("/");
        dt = new Date(`${p[2]}-${p[1]}-${p[0]}`);
      }
    }

    if(isNaN(dt)) return;

    const tahun = dt.getFullYear();
    const bulan = dt.toLocaleString("id-ID",{month:"short"});

    const key = city+"_"+tahun+"_"+bulan+"_"+job;

    if(!map[key]){
      map[key]={
        city,tahun,bulan,job,
        total:0,
        amount:0,
        listWO:[]
      };
    }

    map[key].total++;
    map[key].amount += woTotal;

    map[key].listWO.push({
      wo: wonumber,
      ref:r["Reference Code"] || "-",
      quo:r["Quotation Id"] || "-",
      status:r["Status"] || "-"
    });

  });

  alert("Upload selesai\nDuplikat WO : " + duplikat);
}

      // ====================================
      // FORMAT LAMA
      // ====================================
      rows.forEach(r=>{

        const region =
          r.REGION ||
          r.Region || "";

        if(!region) return;

        const amount =
          parseAngka(
            r.AMOUNT ||
            r.Amount
          );

        const fs =
          parseAngka(
            r["FS AMOUNT"] ||
            r["FS Amount"]
          );

        newData.push({
          id:Date.now()+Math.random(),
          type:"IKR",
          region:region,
          tahun:r.TAHUN || "",
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

    alert("Upload sukses : "+newData.length);

    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ========================================
// IMPORT IMS PAYMENT
// kolom:
// Pra Invoice Number
// Invoice Number
// Status
// Wonumber
// Invoice Total
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

        const pra = String(
          r["Pra Invoice Number"] || ""
        ).trim();

        const inv = String(
          r["Invoice Number"] || ""
        ).trim();

        const status = String(
          r["Status"] || ""
        ).trim().toUpperCase();

        const wo = String(
          r["Wonumber"] ||
          r["WO Number"] ||
          "-"
        ).trim();

        const amount = parseAngka(
          r["Invoice Total"]
        );

        if(!pra && !inv) return;
        if(status!=="APPROVED") return;

        const key = pra+"_"+inv;

        // anti duplicate
        if(paymentUsed.has(key)){
          duplicate++;
          return;
        }

        paymentUsed.add(key);

        // cari row yang masih kurang approved
        let row = dataIKR.find(x=>
          Number(x.approved) <
          Number(x.jumlah)
        );

        if(row){

          if(!row.approvedList)
            row.approvedList = [];

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

    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ========================================
// SORT
// ========================================
function sortData(){

  const bulanMap = {
    Jan:1,Feb:2,Mar:3,Apr:4,
    Mei:5,Jun:6,Jul:7,Agu:8,
    Sep:9,Okt:10,Nov:11,Des:12
  };

  dataIKR.sort((a,b)=>{

    if(a.region!==b.region)
      return a.region.localeCompare(b.region);

    if(Number(a.tahun)!==Number(b.tahun))
      return Number(a.tahun)-Number(b.tahun);

    if(
      (bulanMap[a.bulan]||0)!==
      (bulanMap[b.bulan]||0)
    ){
      return (
        bulanMap[a.bulan]||0
      ) - (
        bulanMap[b.bulan]||0
      );
    }

    return a.wotype.localeCompare(b.wotype);
  });
}

// ========================================
// RENDER
// ========================================
function render(){

  const tb =
    document.querySelector("#tbl tbody");

  if(!tb) return;

  tb.innerHTML = "";

  dataIKR.forEach((d,i)=>{

    tb.innerHTML += `
    <tr>

      <td>${i+1}</td>

      <td>
        <input type="checkbox" class="chk">
      </td>

      <td>${d.region}</td>
      <td>${d.tahun}</td>
      <td>${d.wotype}</td>
      <td>${d.bulan}</td>

      <td>
        <span
        onclick="showDetail(${i})"
        style="
          color:cyan;
          cursor:pointer;
          text-decoration:underline;
        ">
        ${d.jumlah}
        </span>
      </td>

      <td>
        <span
        onclick="showApproved(${i})"
        style="
          color:lime;
          cursor:pointer;
          text-decoration:underline;
        ">
        ${d.approved}
        </span>
      </td>

      <td>${format(d.amount)}</td>
      <td>${format(d.fs)}</td>

      <td style="
      color:${Number(d.selisih)>0?'red':'lime'}">
      ${format(d.selisih)}
      </td>

      <td contenteditable
      oninput="edit(${i},'remark',this.innerText)">
      ${d.remark}
      </td>

      <td contenteditable
      oninput="edit(${i},'invoice',this.innerText)">
      ${d.invoice}
      </td>

      <td contenteditable
      oninput="edit(${i},'note',this.innerText)">
      ${d.note}
      </td>

      <td>
        <input type="checkbox"
        ${d.done==="YES"?"checked":""}
        onchange="toggleDone(${i},this.checked)">
      </td>

    </tr>
    `;
  });
}

// ========================================
// DETAIL JUMLAH WO
// ========================================
function showDetail(i){

  document.querySelector(
    "#popupWO h3"
  ).innerText = "Detail Jumlah WO";

  currentDetail =
    dataIKR[i].listWO || [];

  const tb =
    document.querySelector("#tblDetail tbody");

  if(!tb) return;

  tb.innerHTML = "";

  currentDetail.forEach(x=>{

    tb.innerHTML += `
    <tr>
      <td>${x.wo}</td>
      <td>${x.ref}</td>
      <td>${x.quo}</td>
      <td>${x.status}</td>
    </tr>
    `;
  });

  document.getElementById(
    "popupWO"
  ).style.display = "block";
}

// ========================================
// DETAIL APPROVED
// Pra Invoice Number
// Invoice Number
// Status
// Wonumber
// ========================================
function showApproved(i){

  document.querySelector(
    "#popupWO h3"
  ).innerText = "Detail WO Approved";

  currentApproved =
    dataIKR[i].approvedList || [];

  const tb =
    document.querySelector("#tblDetail tbody");

  if(!tb) return;

  tb.innerHTML = "";

  currentApproved.forEach(x=>{

    tb.innerHTML += `
    <tr>
      <td>${x.pra}</td>
      <td>${x.invoice}</td>
      <td>${x.status}</td>
      <td>${x.wo}</td>
    </tr>
    `;
  });

  document.getElementById(
    "popupWO"
  ).style.display = "block";
}

function closePopup(){
  document.getElementById(
    "popupWO"
  ).style.display = "none";
}

function downloadDetail(){

  const ws =
    XLSX.utils.json_to_sheet(
      currentDetail.length
      ? currentDetail
      : currentApproved
    );

  const wb =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,ws,"DETAIL"
  );

  XLSX.writeFile(
    wb,"DETAIL_WO.xlsx"
  );
}

// ========================================
// EDIT
// ========================================
function edit(i,f,v){
  dataIKR[i][f]=v;
}

function toggleDone(i,v){
  dataIKR[i].done =
    v ? "YES":"NO";
}

// ========================================
// DELETE
// ========================================
async function hapusData(){

  const c =
    document.querySelectorAll(".chk");

  let ids = [];

  dataIKR = dataIKR.filter((d,i)=>{

    if(c[i].checked){
      ids.push(String(d.id));
      return false;
    }

    return true;
  });

  render();

  try{
    await fetch(
      SERVER_URL+"/api/delete",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          type:"IKR",
          ids:ids
        })
      }
    );
  }catch(e){}
}

// ========================================
// DOWNLOAD
// ========================================
function download(){

  const ws =
    XLSX.utils.json_to_sheet(dataIKR);

  const wb =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,ws,"IKCR"
  );

  XLSX.writeFile(
    wb,"IKCR_LOCK.xlsx"
  );
}

// ========================================
// PIVOT
// ========================================
function generatePivot(){

  let map = {};

  dataIKR.forEach(d=>{

    if(!map[d.bulan])
      map[d.bulan]=0;

    map[d.bulan]+=
      Number(d.amount)||0;
  });

  const ctx =
    document.getElementById("chart");

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
    },
    options:{
      responsive:true
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

  const chunk = 100;

  try{

    for(let i=0;i<dataIKR.length;i+=chunk){

      await fetch(
        SERVER_URL+"/api/save",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            type:"IKR",
            data:dataIKR.slice(i,i+chunk)
          })
        }
      );
    }

    alert("Upload berhasil");

  }catch(e){
    alert("Upload gagal");
  }
}

async function loadServer(){

  try{

    const r = await fetch(
      SERVER_URL+"/api/get?type=IKR"
    );

    const j = await r.json();

    if(Array.isArray(j)){
      dataIKR = j;
    }else{
      dataIKR = [];
    }

    sortData();
    render();

  }catch(e){
    console.log("load gagal");
  }
}

// ========================================
// FORMAT
// ========================================
function parseAngka(v){

  return parseInt(
    String(v||0)
    .replace(/[^0-9]/g,"")
  ) || 0;
}

function format(v){

  return "Rp " +
  Number(v||0)
  .toLocaleString("id-ID");
}

// ========================================
// GLOBAL
// ========================================
window.triggerUpload = triggerUpload;
window.triggerUploadIMS = triggerUploadIMS;
window.download = download;
window.hapusData = hapusData;
window.uploadServer = uploadServer;
window.showTab = showTab;
window.generatePivot = generatePivot;
window.showDetail = showDetail;
window.showApproved = showApproved;
window.closePopup = closePopup;
window.downloadDetail = downloadDetail;
