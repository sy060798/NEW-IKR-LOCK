// ================= GLOBAL =================
let dataIKR = [];
let popupExportData = [];

if (typeof SERVER_URL === "undefined") {
  var SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const file = document.getElementById("fileIKR");
  const check = document.getElementById("checkIKR");

  if (file) file.addEventListener("change", importIKR);

  if (check) {
    check.addEventListener("change", e => {
      document.querySelectorAll(".chkIKR").forEach(c => {
        c.checked = e.target.checked;
      });
    });
  }

  loadIKRFromServer();
  renderIKR();
});

// ================= TAB =================
function openTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".toolbar").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById("tab-" + id)?.classList.add("active");
  document.getElementById("tb-" + id)?.classList.add("active");

  btn?.classList.add("active");
}
window.openTab = openTab;

// ================= IMPORT IKR =================
function importIKR(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (evt) {
    const wb = XLSX.read(evt.target.result, { type: "binary" });

    let raw = [];
    wb.SheetNames.forEach(s => {
      XLSX.utils.sheet_to_json(wb.Sheets[s], {
        defval: "",
        raw: false
      }).forEach(r => raw.push(r));
    });

    let existingWO = new Set(
      dataIKR.flatMap(d => (d.detail || []).map(x => x.wo))
    );

    let map = {};

    raw.forEach(r => {
      const ref =
    r["Reference Code"] ||
    r["REFERENCE CODE"] ||
    "-";

  const quo =
    r["Quotation Id"] ||
    r["QUOTATION ID"] ||
    "-";
      
      let region = normalRegion(
        r.City || r.city || r.Region || r.region || ""
      );

      let woEnd =
        r["Wo End"] ||
        r["WO END"] ||
        r["wo end"] ||
        "";

      if (!region || !woEnd) return;

      let boq =
        parseInt(
          String(
            r["Boq Total"] ||
            r["BOQ TOTAL"] ||
            r["boq total"] ||
            0
          ).replace(/[^0-9]/g, "")
        ) || 0;

      let wotype =
        r["Job Name"] ||
        r["JOB NAME"] ||
        r["job name"] ||
        "";

      let txt = String(woEnd).trim().split(" ")[0];
      let p = txt.split("/");
      if (p.length !== 3) return;

      let hari = parseInt(p[0]);
      let bln = parseInt(p[1]) - 1;
      let thn = parseInt(p[2]);

      let dt = new Date(thn, bln, hari);
      if (isNaN(dt)) return;

      let namaBulan = [
        "Jan","Feb","Mar","Apr","Mei","Jun",
        "Jul","Agu","Sep","Okt","Nov","Des"
      ];

      let bulan = namaBulan[bln];

      let key =
        region.trim().toUpperCase() + "_" +
        thn + "_" +
        bulan + "_" +
        (wotype || "").trim().toUpperCase();

      if (!map[key]) {
        map[key] = {
          region,
          tahun: thn,
          bulan,
          wotype,
          jumlah: 0,
          approved: 0,
          amount: 0,
          fs: 0,
          remark: "",
          invoice: "",
          note: "",
          done: "NO",
          detail: [],
          woSet: new Set()
        };
      }

      const wo =
        String(
          r.Wonumber ||
          r["WO Number"] ||
          "-"
        ).trim();

      if (existingWO.has(wo)) return;

      const status = r.Status || "-";

      if (!map[key].woSet.has(wo)) {
        map[key].woSet.add(wo);
        map[key].jumlah++;
      }

      map[key].amount += boq;

      map[key].detail.push({
        wo,
        ref,
        quo,
        status,
        amount: boq
        });

      existingWO.add(wo);
    });

    let hasilBaru = Object.values(map).map(x => {
      delete x.woSet;
      return x;
    });

    let gabung = [...dataIKR, ...hasilBaru];
    let finalMap = {};

    gabung.forEach(d => {
      let key =
        d.region + "_" +
        d.tahun + "_" +
        d.bulan + "_" +
        d.wotype;

      if (!finalMap[key]) {
        finalMap[key] = {
          ...d,
          detail: [...(d.detail || [])]
        };
      } else {
        finalMap[key].jumlah += Number(d.jumlah || 0);
        finalMap[key].approved += Number(d.approved || 0);
        finalMap[key].amount += Number(d.amount || 0);
        finalMap[key].fs += Number(d.fs || 0);

        finalMap[key].detail.push(...(d.detail || []));
      }
    });

    dataIKR = Object.values(finalMap);

    recalcApprovedValues();
    renderIKR();

    e.target.value = "";
    alert("UPLOAD OK");
  };

  reader.readAsBinaryString(file);
}



