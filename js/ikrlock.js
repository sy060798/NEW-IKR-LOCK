// ================= GLOBAL =================
let dataIKR = [];
let popupExportData = [];
const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";


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

    let map = {};

    raw.forEach(r => {

      let region = normalRegion(r.City || r.city || r.Region || r.region || "");
      let woEnd = r["Wo End"] || r["WO END"] || r["wo end"] || "";

      let boq = parseInt(String(
        r["Boq Total"] || r["BOQ TOTAL"] || r["boq total"] || 0
      ).replace(/[^0-9]/g, "")) || 0;

      let wotype = r["Job Name"] || r["JOB NAME"] || r["job name"] || "";

      if (!region || !woEnd) return;

      let txt = String(woEnd).split(" ")[0];
      let p = txt.split("/");

      if (p.length !== 3) return;

      let hari = parseInt(p[0]);
      let bln = parseInt(p[1]) - 1;
      let thn = parseInt(p[2]);

      let namaBulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
      let bulan = namaBulan[bln];

      let key = region.toUpperCase() + "_" + thn + "_" + bulan + "_" + (wotype || "").toUpperCase();

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

      map[key].amount += boq;

      let wo = String(r.Wonumber || r["WO Number"] || "-").trim();
      let status = r.Status || "-";

      if (!map[key].woSet.has(wo)) {
        map[key].woSet.add(wo);
        map[key].jumlah++;
      }

      map[key].detail.push({ wo, status, amount: boq });
    });

    let hasilBaru = Object.values(map).map(x => {
      delete x.woSet;
      return x;
    });

    let gabung = [...dataIKR, ...hasilBaru];

    let finalMap = {};

    gabung.forEach(d => {
      let key = d.region + "_" + d.tahun + "_" + d.bulan + "_" + d.wotype;

      if (!finalMap[key]) {
        finalMap[key] = { ...d, detail: [...(d.detail || [])] };
      } else {
        finalMap[key].jumlah += Number(d.jumlah || 0);
        finalMap[key].amount += Number(d.amount || 0);
        finalMap[key].fs += Number(d.fs || 0);
        finalMap[key].detail.push(...(d.detail || []));
      }
    });

    dataIKR = Object.values(finalMap);

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

  dataIKR.forEach((d, i) => {
    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><input type="checkbox" class="chkIKR"></td>
        <td>${d.region}</td>
        <td>${d.tahun}</td>
        <td>${d.wotype}</td>
        <td>${d.bulan}</td>
        <td>${d.jumlah}</td>
        <td>${formatRp(d.amount)}</td>
        <td>${formatRp(d.fs)}</td>
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
  const d = dataIKR[i];
  if (!d) return;

  const tb = document.getElementById("popupBody");
  const popup = document.getElementById("popup");

  tb.innerHTML = "";

  (d.detail || []).forEach(x => {
    tb.innerHTML += `
      <tr>
        <td>${x.wo}</td>
        <td>${x.status}</td>
        <td>${formatRp(x.amount)}</td>
      </tr>
    `;
  });

  popup.style.display = "block";
}
window.showDetail = showDetail;


// ================= EXPORT =================
function downloadIKR() {
  const ws = XLSX.utils.json_to_sheet(dataIKR);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "IKR");
  XLSX.writeFile(wb, "DATA_IKR.xlsx");
}
window.downloadIKR = downloadIKR;


// ================= SERVER LOAD =================
async function loadIKRFromServer() {
  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IKR");
    const data = await res.json();

    dataIKR = Array.isArray(data) ? data : [];
    renderIKR();

  } catch (e) {
    console.log("server error");
  }
}
