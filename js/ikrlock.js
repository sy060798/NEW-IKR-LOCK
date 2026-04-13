// ================= GLOBAL =================
let dataIKR = [];
let chart = null;
const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// DETAIL POPUP
let currentDetail = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if (file) file.addEventListener("change", importExcel);
  if (fileIMS) fileIMS.addEventListener("change", importExcelIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll(".chk").forEach(c => {
        c.checked = e.target.checked;
      });
    });
  }

  loadServer();
});

// ================= TAB =================
function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  const el = document.getElementById(id);
  if (el) el.classList.add("active");

  document.querySelectorAll(".menu button").forEach(b => {
    b.classList.remove("active");
  });

  if (btn) btn.classList.add("active");

  if (id === "pivot") generatePivot();
}

// ================= UPLOAD =================
function triggerUpload() {
  document.getElementById("file").click();
}

function triggerUploadIMS() {
  document.getElementById("fileIMS").click();
}

// ================= IMPORT DATA =================
function importExcel(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (evt) {
    const wb = XLSX.read(evt.target.result, { type: "binary" });

    let raw = [];
    let isIMS = false;

    wb.SheetNames.forEach(s => {
      const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
        defval: "",
        raw: false
      });

      if (json.length) {
        const first = json[0];

        if (
          first["Wo End"] ||
          first["WO END"] ||
          first["woEnd"] ||
          first["City"] ||
          first["city"] ||
          first["Job Name"] ||
          first["jobName"]
        ) {
          isIMS = true;
        }

        json.forEach(r => raw.push(r));
      }
    });

   let newData = [];

if (isIMS) {
  let map = {};

  raw.forEach(r => {
    let city = r.City || r.CITY || r.city || "";
    let woEnd = r["Wo End"] || r["WO END"] || r["woEnd"] || "";
    let job = r["Job Name"] || r["JOB NAME"] || r["jobName"] || "";

    if (!city || !woEnd) return;

    let wo = parseAngka(
      r["Wo Total"] ??
      r["WO TOTAL"] ??
      r["WoTotal"] ??
      r["WO_TOTAL"] ??
      r["woTotal"] ?? 0
    );

    let date = new Date(woEnd);
    if (isNaN(date)) return;

    let tahun = date.getFullYear();
    let bulan = date.toLocaleString("id-ID", { month: "short" });

    let key = city + "_" + tahun + "_" + bulan + "_" + job;

    if (!map[key]) {
      map[key] = {
        city, tahun, bulan, job,
        total: 0,
        woTotal: 0,
        listWO: []
      };
    }
    let woNumber = String(r["Wonumber"] || "").trim();

    if (woNumber && !map[key].listWO.find(x => x.wo === woNumber)) {
      map[key].listWO.push({
        wo: woNumber,
        ref: r["Reference Code"] || "-",
        quo: r["Quotation Id"] || "-",
        status: r["Status"] || "-"
      });
    }
  });

  Object.values(map).forEach(g => {
    let amount = Math.round(g.woTotal * 1.11);

    newData.push({
      id: Date.now() + Math.random(),
      type: "IKR",
      region: g.city,
      tahun: g.tahun,
      wotype: g.job,
      bulan: g.bulan,
      jumlah: g.total,
      approved: 0,
      amount,
      fs: 0,
      selisih: amount,
      remark: "",
      invoice: "",
      note: "",
      done: "NO",
      listWO: g.listWO
    });
  });

} else {
  raw.forEach(r => {
    let region = r.REGION || r.Region || "";
    if (!region) return;

    let amount = parseAngka(r.AMOUNT || r.Amount);
    let fs = parseAngka(r["FS AMOUNT"] || r["FS Amount"]);

    newData.push({
      id: Date.now() + Math.random(),
      type: "IKR",
      region,
      tahun: r.TAHUN || "",
      wotype: r["WO TYPE"] || "",
      bulan: r.BULAN || "",
      jumlah: r["JUMLAH WO"] || 0,
      approved: r["WO APPROVED"] || 0,
      amount,
      fs,
      selisih: amount - fs,
      remark: r.REMARK || "",
      invoice: r["NO INVOICE"] || "",
      note: r.NOTE || "",
      done: r.DONE || "NO",
      listWO: []
    });
  });
}

 
    // ================= FORMAT LAMA =================
    else {
      raw.forEach(r => {
        let region = r.REGION || r.Region || "";
        if (!region) return;

        let amount = parseAngka(r.AMOUNT || r.Amount);
        let fs = parseAngka(r["FS AMOUNT"] || r["FS Amount"]);

        newData.push({
          id: Date.now() + Math.random(),
          type: "IKR",
          region: region,
          tahun: r.TAHUN || r.Tahun || "",
          wotype: r["WO TYPE"] || r["Wo Type"] || "",
          bulan: r.BULAN || r.Bulan || "",
          jumlah: r["JUMLAH WO"] || 0,
          approved: r["WO APPROVED"] || 0,
          amount: amount,
          fs: fs,
          selisih: amount - fs,
          remark: r.REMARK || "",
          invoice: r["NO INVOICE"] || "",
          note: r.NOTE || "",
          done: r.DONE || "NO",
          listWO: []
        });
      });
    }

    dataIKR = [...dataIKR, ...newData];

    sortData();
    render();

    alert("Upload sukses : " + newData.length + " data baru");

    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= Popup =================
