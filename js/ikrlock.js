let dataIKR = [];
let chart = null;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("file").addEventListener("change", importExcel);

  document.getElementById("checkAll").addEventListener("change", e=>{
    document.querySelectorAll(".chk").forEach(c=>c.checked=e.target.checked);
  });
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
      <td><input type="checkbox" ${d.done=="YES"?"checked":""}
          onchange="toggleDone(${i},this.checked)">
      </td>
    </tr>`;
  });
}

// ================= EDIT =================
function edit(i,field,val){
  dataIKR[i][field] = val;
}

function toggleDone(i,val){
  dataIKR[i].done = val ? "YES" : "NO";
}

// ================= DELETE =================
function hapusData(){
  let checks = document.querySelectorAll(".chk");

  dataIKR = dataIKR.filter((_,i)=>!checks[i].checked);
  render();
}

// ================= DOWNLOAD =================
function download(){
  let ws = XLSX.utils.json_to_sheet(dataIKR);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "IKCR");
  XLSX.writeFile(wb,"IKCR_LOCK.xlsx");
}

// ================= FORMAT =================
function format(num){
  return Number(num).toLocaleString("id-ID");
}

// ================= PIVOT =================
function generatePivot(){
  let map = {};

  dataIKR.forEach(d=>{
    if(!map[d.bulan]) map[d.bulan]=0;
    map[d.bulan]+=d.amount;
  });

  let labels = Object.keys(map);
  let values = Object.values(map);

  let ctx = document.getElementById("chart");

  if(chart) chart.destroy();

  chart = new Chart(ctx,{
    type:"bar",
    data:{
      labels:labels,
      datasets:[{
        label:"Total Amount",
        data:values
      }]
    }
  });
}
