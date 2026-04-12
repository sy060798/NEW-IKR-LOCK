// =======================================
// ikrlock.js FULL FINAL
// upload orange + upload IMS dipisah
// FIX: gabung data region/bulan/tahun/type agar tidak double
// =======================================

// ---------- GLOBAL ----------
let dataIKR = [];
let chart = null;

const SERVER_URL =
"https://tracking-server-production-6a12.up.railway.app";

let currentDetail = [];
let currentApproved = [];
let paymentUsed = new Set();

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded",()=>{

  const file = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if(file) file.addEventListener("change", importExcel);
  if(fileIMS) fileIMS.addEventListener("change", importIMS);

  if(checkAll){
    checkAll.addEventListener("change",e=>{
      document.querySelectorAll(".chk").forEach(x=>{
        x.checked = e.target.checked;
      });
    });
  }

  loadServer();
});

// ---------- TAB ----------
function showTab(id,btn){

  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.remove("active");
  });

  let el = document.getElementById(id);
  if(el) el.classList.add("active");

  document.querySelectorAll(".menu button").forEach(b=>{
    b.classList.remove("active");
  });

  if(btn) btn.classList.add("active");

  if(id==="pivot") generatePivot();
}

// ---------- BUTTON ----------
function triggerUpload(){
  document.getElementById("file").click();
}

function triggerUploadIMS(){
  document.getElementById("fileIMS").click();
}

