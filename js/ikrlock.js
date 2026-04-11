// ================= OPTIMASI + LOADING =================

// taruh di paling atas setelah currentDetail
let renderTimer = null;

// ================= LOADING =================
function showLoading(text="Loading..."){
  let old = document.getElementById("loadingBox");
  if(old) old.remove();

  let div = document.createElement("div");
  div.id = "loadingBox";
  div.innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.7);
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
    ">
      <div style="
        background:#111;
        padding:25px;
        border-radius:12px;
        min-width:260px;
        text-align:center;
        color:#fff;
        box-shadow:0 0 20px #000;
      ">
        <div style="font-size:18px;margin-bottom:12px">⏳</div>
        <div id="loadingText">${text}</div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

function setLoading(text){
  let el = document.getElementById("loadingText");
  if(el) el.innerText = text;
}

function hideLoading(){
  let div = document.getElementById("loadingBox");
  if(div) div.remove();
}

// ================= RENDER SUPER RINGAN =================
function render(){

  clearTimeout(renderTimer);

  renderTimer = setTimeout(()=>{

    let tb = document.querySelector("#tbl tbody");
    if(!tb) return;

    let html = "";

    for(let i=0;i<dataIKR.length;i++){

      let d = dataIKR[i];

      html += `
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
    }

    tb.innerHTML = html;

  },50);
}

// ================= IMPORT EXCEL =================
function importExcel(e){

  let file = e.target.files[0];
  if(!file) return;

  showLoading("Membaca file...");

  let reader = new FileReader();

  reader.onload = function(evt){

    setLoading("Memproses data...");

    setTimeout(()=>{

      try{

        let wb = XLSX.read(evt.target.result,{type:'binary'});
        dataIKR = [];

        let raw = [];

        wb.SheetNames.forEach(s=>{
          let json = XLSX.utils.sheet_to_json(wb.Sheets[s],{
            defval:"",
            raw:false
          });
          json.forEach(r=>raw.push(r));
        });

        raw.forEach(r=>{

          let amount = parseAngka(r.AMOUNT || r.Amount);
          let fs = parseAngka(r["FS AMOUNT"] || r["FS Amount"]);

          dataIKR.push({
            id:Date.now()+Math.random(),
            type:"IKR",
            region:r.REGION || r.Region || "",
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
        hideLoading();
        alert("Upload sukses : " + dataIKR.length + " data");

      }catch(err){
        hideLoading();
        alert("File gagal dibaca");
      }

    },100);

  };

  reader.readAsBinaryString(file);
}

// ================= LOAD SERVER =================
async function loadServer(){

  try{

    showLoading("Ambil data server...");

    let r = await fetch(SERVER_URL + "/api/get?type=IKR");
    dataIKR = await r.json();

    render();
    hideLoading();

  }catch(e){
    hideLoading();
    console.log("Gagal load server");
  }
}

// ================= UPLOAD SERVER =================
async function uploadServer(){

  try{

    showLoading("Upload ke server...");

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

    hideLoading();
    alert("Upload berhasil");

  }catch(e){
    hideLoading();
    alert("Gagal upload");
  }
}

// ================= DOWNLOAD =================
function download(){

  showLoading("Membuat file excel...");

  setTimeout(()=>{

    let ws = XLSX.utils.json_to_sheet(dataIKR);
    let wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "IKCR");
    XLSX.writeFile(wb, "IKCR_LOCK.xlsx");

    hideLoading();

  },100);
}

// ================= GLOBAL =================
window.showLoading = showLoading;
window.hideLoading = hideLoading;
