// ================= GLOBAL =================
let dataIKR = [];
let chartPivot = null;

const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  const fileIKR = document.getElementById("fileIKR");
  const fileIMS = document.getElementById("fileIMS");
  const checkIKR = document.getElementById("checkIKR");

  if (fileIKR) fileIKR.addEventListener("change", importIKR);

  if (checkIKR) {
    checkIKR.addEventListener("change", e => {
      document.querySelectorAll(".chkIKR").forEach(c => c.checked = e.target.checked);
    });
  }

  renderIKR();
});

// ================= TAB =================
function openTab(id, btn) {

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".toolbar").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById("tab-" + id)?.classList.add("active");
  document.getElementById("toolbar-" + id)?.classList.add("active");

  if (btn) btn.classList.add("active");
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
      const json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
        defval: "",
        raw: false
      });
      json.forEach(r => raw.push(r));
    });

    let map = {};

    raw.forEach(r => {

      let region = r.City || r.city || r.Region || "";
      let woEnd = r["Wo End"] || "";
      let status = r.Status || "";
      let boq = parseAngka(r["Boq Total"] || 0);

      if (!region || !woEnd) return;

      let dt = new Date(woEnd);
      if (isNaN(dt)) return;

      let tahun = dt.getFullYear();
      let bulan = dt.toLocaleString("id-ID", { month: "short" });

      let key = region + "_" + tahun + "_" + bulan;

      if (!map[key]) {
        map[key] = {
          region,
          tahun,
          bulan,
          wotype: status,
          jumlah: 0,
          approved: 0,
          amount: 0,
          fs: 0,
          remark: "",
          invoice: "",
          note: "",
          done: "NO",
          detail: []
        };
      }

      map[key].jumlah++;
      map[key].amount += boq;

      map[key].detail.push({
        wo: r.Wonumber,
        status,
        amount: boq
      });
    });

    dataIKR = Object.values(map);

    renderIKR();
    alert("DATA IKR berhasil diupload");
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER IKR =================
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
        <td><span class="click" onclick="showDetailIKR(${i})">${d.jumlah}</span></td>
        <td>${d.approved}</td>
        <td>${formatRp(d.amount)}</td>
        <td>${formatRp(d.fs)}</td>
        <td contenteditable oninput="editIKR(${i},'remark',this.innerText)">${d.remark}</td>
        <td contenteditable oninput="editIKR(${i},'invoice',this.innerText)">${d.invoice}</td>
        <td contenteditable oninput="editIKR(${i},'note',this.innerText)">${d.note}</td>
        <td><input type="checkbox" ${d.done==="YES"?"checked":""} onchange="toggleDone(${i},this.checked)"></td>
      </tr>
    `;
  });
}

// ================= DETAIL POPUP =================
function showDetailIKR(i) {

  let d = dataIKR[i];
  if (!d) return;

  let tb = document.getElementById("popupBody");
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

  document.getElementById("popup").style.display = "block";
}

window.showDetailIKR = showDetailIKR;

// ================= DELETE =================
function hapusIKR() {
  const chk = document.querySelectorAll(".chkIKR");

  dataIKR = dataIKR.filter((_, i) => !chk[i]?.checked);

  renderIKR();
}

window.hapusIKR = hapusIKR;

// ================= EXPORT =================
function downloadIKR() {
  let out = dataIKR.map(x => ({
    Region: x.region,
    Tahun: x.tahun,
    Bulan: x.bulan,
    WOType: x.wotype,
    JumlahWO: x.jumlah,
    Amount: x.amount
  }));

  const ws = XLSX.utils.json_to_sheet(out);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "IKR");
  XLSX.writeFile(wb, "IKR.xlsx");
}

window.downloadIKR = downloadIKR;

// ================= UTIL =================
function parseAngka(v) {
  return parseInt(String(v || 0).replace(/[^0-9]/g, "")) || 0;
}

function formatRp(n) {
  return "Rp " + (Number(n) || 0).toLocaleString("id-ID");
}

function editIKR(i, f, v) {
  dataIKR[i][f] = v;
}

function toggleDone(i, v) {
  dataIKR[i].done = v ? "YES" : "NO";
}

// stub
function generatePivot() {}
function generateStatus() {}
function uploadServerAll() {}
function downloadIMS() {}
function hapusIMS() {}
function downloadStatus() {}

window.closePopup = () => {
  document.getElementById("popup").style.display = "none";
};
