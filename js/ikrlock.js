// ================= GLOBAL =================
let dataIKR = [];
let chart = null;
let currentDetail = [];
const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if (file) file.addEventListener("change", importDataUtama);
  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll(".chk").forEach(c => c.checked = e.target.checked);
    });
  }

  loadServer();
});

// ================= LOADING =================
function showLoading(txt = "Loading...") {
  const box = document.getElementById("loadingBox");
  if (!box) return;
  box.style.display = "flex";
  const t = box.querySelector(".loadingText");
  if (t) t.innerText = txt;
}

function hideLoading() {
  const box = document.getElementById("loadingBox");
  if (box) box.style.display = "none";
}

// ================= TAB =================
function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");

  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (id === "pivot") generatePivot();
  if (id === "status" && typeof generateStatus === "function") generateStatus();
}

// ================= BUTTON =================
function triggerUpload() {
  document.getElementById("file").click();
}

function triggerUploadIMS() {
  document.getElementById("fileIMS").click();
}

// ================= HELPER =================
function getVal(obj, keys = []) {
  for (let k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      return String(obj[k]).trim();
    }
  }
  return "";
}

function parseAngka(v) {
  if (v === null || v === undefined || v === "") return 0;
  return Number(String(v).replace(/[^0-9.-]/g, "")) || 0;
}

