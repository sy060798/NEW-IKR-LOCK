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

  if (file) file.addEventListener("change", importData);
  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll(".chk").forEach(c => {
        c.checked = e.target.checked;
      });
    });
  }

  loadServer();
});

// ================= LOADING =================
function showLoading(text = "Loading...") {
  const box = document.getElementById("loadingBox");
  if (!box) return;

  box.style.display = "flex";
  box.innerHTML = `
    <div class="loader"></div>
    <div class="loadingText">${text}</div>
  `;
}

function hideLoading() {
  const box = document.getElementById("loadingBox");
  if (!box) return;
  box.style.display = "none";
}

// ================= TAB =================
function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");

  document.querySelectorAll(".menu button").forEach(b => {
    b.classList.remove("active");
  });

  btn?.classList.add("active");

  if (id === "pivot") generatePivot();
}

// ================= TRIGGER =================
function triggerUpload() {
  document.getElementById("file").click();
}

function triggerUploadIMS() {
  document.getElementById("fileIMS").click();
}

// ===================================================
// ================= UPLOAD DATA ======================
// ===================================================
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  showLoading("Upload Data...");

  const reader = new FileReader();

  reader.onload = function (evt) {
    try {
      const wb = XLSX.read(evt.target.result, { type: "binary" });

      let raw = [];

      wb.SheetNames.forEach(s => {
        const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
          defval: "",
          raw: false
        });
        raw.push(...json);
      });

      let totalBaru = 0;

      raw.forEach(r => {
        let row = {
          id: Date.now() + Math.random(),
          type: "IKR",
          region: (r.REGION || r.Region || "").toString().trim().toUpperCase(),
          tahun: r.TAHUN || r.Tahun || "",
          wotype: r["WO TYPE"] || r["Wo Type"] || "",
          bulan: r.BULAN || r.Bulan || "",
          jumlah: Number(r["JUMLAH WO"] || 0),
          approved: Number(r["WO APPROVED"] || 0),
          amount: parseAngka(r.AMOUNT || r.Amount),
          fs: parseAngka(r["FS AMOUNT"] || r["FS Amount"]),
          selisih: 0,
          remark: r.REMARK || "",
          invoice: r["NO INVOICE"] || "",
          note: r.NOTE || "",
          done: r.DONE || "NO",
          listWO: []
        };

        row.selisih = row.amount - row.fs;

        let idx = dataIKR.findIndex(x =>
          x.region === row.region &&
          String(x.tahun) === String(row.tahun) &&
          x.bulan === row.bulan &&
          x.wotype === row.wotype
        );

        if (idx >= 0) {
          dataIKR[idx] = { ...dataIKR[idx], ...row };
        } else {
          dataIKR.push(row);
          totalBaru++;
        }
      });

      sortData();
      render();

      hideLoading();
      alert("Upload data sukses : " + totalBaru);
      e.target.value = "";
    } catch (err) {
      hideLoading();
      alert("Gagal upload data");
    }
  };

  reader.readAsBinaryString(file);
}

