// ================= GLOBAL =================
let dataIKR = [];
let chart = null;
const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";
let currentDetail = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("file");
  const fileIMS = document.getElementById("fileIMS");
  const checkAll = document.getElementById("checkAll");

  if (file) file.addEventListener("change", importExcel);
  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll(".chk").forEach(c => c.checked = e.target.checked);
    });
  }

  loadServer();
});

// ================= LOADING =================
function showLoading(text = "Loading...") {
  const box = document.getElementById("loadingBox");
  const txt = document.getElementById("loadingText");

  if (txt) txt.innerText = text;
  if (box) box.style.display = "flex";
}

function hideLoading() {
  const box = document.getElementById("loadingBox");
  if (box) box.style.display = "none";
}

// ================= TAB =================
function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  const el = document.getElementById(id);
  if (el) el.classList.add("active");

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

// ================= IMPORT DATA UTAMA =================
function importExcel(e) {
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

        json.forEach(r => raw.push(r));
      });

      let newData = [];

      raw.forEach(r => {
        let region =
          r.REGION ||
          r.Region ||
          r.region ||
          "";

        if (!region) return;

        let amount = parseAngka(
          r.AMOUNT ||
          r.Amount ||
          r.amount
        );

        let fs = parseAngka(
          r["FS AMOUNT"] ||
          r["FS Amount"] ||
          r["fs amount"]
        );

        newData.push({
          id: Date.now() + Math.random(),

          type: "IKR",
          region: region.trim(),

          tahun:
            r.TAHUN ||
            r.Tahun ||
            r.tahun ||
            "",

          wotype:
            r["WO TYPE"] ||
            r["Wo Type"] ||
            r["wo type"] ||
            "",

          bulan:
            r.BULAN ||
            r.Bulan ||
            r.bulan ||
            "",

          jumlah: Number(
            r["JUMLAH WO"] ||
            r["Jumlah WO"] ||
            0
          ),

          approved: Number(
            r["WO APPROVED"] ||
            r["Wo Approved"] ||
            0
          ),

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

      dataIKR = [...dataIKR, ...newData];

      sortData();
      render();

      alert("Upload sukses : " + newData.length + " data");
    } catch (err) {
      alert("Gagal baca file");
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

  reader.onload = function (evt) {
    try {
      const wb = XLSX.read(evt.target.result, { type: "binary" });

      let raw = [];

      wb.SheetNames.forEach(s => {
        const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
          defval: "",
          raw: false
        });

        json.forEach(r => raw.push(r));
      });

      let usedInvoice = {};
      let updateCount = 0;

      raw.forEach(r => {
        let pra = r["Pra Invoice Number"] || "";
        let inv = r["Invoice Number"] || "";
        let wo = r["Wonumber"] || r["WONUMBER"] || "";
        let status = r["Status"] || "";
        let fs = parseAngka(r["Invoice Total"]);

        if (!wo) return;

        let key = pra + "_" + inv;
        if (usedInvoice[key]) return;
        usedInvoice[key] = true;

        dataIKR.forEach(d => {
          let found = d.listWO.some(x => String(x.wo).trim() === String(wo).trim());

          if (found) {
            d.approved = Number(d.approved || 0) + 1;
            d.fs = Number(d.fs || 0) + fs;
            d.selisih = Number(d.amount || 0) - Number(d.fs || 0);
            d.invoice = inv;
            d.remark = status;

            updateCount++;
          }
        });
      });

      render();

      alert("IMS sukses update : " + updateCount + " WO");
    } catch (err) {
      alert("Gagal baca file IMS");
    }

    hideLoading();
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= SORT =================
function sortData() {
  const urutBulan = {
    Jan:1, Feb:2, Mar:3, Apr:4, Mei:5, Jun:6,
    Jul:7, Agu:8, Sep:9, Okt:10, Nov:11, Des:12
  };

  dataIKR.sort((a, b) => {
    if (a.region !== b.region) return a.region.localeCompare(b.region);
    if (Number(a.tahun) !== Number(b.tahun)) return Number(a.tahun) - Number(b.tahun);
    if ((urutBulan[a.bulan] || 0) !== (urutBulan[b.bulan] || 0))
      return (urutBulan[a.bulan] || 0) - (urutBulan[b.bulan] || 0);

    return a.wotype.localeCompare(b.wotype);
  });
}

// ================= RENDER =================
function render() {
  let tb = document.querySelector("#tbl tbody");
  if (!tb) return;

  tb.innerHTML = "";

  dataIKR.forEach((d, i) => {
    tb.innerHTML += `
<tr>
<td>${i + 1}</td>
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
<td style="text-align:right;color:${d.selisih < 0 ? 'orange' : d.selisih > 0 ? 'red' : 'lime'}">
${format(d.selisih)}
</td>
<td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark || ""}</td>
<td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice || ""}</td>
<td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note || ""}</td>
<td>
<input type="checkbox"
${d.done === "YES" ? "checked" : ""}
onchange="toggleDone(${i},this.checked)">
</td>
</tr>
`;
  });
}

// ================= DETAIL =================
function showDetail(index) {
  currentDetail = dataIKR[index].listWO || [];

  let tb = document.querySelector("#tblDetail tbody");
  tb.innerHTML = "";

  currentDetail.forEach(d => {
    tb.innerHTML += `
<tr>
<td>${d.wo}</td>
<td>${d.ref || ""}</td>
<td>${d.quo || ""}</td>
<td>${d.status || ""}</td>
</tr>
`;
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
function edit(i, f, v) {
  dataIKR[i][f] = v;
}

function toggleDone(i, v) {
  dataIKR[i].done = v ? "YES" : "NO";
}

// ================= DELETE =================
function hapusData() {
  let c = document.querySelectorAll(".chk");

  dataIKR = dataIKR.filter((d, i) => !c[i].checked);

  render();
}

// ================= DOWNLOAD =================
function download() {
  let ws = XLSX.utils.json_to_sheet(dataIKR);
  let wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "IKCR");
  XLSX.writeFile(wb, "IKCR_LOCK.xlsx");
}

// ================= FORMAT =================
function format(n) {
  let num = Number(n) || 0;

  if (num < 0) return `Rp (${Math.abs(num).toLocaleString("id-ID")})`;

  return `Rp ${num.toLocaleString("id-ID")}`;
}

function parseAngka(v) {
  if (!v) return 0;
  return parseInt(String(v).replace(/[^0-9]/g, "")) || 0;
}

// ================= PIVOT =================
function generatePivot() {
  let map = {};

  dataIKR.forEach(d => {
    if (!map[d.bulan]) map[d.bulan] = 0;
    map[d.bulan] += Number(d.amount || 0);
  });

  let ctx = document.getElementById("chart");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(map),
      datasets: [{
        label: "Total Amount",
        data: Object.values(map)
      }]
    }
  });
}

// ================= SERVER =================
async function uploadServer() {
  if (dataIKR.length === 0) return alert("Data kosong");

  showLoading("Upload Server...");

  try {
    await fetch(SERVER_URL + "/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "IKR",
        data: dataIKR
      })
    });

    alert("Upload berhasil");
  } catch {
    alert("Upload gagal");
  }

  hideLoading();
}

async function loadServer() {
  try {
    let r = await fetch(SERVER_URL + "/api/get?type=IKR");

    dataIKR = await r.json();

    if (!Array.isArray(dataIKR)) dataIKR = [];

    sortData();
    render();
  } catch (e) {
    console.log("Load server gagal");
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