function showDetail(index) {
  let data = dataIKR[index];

  if (!data) {
    alert("Data tidak ditemukan");
    return;
  }

  currentDetail = data.listWO || [];

  let tb = document.querySelector("#tblDetail tbody");
  let popup = document.getElementById("popupWO");

  if (!tb) {
    alert("Table detail tidak ditemukan (tblDetail)");
    return;
  }

  if (!popup) {
    alert("Popup tidak ditemukan (popupWO)");
    return;
  }

  tb.innerHTML = "";

  if (currentDetail.length === 0) {
    tb.innerHTML = `<tr><td colspan="4">Tidak ada detail WO</td></tr>`;
  } else {
    currentDetail.forEach(d => {
      tb.innerHTML += `
<tr>
<td>${d.wo}</td>
<td>${d.ref}</td>
<td>${d.quo}</td>
<td>${d.status}</td>
</tr>`;
    });
  }

  popup.style.display = "block";
}


// ================= IMPORT IMS (KHUSUS UPDATE) =================
function importExcelIMS(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (evt) {
    const wb = XLSX.read(evt.target.result, { type: "binary" });

    let raw = [];

    wb.SheetNames.forEach(s => {
      const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
        defval: "",
        raw: false
      });
      json.forEach(r => raw.push(r));
    });

   let map = {};
let statusMap = {}; // <-- TAMBAHAN

raw.forEach(r => {
  let city = r.City || r.CITY || r.city || "";
  let woEnd = r["Wo End"] || r["WO END"] || r["woEnd"] || "";
  let job = r["Job Name"] || r["JOB NAME"] || r["jobName"] || "";
  let wo = r["Wonumber"] || r["WONUMBER"] || "-";
  let status = r["Status"] || "-";

  if (!city || !woEnd) return;

  let date = new Date(woEnd);
  if (isNaN(date)) return;

  let tahun = date.getFullYear();
  let bulan = date.toLocaleString("id-ID", { month: "short" });

  let key = city + "_" + tahun + "_" + bulan + "_" + job;

  if (!map[key]) map[key] = 0;
  map[key]++;

  // SIMPAN STATUS TERBARU PER WO
  statusMap[wo] = status;
});

  dataIKR.forEach(d => {
  let key = d.region + "_" + d.tahun + "_" + d.bulan + "_" + d.wotype;

  if (map[key]) {
    d.approved = map[key];
  }

  // 🔥 UPDATE STATUS DI DETAIL WO
  if (d.listWO && d.listWO.length) {
    d.listWO.forEach(x => {
      if (statusMap[x.wo] !== undefined) {
  x.status = statusMap[x.wo];
}
    });
  }
});

    render();

    alert("IMS berhasil update");
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= SORT =================
function sortData() {
  const urutBulan = {
    Jan:1,Feb:2,Mar:3,Apr:4,Mei:5,Jun:6,
    Jul:7,Agu:8,Sep:9,Okt:10,Nov:11,Des:12
  };

  dataIKR.sort((a,b)=>{
    if(a.region!==b.region) return a.region.localeCompare(b.region);
    if(a.tahun!==b.tahun) return a.tahun-b.tahun;
    return (urutBulan[a.bulan]||0)-(urutBulan[b.bulan]||0);
  });
}

// ================= RENDER =================
function render() {
  let tb = document.querySelector("#tbl tbody");
  if (!tb) return;

  tb.innerHTML = "";

  dataIKR.forEach((d,i)=>{
    tb.innerHTML+=`
<tr>
<td>${i+1}</td>
<td><input type="checkbox" class="chk"></td>
<td>${d.region}</td>
<td>${d.tahun}</td>
<td>${d.wotype}</td>
<td>${d.bulan}</td>
<td><span onclick="showDetail(${i})" style="cursor:pointer;color:cyan">${d.jumlah||0}</span></td>
<td>${d.approved||0}</td>
<td>${format(d.amount)}</td>
<td>${format(d.fs)}</td>
<td>${format(d.selisih)}</td>
<td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark||""}</td>
<td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice||""}</td>
<td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note||""}</td>
<td><input type="checkbox" ${d.done==="YES"?"checked":""} onchange="toggleDone(${i},this.checked)"></td>
</tr>`;
  });
}

// ================= UTIL =================
function format(n){
  let num=Number(n)||0;
  return "Rp "+num.toLocaleString("id-ID");
}

function parseAngka(v){
  if(!v) return 0;
  return parseInt(String(v).replace(/[^0-9]/g,""))||0;
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

function closePopup() {
  let popup = document.getElementById("popupWO");
  if (popup) popup.style.display = "none";
}
