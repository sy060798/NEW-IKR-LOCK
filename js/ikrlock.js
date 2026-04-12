// ================= GLOBAL =================
let dataIKR = [];
let chart = null;
const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// DETAIL POPUP
let currentDetail = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("file");
  const checkAll = document.getElementById("checkAll");

  if (file) file.addEventListener("change", importExcel);

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

// ================= IMPORT =================
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

    // ================= IMS =================
    if (isIMS) {
      let map = {};

      raw.forEach(r => {
        let city = r.City || r.CITY || r.city || "";
        let woEnd = r["Wo End"] || r["WO END"] || r["woEnd"] || "";
        let job = r["Job Name"] || r["JOB NAME"] || r["jobName"] || "";

        if (!city || !woEnd) return;

        let woRaw =
          r["Wo Total"] ??
          r["WO TOTAL"] ??
          r["WoTotal"] ??
          r["WO_TOTAL"] ??
          r["woTotal"] ??
          0;

        let wo = parseAngka(woRaw);

        let date;

        if (typeof woEnd === "number") {
          date = new Date((woEnd - 25569) * 86400 * 1000);
        } else if (typeof woEnd === "string" && woEnd.includes("/")) {
          let [d, m, y] = woEnd.split(" ")[0].split("/");
          date = new Date(`${y}-${m}-${d}`);
        } else if (typeof woEnd === "string" && woEnd.includes("-")) {
          date = new Date(woEnd.replace(" ", "T"));
        } else {
          date = new Date(woEnd);
        }

        if (isNaN(date)) return;

        let tahun = date.getFullYear();
        let bulan = date.toLocaleString("id-ID", { month: "short" });

        let key = city + "_" + tahun + "_" + bulan + "_" + job;

        if (!map[key]) {
          map[key] = {
            city,
            tahun,
            bulan,
            job,
            total: 0,
            woTotal: 0,
            listWO: []
          };
        }

        map[key].total++;
        map[key].woTotal += wo;

        map[key].listWO.push({
          wo: r["Wonumber"] || r["WONUMBER"] || r["wonumber"] || "-",
          ref: r["Reference Code"] || r["referenceCode"] || "-",
          quo: r["Quotation Id"] || r["quotationId"] || "-",
          status: r["Status"] || r["status"] || "-"
        });
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
          amount: amount,
          fs: 0,
          selisih: amount,
          remark: "",
          invoice: "",
          note: "",
          done: "NO",
          listWO: g.listWO || []
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

    // ================= GABUNG DATA =================
    dataIKR = [...dataIKR, ...newData];

    sortData();
    render();

    alert("Upload sukses : " + newData.length + " data baru");

    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= SORT =================
function sortData() {
  const urutBulan = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    Mei: 5,
    Jun: 6,
    Jul: 7,
    Agu: 8,
    Sep: 9,
    Okt: 10,
    Nov: 11,
    Des: 12
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
<span onclick="showDetail(${i})"
style="cursor:pointer;color:cyan;text-decoration:underline">
${d.jumlah || 0}
</span>
</td>
<td>${d.approved || 0}</td>
<td style="text-align:right">${format(d.amount)}</td>
<td style="text-align:right">${format(d.fs)}</td>
<td style="text-align:right;color:${d.selisih < 0 ? "orange" : d.selisih > 0 ? "red" : "lime"}">
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
  let data = dataIKR[index];
  currentDetail = data.listWO || [];

  let tb = document.querySelector("#tblDetail tbody");
  if (!tb) return;

  tb.innerHTML = "";

  currentDetail.forEach(d => {
    tb.innerHTML += `
<tr>
<td>${d.wo}</td>
<td>${d.ref}</td>
<td>${d.quo}</td>
<td>${d.status}</td>
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
async function hapusData() {
  let c = document.querySelectorAll(".chk");
  let ids = [];

  dataIKR = dataIKR.filter((d, i) => {
    if (c[i].checked) {
      ids.push(String(d.id));
      return false;
    }
    return true;
  });

  render();

  try {
    await fetch(SERVER_URL + "/api/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "IKR",
        ids: ids
      })
    });
  } catch (e) {}
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

  if (num < 0) {
    return `Rp (${Math.abs(num).toLocaleString("id-ID")})`;
  }

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
    map[d.bulan] += Number(d.amount) || 0;
  });

  let ctx = document.getElementById("chart");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(map),
      datasets: [
        {
          label: "Total Amount",
          data: Object.values(map)
        }
      ]
    }
  });
}

// ================= SERVER =================
async function uploadServer() {
  if (dataIKR.length === 0) {
    alert("Data kosong");
    return;
  }

  let chunkSize = 100;

  try {
    for (let i = 0; i < dataIKR.length; i += chunkSize) {
      let chunk = dataIKR.slice(i, i + chunkSize);

      await fetch(SERVER_URL + "/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "IKR",
          data: chunk
        })
      });

      console.log("Upload batch", (i / chunkSize) + 1);
    }

    alert("Upload berhasil");
  } catch (e) {
    alert("Gagal upload");
  }
}

async function loadServer() {
  try {
    let r = await fetch(SERVER_URL + "/api/get?type=IKR");

    dataIKR = await r.json();

    if (!Array.isArray(dataIKR)) dataIKR = [];

    sortData();
    render();
  } catch (e) {
    console.log("Gagal load server");
  }
}

// ================= GLOBAL =================
window.triggerUpload = triggerUpload;
window.download = download;
window.hapusData = hapusData;
window.generatePivot = generatePivot;
window.uploadServer = uploadServer;
window.showTab = showTab;
window.showDetail = showDetail;
window.closePopup = closePopup;
window.downloadDetail = downloadDetail;