// ===================================================
// ================= UPLOAD IMS =======================
// ===================================================
function importIMS(e) {
  const file = e.target.files[0];
  if (!file) return;

  showLoading("Upload IMS...");

  const reader = new FileReader();

  reader.onload = function (evt) {
    try {
      const wb = XLSX.read(evt.target.result, { type: "binary" });

      let raw = [];

      wb.SheetNames.forEach(s => {
        const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
          defval: "",
          raw: false
        });
        raw.push(...json);
      });

      // duplicate invoice
      let used = {};
      let rows = [];

      raw.forEach(r => {
        let key =
          (r["Pra Invoice Number"] || "") +
          "|" +
          (r["Invoice Number"] || "");

        if (!used[key]) {
          used[key] = true;
          rows.push(r);
        }
      });

      let totalUpdate = 0;

      rows.forEach(r => {
        let wo = String(r["Wonumber"] || "").trim();
        if (!wo) return;

        let invTotal = parseAngka(r["Invoice Total"]);

        dataIKR.forEach(main => {
          if (!Array.isArray(main.listWO)) return;

          let dt = main.listWO.find(x =>
            String(x.wo).trim() === wo
          );

          if (dt) {
            dt.status = "Approved";
            dt.ref = r["Pra Invoice Number"] || "";
            dt.quo = r["Invoice Number"] || "";
            dt.invoiceTotal = invTotal;
            totalUpdate++;
          }
        });
      });

      // recalc
      dataIKR.forEach(main => {
        let fs = 0;
        let appr = {};

        if (Array.isArray(main.listWO)) {
          main.listWO.forEach(d => {
            if (String(d.status).toLowerCase().includes("approved")) {
              appr[d.wo] = true;
              fs += Number(d.invoiceTotal || 0);
            }
          });
        }

        main.approved = Object.keys(appr).length;
        main.fs = fs;
        main.selisih = Number(main.amount || 0) - fs;
      });

      sortData();
      render();

      hideLoading();
      alert("Upload IMS sukses : " + totalUpdate + " WO updated");
      e.target.value = "";
    } catch (err) {
      hideLoading();
      alert("Gagal upload IMS");
    }
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
    if((urut[a.bulan]||0)!==(urut[b.bulan]||0))
      return (urut[a.bulan]||0)-(urut[b.bulan]||0);
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
<td><span onclick="showDetail(${i})" style="color:cyan;cursor:pointer">${d.jumlah||0}</span></td>
<td>${d.approved||0}</td>
<td>${format(d.amount)}</td>
<td>${format(d.fs)}</td>
<td style="color:${d.selisih>0?'red':'lime'}">${format(d.selisih)}</td>
<td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark||""}</td>
<td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice||""}</td>
<td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note||""}</td>
<td><input type="checkbox" ${d.done==="YES"?"checked":""}
onchange="toggleDone(${i},this.checked)"></td>
</tr>`;
  });
}

// ================= DETAIL =================
function showDetail(i){
  currentDetail = dataIKR[i].listWO || [];

  let tb = document.querySelector("#tblDetail tbody");
  tb.innerHTML = "";

  currentDetail.forEach(d=>{
    tb.innerHTML += `
<tr>
<td>${d.ref||""}</td>
<td>${d.quo||""}</td>
<td>${d.status||""}</td>
<td>${d.wo||""}</td>
</tr>`;
  });

  document.getElementById("popupWO").style.display = "block";
}

function closePopup(){
  document.getElementById("popupWO").style.display = "none";
}

// ================= EDIT =================
function edit(i,f,v){ dataIKR[i][f]=v; }
function toggleDone(i,v){ dataIKR[i].done=v?"YES":"NO"; }

// ================= DELETE =================
function hapusData(){
  let c = document.querySelectorAll(".chk");
  dataIKR = dataIKR.filter((d,i)=>!c[i].checked);
  render();
}

// ================= DOWNLOAD =================
function download(){
  let ws = XLSX.utils.json_to_sheet(dataIKR);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"IKCR");
  XLSX.writeFile(wb,"IKCR_LOCK.xlsx");
}

function downloadDetail(){
  let ws = XLSX.utils.json_to_sheet(currentDetail);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"DETAIL_WO");
  XLSX.writeFile(wb,"DETAIL_WO.xlsx");
}

// ================= FORMAT =================
function parseAngka(v){
  if(!v) return 0;
  return Number(String(v).replace(/[^0-9]/g,"")) || 0;
}

function format(n){
  return "Rp " + (Number(n)||0).toLocaleString("id-ID");
}

// ================= PIVOT =================
function generatePivot(){
  let map = {};

  dataIKR.forEach(d=>{
    if(!map[d.bulan]) map[d.bulan]=0;
    map[d.bulan]+=Number(d.amount)||0;
  });

  let ctx=document.getElementById("chart");
  if(chart) chart.destroy();

  chart=new Chart(ctx,{
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
  showLoading("Upload Server...");

  try{
    await fetch(SERVER_URL+"/api/save",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        type:"IKR",
        data:dataIKR
      })
    });

    hideLoading();
    alert("Upload berhasil");
  }catch(e){
    hideLoading();
    alert("Gagal upload");
  }
}

async function loadServer(){
  showLoading("Load Server...");

  try{
    let r = await fetch(SERVER_URL+"/api/get?type=IKR");
    dataIKR = await r.json();

    if(!Array.isArray(dataIKR)) dataIKR=[];

    sortData();
    render();
  }catch(e){}

  hideLoading();
}

// ================= GLOBAL =================
window.triggerUpload = triggerUpload;
window.triggerUploadIMS = triggerUploadIMS;
window.download = download;
window.hapusData = hapusData;
window.uploadServer = uploadServer;
window.showTab = showTab;
window.showDetail = showDetail;
window.closePopup = closePopup;
window.downloadDetail = downloadDetail;
