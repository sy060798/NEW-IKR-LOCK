let dataIKR = [];

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

  renderIKR();
});

// ================= TAB FIX =================
function openTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".toolbar").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));

  document.getElementById("tab-" + id)?.classList.add("active");
  document.getElementById("tb-" + id)?.classList.add("active"); // FIX INI (toolbar kamu pakai tb- bukan toolbar-)

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
      let region = r.City || r.city || r.Region || "";
      let woEnd = r["Wo End"] || "";
      let boq = parseInt(String(r["Boq Total"] || 0).replace(/[^0-9]/g, "")) || 0;

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
          wotype: "",
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
        wo: r.Wonumber || "-",
        status: r.Status || "-",
        amount: boq
      });
    });

    dataIKR = Object.values(map);

    renderIKR();

    e.target.value = "";
    alert("UPLOAD OK");
  };

  reader.readAsBinaryString(file);
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

        <td>
          <span style="color:#00eaff;cursor:pointer"
            onclick="showDetail(${i})">
            ${d.jumlah}
          </span>
        </td>

        <td>${d.approved}</td>
        <td>${formatRp(d.amount)}</td>
        <td>${formatRp(d.fs)}</td>

        <td contenteditable>${d.remark}</td>
        <td contenteditable>${d.invoice}</td>
        <td contenteditable>${d.note}</td>

        <td><input type="checkbox" ${d.done === "YES" ? "checked" : ""}></td>
      </tr>
    `;
  });
}

// ================= POPUP DETAIL (FIX 100%) =================
let popupExportData = [];

function showDetail(i) {
  const d = dataIKR[i];
  if (!d) return alert("Data tidak ditemukan");

  const tb = document.getElementById("popupBody");
  const popup = document.getElementById("popup");

  if (!tb || !popup) {
    alert("Popup belum ada di HTML");
    return;
  }

  tb.innerHTML = "";

  popupExportData = (d.detail || []).map(x => ({
    WO: x.wo,
    Status: x.status,
    Amount: x.amount
  }));

  if (popupExportData.length === 0) {
    tb.innerHTML = `<tr><td colspan="3">Tidak ada data</td></tr>`;
  } else {
    popupExportData.forEach(x => {
      tb.innerHTML += `
        <tr>
          <td>${x.WO}</td>
          <td>${x.Status}</td>
          <td>${formatRp(x.Amount)}</td>
        </tr>
      `;
    });
  }

  popup.style.display = "block";
}

window.showDetail = showDetail;


// ================= excel woditail =================


function exportPopupExcel() {
  if (!popupExportData || popupExportData.length === 0) {
    alert("Tidak ada data untuk export");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(popupExportData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "DETAIL_WO");

  XLSX.writeFile(wb, "DETAIL_WO.xlsx");
}

window.exportPopupExcel = exportPopupExcel;
// ================= UTIL =================
function formatRp(n) {
  return "Rp " + (Number(n || 0).toLocaleString("id-ID"));
}

// ================= HAPUS =================
function hapusIKR() {
  const chk = document.querySelectorAll(".chkIKR");

  dataIKR = dataIKR.filter((_, i) => !chk[i]?.checked);

  renderIKR();
}

window.hapusIKR = hapusIKR;

// ================= STUB BIAR AMAN =================
function downloadIKR() {}
function downloadIMS() {}
function hapusIMS() {}
function generatePivot() {}
function generateStatus() {}
function uploadServerAll() {}

window.closePopup = () => {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
};