// ================= NORMAL REGION =================
function normalRegion(txt) {
  let r = String(txt || "").toLowerCase().trim();

  const map = {
    "bks": "bekasi",
    "bdg": "bandung",
    "sby": "surabaya",
    "yk": "jogja"
  };

  if (map[r]) r = map[r];

  return r.replace(/\b\w/g, s => s.toUpperCase());
}

// ================= RENDER =================
function renderIKR() {
  const tb = document.querySelector("#tblIKR tbody");
  if (!tb) return;

  tb.innerHTML = "";

  const sorted = [...dataIKR].sort((a, b) => {
    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;

    const bulanA = (a.bulan || "").localeCompare(b.bulan || "");
    if (bulanA !== 0) return bulanA;

    return (a.wotype || "").localeCompare(b.wotype || "");
  });

  sorted.forEach((d, i) => {
    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><input type="checkbox" class="chkIKR"></td>
        <td>${d.region}</td>
        <td>${d.tahun}</td>
        <td>${d.wotype}</td>
        <td>${d.bulan}</td>
        <td>
          <span onclick="showDetail(${i})"
            style="cursor:pointer;font-weight:bold">
            ${d.jumlah}
          </span>
        </td>
        <td>${d.approved || 0}</td>
        <td>${formatRp(d.amount)}</td>
        <td>${formatRp(d.fs)}</td>
        <td contenteditable>${d.remark || ""}</td>
        <td contenteditable>${d.invoice || ""}</td>
        <td contenteditable>${d.note || ""}</td>
        <td>
          <input type="checkbox" ${d.done === "YES" ? "checked" : ""}>
        </td>
      </tr>
    `;
  });
}

// ================= FORMAT =================
function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

// ================= DELETE =================
function hapusIKR() {
  const chk = document.querySelectorAll(".chkIKR");
  dataIKR = dataIKR.filter((_, i) => !chk[i]?.checked);
  renderIKR();
}
window.hapusIKR = hapusIKR;

// ================= DETAIL =================
function showDetail(i) {
  const sorted = [...dataIKR].sort((a, b) => {
    const regionA = (a.region || "").localeCompare(b.region || "");
    if (regionA !== 0) return regionA;

    const tahunA = (a.tahun || 0) - (b.tahun || 0);
    if (tahunA !== 0) return tahunA;

    const bulanA = (a.bulan || "").localeCompare(b.bulan || "");
    if (bulanA !== 0) return bulanA;

    return (a.wotype || "").localeCompare(b.wotype || "");
  });

  const d = sorted[i];
  if (!d) return alert("Data tidak ditemukan");

  const tb = document.getElementById("popupBody");
  tb.innerHTML = "";

  popupExportData = [];

(d.detail || []).forEach(x => {
  tb.innerHTML += `
    <tr>
      <td>${x.wo}</td>
      <td>${x.ref || "-"}</td>
      <td>${x.quo || "-"}</td>
      <td>${x.status}</td>
      <td>${formatRp(x.amount)}</td>
    </tr>
  `;

  popupExportData.push({
    WO: x.wo,
    Reference: x.ref,
    Quotation: x.quo,
    Status: x.status,
    Amount: x.amount
  });
});

document.getElementById("popup").style.display = "block";

} 

window.closePopup = () => {
  document.getElementById("popup").style.display = "none";
};

// ================= EXPORT DETAIL =================
function exportPopupExcel() {
  const ws = XLSX.utils.json_to_sheet(popupExportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DETAIL_WO");
  XLSX.writeFile(wb, "DETAIL_WO.xlsx");
}

// ================= DOWNLOAD =================
function downloadIKR() {
  if (!dataIKR.length) return alert("Tidak ada data");

  const ws = XLSX.utils.json_to_sheet(dataIKR);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DATA IKR");
  XLSX.writeFile(wb, "DATA_IKR_LOCK.xlsx");
}
window.downloadIKR = downloadIKR;

// ================= SERVER =================
async function loadIKRFromServer() {
  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IKR");
    const data = await res.json();

    dataIKR = Array.isArray(data) ? data : [];

    recalcApprovedValues();
    renderIKR();
  } catch (err) {
    console.log("server error");
  }
}

// ================= RECALC =================
function recalcApprovedValues() {
  if (!Array.isArray(dataIKR)) return;

  dataIKR.forEach(group => {
    let approvedSet = new Set();
    let fsTotal = 0;

    (group.detail || []).forEach(d => {
      if ((d.status || "").toLowerCase().includes("approved")) {
        approvedSet.add(d.wo);
        fsTotal += Number(d.amount || 0);
      }
    });

    group.approved = approvedSet.size;
    group.fs = fsTotal;
  });
}