function format(n) {
  let num = Number(n) || 0;
  if (num < 0) return `Rp (${Math.abs(num).toLocaleString("id-ID")})`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function getMonthName(date) {
  const arr = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return arr[date.getMonth()] || "";
}

function parseDateExcel(val) {
  if (!val) return null;

  if (typeof val === "number") {
    return new Date((val - 25569) * 86400 * 1000);
  }

  let s = String(val).trim();

  if (s.includes("/")) {
    let x = s.split(" ")[0].split("/");
    if (x.length === 3) return new Date(`${x[2]}-${x[1]}-${x[0]}`);
  }

  if (s.includes("-")) return new Date(s.replace(" ", "T"));

  let d = new Date(s);
  if (!isNaN(d)) return d;

  return null;
}

// ================= IMPORT DATA UTAMA =================
function importDataUtama(e) {
  const file = e.target.files[0];
  if (!file) return;

  showLoading("Upload Data...");

  const reader = new FileReader();

  reader.onload = function(evt) {
    try {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      let raw = [];

      wb.SheetNames.forEach(s => {
        const json = XLSX.utils.sheet_to_json(wb.Sheets[s], { defval: "", raw: false });
        raw.push(...json);
      });

      let count = 0;

      raw.forEach(r => {
        let region = getVal(r, ["REGION","Region","region"," REGION","REGION "]);
        if (!region) return;

        let tahun = getVal(r, ["TAHUN","Tahun","tahun"]);
        let wotype = getVal(r, ["WO TYPE","Wo Type","wo type"]);
        let bulan = getVal(r, ["BULAN","Bulan","bulan"]);

        let jumlah = parseAngka(getVal(r, ["JUMLAH WO","Jumlah WO"]));
        let approved = parseAngka(getVal(r, ["WO APPROVED","Wo Approved"]));
        let amount = parseAngka(getVal(r, ["AMOUNT","Amount"]));
        let fs = parseAngka(getVal(r, ["FS AMOUNT","FS Amount"]));

        let exist = dataIKR.find(x =>
          x.region === region &&
          String(x.tahun) === String(tahun) &&
          x.wotype === wotype &&
          x.bulan === bulan
        );

        if (exist) {
          exist.jumlah = jumlah;
          exist.approved = approved;
          exist.amount = amount;
          exist.fs = fs;
          exist.selisih = amount - fs;
        } else {
          dataIKR.push({
            id: Date.now() + Math.random(),
            type: "IKR",
            region,
            tahun,
            wotype,
            bulan,
            jumlah,
            approved,
            amount,
            fs,
            selisih: amount - fs,
            remark: getVal(r, ["REMARK","Remark"]),
            invoice: getVal(r, ["NO INVOICE","No Invoice"]),
            note: getVal(r, ["NOTE","Note"]),
            done: getVal(r, ["DONE","Done"]) || "NO",
            listWO: []
          });
        }

        count++;
      });

      sortData();
      render();
      alert("Upload Data sukses : " + count);

    } catch (err) {
      alert("Gagal upload data");
    }

    hideLoading();
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= IMPORT IMS =================
function importIMS(e) {
  const file = e.target.files[0];
  if (!file) return;

  showLoading("Upload IMS...");

  const reader = new FileReader();

  reader.onload = function(evt) {
    try {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      let raw = [];

      wb.SheetNames.forEach(s => {
        const json = XLSX.utils.sheet_to_json(wb.Sheets[s], { defval: "", raw: false });
        raw.push(...json);
      });

      let dup = {};
      let hit = 0;

      raw.forEach(r => {
        let pra = getVal(r, ["Pra Invoice Number"]);
        let inv = getVal(r, ["Invoice Number"]);
        let key = pra + "_" + inv;

        if (dup[key]) return;
        dup[key] = true;

        let wo = getVal(r, ["Wonumber","WONUMBER","wonumber"]);
        if (!wo) return;

        let invoiceTotal = parseAngka(getVal(r, ["Invoice Total"]));
        let status = getVal(r, ["Status"]) || "Approved";

        dataIKR.forEach(row => {
          let found = false;

          row.listWO.forEach(x => {
            if (String(x.wo) === String(wo)) {
              x.status = status;
              found = true;
            }
          });

          if (found) {
            row.approved = (Number(row.approved) || 0) + 1;
            row.fs = (Number(row.fs) || 0) + invoiceTotal;
            row.selisih = (Number(row.amount) || 0) - (Number(row.fs) || 0);
            hit++;
          }
        });
      });

      sortData();
      render();

      alert("Upload IMS sukses : " + hit + " WO match");

    } catch (err) {
      alert("Gagal upload IMS");
    }

    hideLoading();
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= SORT =================
function sortData() {
  const urut = {
    Jan:1, Feb:2, Mar:3, Apr:4, Mei:5, Jun:6,
    Jul:7, Agu:8, Sep:9, Okt:10, Nov:11, Des:12
  };

  dataIKR.sort((a,b)=>{
    if(a.region !== b.region) return a.region.localeCompare(b.region);
    if(Number(a.tahun)!==Number(b.tahun)) return Number(a.tahun)-Number(b.tahun);
    if((urut[a.bulan]||0)!==(urut[b.bulan]||0)) return (urut[a.bulan]||0)-(urut[b.bulan]||0);
    return a.wotype.localeCompare(b.wotype);
  });
}

// ================= RENDER =================
function render() {
  let tb = document.querySelector("#tbl tbody");
  if (!tb) return;

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
<span onclick="showDetail(${i})" style="cursor:pointer;color:cyan;text-decoration:underline">
${d.jumlah || 0}
</span>
</td>
<td>${d.approved || 0}</td>
<td style="text-align:right">${format(d.amount)}</td>
<td style="text-align:right">${format(d.fs)}</td>
<td style="text-align:right;color:${d.selisih<0?"orange":d.selisih>0?"red":"lime"}">
${format(d.selisih)}
</td>
<td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark||""}</td>
<td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice||""}</td>
<td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note||""}</td>
<td>
<input type="checkbox" ${d.done==="YES"?"checked":""}
onchange="toggleDone(${i},this.checked)">
</td>
</tr>`;
  });
}

// ================= DETAIL =================
function showDetail(i) {
  currentDetail = dataIKR[i].listWO || [];
  let tb = document.querySelector("#tblDetail tbody");
  tb.innerHTML = "";

  currentDetail.forEach(d=>{
    tb.innerHTML += `
<tr>
<td>${d.wo}</td>
<td>${d.ref||""}</td>
<td>${d.quo||""}</td>
<td>${d.status||""}</td>
</tr>`;
  });

  document.getElementById("popupWO").style.display = "block";
}

function closePopup() {
  document.getElementById("popupWO").style.display = "none";
}

function downloadDetail() {
  let ws = XLSX.utils.json_to_sheet(currentDetail);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DETAIL_WO");
  XLSX.writeFile(wb, "DETAIL_WO.xlsx");
}

// ================= EDIT =================
function edit(i,f,v){ dataIKR[i][f] = v; }
function toggleDone(i,v){ dataIKR[i].done = v ? "YES" : "NO"; }

// ================= DELETE =================
async function hapusData() {
  let c = document.querySelectorAll(".chk");
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
    await fetch(SERVER_URL + "/api/delete",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ type:"IKR", ids })
    });
  }catch(e){}
}

// ================= DOWNLOAD =================
function download() {
  let ws = XLSX.utils.json_to_sheet(dataIKR);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "IKCR");
  XLSX.writeFile(wb, "IKCR_LOCK.xlsx");
}

// ================= PIVOT =================
function generatePivot() {
  let map = {};

  dataIKR.forEach(d=>{
    if(!map[d.bulan]) map[d.bulan]=0;
    map[d.bulan]+=Number(d.amount)||0;
  });

  let ctx = document.getElementById("chart");
  if (!ctx) return;

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
async function uploadServer() {
  if (dataIKR.length === 0) return alert("Data kosong");

  showLoading("Upload Server...");

  try{
    for(let i=0;i<dataIKR.length;i+=100){
      let chunk = dataIKR.slice(i,i+100);

      await fetch(SERVER_URL + "/api/save",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ type:"IKR", data:chunk })
      });
    }

    alert("Upload berhasil");

  }catch(e){
    alert("Upload gagal");
  }

  hideLoading();
}

async function loadServer() {
  try{
    let r = await fetch(SERVER_URL + "/api/get?type=IKR");
    dataIKR = await r.json();

    if(!Array.isArray(dataIKR)) dataIKR=[];

    sortData();
    render();

  }catch(e){
    console.log("Gagal load");
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