// =======================================
// UPLOAD ORANGE
// =======================================
function importExcel(e){

  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){

    let wb = XLSX.read(evt.target.result,{type:"binary"});
    let raw = [];
    let isIMSRaw = false;

    wb.SheetNames.forEach(s=>{

      let json = XLSX.utils.sheet_to_json(
        wb.Sheets[s],
        {defval:"",raw:false}
      );

      if(json.length){

        let first = json[0];

        if(
          first["Wo End"] ||
          first["WO END"] ||
          first["City"] ||
          first["Job Name"]
        ){
          isIMSRaw = true;
        }

        json.forEach(r=>raw.push(r));
      }
    });

    let newData = [];

    // ================= IMS RAW =================
    if(isIMSRaw){

      let map = {};
      let woUsed = new Set();
      let duplikat = 0;

      raw.forEach(r=>{

        let woNum = String(
          r["Wonumber"] ||
          r["WONUMBER"] ||
          ""
        ).trim();

        if(!woNum) return;

        if(woUsed.has(woNum)){
          duplikat++;
          return;
        }

        woUsed.add(woNum);

        let city =
          r["City"] ||
          r["CITY"] || "";

        let woEnd =
          r["Wo End"] ||
          r["WO END"] || "";

        let job =
          r["Job Name"] ||
          r["JOB NAME"] || "";

        if(!city || !woEnd) return;

        let total = parseAngka(
          r["Wo Total"] ||
          r["WO TOTAL"] || 0
        );

        let dt = new Date(woEnd);

        if(isNaN(dt)){
          if(String(woEnd).includes("/")){
            let p = String(woEnd)
              .split(" ")[0]
              .split("/");
            dt = new Date(
              `${p[2]}-${p[1]}-${p[0]}`
            );
          }
        }

        if(isNaN(dt)) return;

        let tahun = dt.getFullYear();
        let bulan = dt.toLocaleString(
          "id-ID",
          {month:"short"}
        );

        let key =
          city+"_"+tahun+"_"+bulan+"_"+job;

        if(!map[key]){
          map[key]={
            city,tahun,bulan,job,
            total:0,
            amount:0,
            listWO:[]
          };
        }

        map[key].total++;
        map[key].amount += total;

        map[key].listWO.push({
          wo:woNum,
          ref:r["Reference Code"]||"-",
          quo:r["Quotation Id"]||"-",
          status:r["Status"]||"-"
        });

      });

      Object.values(map).forEach(g=>{

        let amount =
          Math.round(g.amount * 1.11);

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

      alert(
        "Upload selesai\nDuplikat WO : "+
        duplikat
      );
    }

    // ================= FORMAT LAMA =================
    else{

      raw.forEach(r=>{

        let region =
          r["REGION"] ||
          r["Region"] || "";

        if(!region) return;

        let amount = parseAngka(
          r["AMOUNT"] ||
          r["Amount"]
        );

        let fs = parseAngka(
          r["FS AMOUNT"] ||
          r["FS Amount"]
        );

        newData.push({
          id:Date.now()+Math.random(),
          type:"IKR",
          region:region,
          tahun:r["TAHUN"]||"",
          wotype:r["WO TYPE"]||"",
          bulan:r["BULAN"]||"",
          jumlah:Number(r["JUMLAH WO"])||0,
          approved:Number(
            r["WO APPROVED"]
          )||0,
          amount:amount,
          fs:fs,
          selisih:amount-fs,
          remark:r["REMARK"]||"",
          invoice:r["NO INVOICE"]||"",
          note:r["NOTE"]||"",
          done:r["DONE"]||"NO",
          listWO:[],
          approvedList:[]
        });

      });
    }

    // =======================================
    // FIX GABUNG DATA BIAR TIDAK DOUBLE
    // =======================================
    dataIKR = [...dataIKR,...newData];
    mergeSameRows();

    sortData();
    render();

    alert(
      "Upload sukses : "+
      newData.length
    );

    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// =======================================
// GABUNG ROW SAMA
// =======================================
function mergeSameRows(){

  let map = {};

  dataIKR.forEach(d=>{

    let key =
      d.region+"|"+
      d.tahun+"|"+
      d.bulan+"|"+
      d.wotype;

    if(!map[key]){
      map[key] = JSON.parse(JSON.stringify(d));
      return;
    }

    map[key].jumlah += Number(d.jumlah||0);
    map[key].approved += Number(d.approved||0);
    map[key].amount += Number(d.amount||0);
    map[key].fs += Number(d.fs||0);
    map[key].selisih =
      map[key].amount-map[key].fs;

    map[key].listWO =
      [...(map[key].listWO||[]),
       ...(d.listWO||[])];

    map[key].approvedList =
      [...(map[key].approvedList||[]),
       ...(d.approvedList||[])];
  });

  dataIKR = Object.values(map);
}

// =======================================
// UPLOAD IMS
// =======================================
function importIMS(e){

  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){

    let wb = XLSX.read(evt.target.result,{type:"binary"});

    let totalUpdate = 0;
    let duplicate = 0;

    let woUsed = new Set();

    wb.SheetNames.forEach(s=>{

      let json = XLSX.utils.sheet_to_json(
        wb.Sheets[s],
        {defval:"",raw:false}
      );

      json.forEach(r=>{

        let wo = String(
          r["Wonumber"] ||
          r["WONUMBER"] ||
          ""
        ).trim();

        if(!wo) return;

        if(woUsed.has(wo)){
          duplicate++;
          return;
        }

        woUsed.add(wo);

        let woFix = wo.replace(/\D/g,'');

        let row = dataIKR.find(x=>
          (x.listWO||[]).some(a=>
            String(a.wo)
            .replace(/\D/g,'') === woFix
          )
        );

        if(row){

          row.approved =
            Number(row.approved||0)+1;

          row.remark = "APPROVED";
          row.note = "AUTO IMS";

          if(!row.approvedList)
            row.approvedList=[];

          row.approvedList.push({
            wo:wo,
            status:"APPROVED"
          });

          totalUpdate++;
        }

      });

    });

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
// ---------- SORT ----------
function sortData(){

  const bulanMap = {
    Jan:1,Feb:2,Mar:3,Apr:4,
    Mei:5,Jun:6,Jul:7,Agu:8,
    Sep:9,Okt:10,Nov:11,Des:12
  };

  dataIKR.sort((a,b)=>{

    if(a.region!==b.region)
      return a.region.localeCompare(b.region);

    if(Number(a.tahun)!==
       Number(b.tahun))
      return Number(a.tahun)-
             Number(b.tahun);

    if((bulanMap[a.bulan]||0)!==
       (bulanMap[b.bulan]||0))
      return (bulanMap[a.bulan]||0)-
             (bulanMap[b.bulan]||0);

    return a.wotype.localeCompare(
      b.wotype
    );
  });
}

// ---------- RENDER ----------
function render(){

  let tb =
    document.querySelector("#tbl tbody");

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
      <td><span onclick="showDetail(${i})" style="color:cyan;cursor:pointer">${d.jumlah}</span></td>
      <td><span onclick="showApproved(${i})" style="color:lime;cursor:pointer">${d.approved}</span></td>
      <td>${format(d.amount)}</td>
      <td>${format(d.fs)}</td>
      <td style="color:${d.selisih>0?'red':'lime'}">${format(d.selisih)}</td>
      <td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark}</td>
      <td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice}</td>
      <td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note}</td>
      <td><input type="checkbox" ${d.done==="YES"?"checked":""} onchange="toggleDone(${i},this.checked)"></td>
    </tr>`;
  });
}

// ---------- DETAIL ----------
function showDetail(i){
  currentDetail = dataIKR[i].listWO || [];
  popupData(currentDetail);
}

function showApproved(i){
  currentApproved = dataIKR[i].approvedList || [];
  popupData(currentApproved);
}

function popupData(arr){

  let tb =
  document.querySelector("#tblDetail tbody");

  tb.innerHTML = "";

  arr.forEach(x=>{
    tb.innerHTML += "<tr>"+
    Object.values(x).map(v=>
    `<td>${v}</td>`).join("")+
    "</tr>";
  });

  document.getElementById("popupWO").style.display="block";
}

function closePopup(){
  document.getElementById("popupWO").style.display="none";
}

function downloadDetail(){
  let ws = XLSX.utils.json_to_sheet(
    currentApproved.length
    ? currentApproved
    : currentDetail
  );
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"DETAIL");
  XLSX.writeFile(wb,"DETAIL.xlsx");
}

// ---------- EDIT ----------
function edit(i,f,v){ dataIKR[i][f]=v; }
function toggleDone(i,v){
  dataIKR[i].done = v?"YES":"NO";
}

// ---------- DELETE ----------
function hapusData(){

  let c =
  document.querySelectorAll(".chk");

  dataIKR = dataIKR.filter((d,i)=>
    !c[i].checked
  );

  render();
}

// ---------- DOWNLOAD ----------
function download(){

  let ws =
  XLSX.utils.json_to_sheet(dataIKR);

  let wb =
  XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,ws,"IKR"
  );

  XLSX.writeFile(
    wb,"IKR_LOCK.xlsx"
  );
}

// ---------- PIVOT ----------
function generatePivot(){

  let map = {};

  dataIKR.forEach(d=>{
    if(!map[d.bulan]) map[d.bulan]=0;
    map[d.bulan]+=Number(d.amount)||0;
  });

  let ctx =
  document.getElementById("chart");

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

// ---------- SERVER ----------
async function uploadServer(){}
async function loadServer(){}

// ---------- FORMAT ----------
function parseAngka(v){
  return parseInt(
    String(v||0)
    .replace(/[^0-9]/g,"")
  ) || 0;
}

function format(v){
  return "Rp "+
  Number(v||0)
  .toLocaleString("id-ID");
}

// ---------- GLOBAL ----------
window.triggerUpload=triggerUpload;
window.triggerUploadIMS=triggerUploadIMS;
window.download=download;
window.hapusData=hapusData;
window.uploadServer=uploadServer;
window.showTab=showTab;
window.generatePivot=generatePivot;
window.showDetail=showDetail;
window.showApproved=showApproved;
window.closePopup=closePopup;
window.downloadDetail=downloadDetail;
