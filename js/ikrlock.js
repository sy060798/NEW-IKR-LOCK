let dataIKR = [];

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("fileIKR").addEventListener("change", importIKR);

  window.openTab = openTab;
});

// ================= TAB =================
function openTab(name, btn){

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".toolbar").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById("tab-" + name).classList.add("active");
  document.getElementById("toolbar-" + name).classList.add("active");

  if(btn) btn.classList.add("active");
}

// ================= IMPORT IKR =================
function importIKR(e){

  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = function(evt){

    const wb = XLSX.read(evt.target.result,{type:"binary"});
    let raw=[];

    wb.SheetNames.forEach(s=>{
      const json = XLSX.utils.sheet_to_json(wb.Sheets[s],{defval:""});
      raw.push(...json);
    });

    let map={};

    raw.forEach(r=>{

      let region = r.City || r.Region || "";
      let date = new Date(r["Wo End"] || "");

      if(!region || isNaN(date)) return;

      let tahun = date.getFullYear();
      let bulan = date.toLocaleString("id-ID",{month:"short"});

      let key = region+"_"+tahun+"_"+bulan;

      if(!map[key]){
        map[key]={region,tahun,bulan,jumlah:0,amount:0};
      }

      map[key].jumlah++;
      map[key].amount += Number(r["Boq Total"]||0);

    });

    dataIKR = Object.values(map);
    renderIKR();
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function renderIKR(){

  let tb=document.querySelector("#tableIKR tbody");
  tb.innerHTML="";

  dataIKR.forEach((d,i)=>{
    tb.innerHTML+=`
    <tr>
      <td>${i+1}</td>
      <td>${d.region}</td>
      <td>${d.tahun}</td>
      <td>${d.bulan}</td>
      <td>${d.jumlah}</td>
      <td>${d.amount}</td>
    </tr>`;
  });
}

// ================= ACTION =================
function hapusIKR(){
  dataIKR=[];
  renderIKR();
}

function downloadIKR(){
  alert("download IKR");
}

function uploadServer(){
  alert("upload server");
}

window.hapusIKR=hapusIKR;
window.downloadIKR=downloadIKR;
window.uploadServer=uploadServer;
