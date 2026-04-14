// ================= GLOBAL =================
let dataIMS = [];

const SERVER_URL =
  typeof window.SERVER_URL !== "undefined"
    ? window.SERVER_URL
    : "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  const checkAll = document.getElementById("checkIMS");

  if (!checkAll) return;

  checkAll.addEventListener("change", () => {

    const checked = checkAll.checked;

    document
      .querySelectorAll("#tblIMS tbody input[type='checkbox']")
      .forEach(cb => cb.checked = checked);

  });

});

// ================= IMPORT IMS =================
function importIMS(e) {

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

      let city = r.City || r.city || "";
      let pra = r["Pra Invoice Number"] || "";
      let inv = r["Invoice Number"] || "";
      let job = r["Job Name"] || "";

      if (!city) return;

      let key = city + "_" + pra;

      if (!map[key]) {
        map[key] = {
          city,
          pra,
          inv,
          job,
          jumlah: 0,
          total: 0,
          detail: []
        };
      }

      map[key].jumlah++;
      map[key].total += parseAngka(r["Invoice Total"]);

      map[key].detail.push({
        wo: r.Wonumber || "-",
        status: r.Status || "-",
        amount: parseAngka(r["Invoice Total"])
      });
    });

    dataIMS = Object.values(map);

    renderIMS();

    alert("IMS upload sukses");
    e.target.value = "";
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER IMS =================
function renderIMS() {

  const tb = document.querySelector("#tblIMS tbody");
  if (!tb) return;

  tb.innerHTML = "";

  dataIMS.forEach((d, i) => {

    tb.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td><input type="checkbox"></td>
        <td>${d.city}</td>
        <td>${d.pra}</td>
        <td>${d.inv}</td>
        <td class="click" onclick="showIMS(${i})">${d.jumlah}</td>
        <td>${d.job}</td>
        <td>${formatRp(d.total)}</td>
      </tr>
    `;
  });
}

// ================= POPUP IMS =================
function showIMS(i) {

  let d = dataIMS[i];
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

window.showIMS = showIMS;

// ================= UTIL =================
function parseAngka(v) {
  return parseInt(String(v || 0).replace(/[^0-9]/g, "")) || 0;
}

function formatRp(n) {
  return "Rp " + (Number(n) || 0).toLocaleString("id-ID");
}


// ===============================
// SYNC IMS KE SERVER (PATCH)
// ===============================
async function syncIMSServer() {

  if (!Array.isArray(dataIMS)) return;

  const res = await fetch(SERVER_URL + "/api/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "IMS",
      data: dataIMS
    })
  });

  if (!res.ok) throw new Error("IMS upload gagal");
}



// ===============================
// LOAD IMS DARI SERVER
// ===============================
async function loadIMSServer() {

  try {

    const res = await fetch(SERVER_URL + "/api/get?type=IMS");
    const hasil = await res.json();

    if (Array.isArray(hasil)) {
      dataIMS = hasil;
      renderIMS();
    }

  } catch (err) {
    console.log("Load IMS gagal", err);
  }

}


// ===============================
// AUTO DELETE WO APPROVED > 2 HARI
// ===============================
function autoCleanApprovedWO() {

  const now = new Date();

  function isExpired(dateStr) {
    if (!dateStr) return false;

    let d = new Date(dateStr);
    if (isNaN(d)) return false;

    let diff = now - d;
    let days = diff / (1000 * 60 * 60 * 24);

    return days >= 2;
  }

  // ================= IKR CLEAN =================
  dataIKR = dataIKR.map(group => {

    if (!group.detail) return group;

    group.detail = group.detail.filter(x => {

      // kalau status approved + ada tanggal (kalau belum ada, skip)
      if (String(x.status).toLowerCase().includes("approved")) {

        if (isExpired(x.date || x.approvedDate)) {
          group.jumlah = Math.max(0, group.jumlah - 1);
          return false; // HAPUS WO
        }

      }

      return true;
    });

    return group;
  });

  // ================= IMS CLEAN =================
  dataIMS = dataIMS.map(group => {

    if (!group.detail) return group;

    group.detail = group.detail.filter(x => {

      if (String(x.status).toLowerCase().includes("approved")) {

        if (isExpired(x.date || x.approvedDate)) {
          group.jumlah = Math.max(0, group.jumlah - 1);
          return false;
        }

      }

      return true;
    });

    return group;
  });

  renderIKR?.();
  renderIMS?.();
}


// ===============================
// SYNC IMS → IKR (ONLY APPROVED)
// ===============================
async function mergeIMS_to_IKR() {

  if (!Array.isArray(dataIMS) || !Array.isArray(dataIKR)) return;

  let changedWO = [];

  dataIMS.forEach(ims => {

    (ims.detail || []).forEach(x => {

      const status = String(x.status || "").toLowerCase();

      if (!status.includes("approved")) return;

      const wo = x.wo;
      if (!wo) return;

      dataIKR.forEach(group => {

        (group.detail || []).forEach(d => {

          if (d.wo === wo) {

            d.status = "APPROVED";

            group.approved = (group.approved || 0) + 1;

            group.fs = (group.fs || 0) + (d.amount || 0);

            changedWO.push(wo);
          }

        });

      });

    });

  });

  renderIKR?.();

  try {

    await fetch(SERVER_URL + "/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "IKR",
        data: dataIKR,
        updatedWO: changedWO
      })
    });

  } catch (err) {
    console.log("Server sync gagal", err);
  }
}
  // ================= CHECK ALL IMS =================
  const checkAllIMS = document.getElementById("checkIMS");

  if (checkAllIMS) {
    checkAllIMS.addEventListener("change", e => {

      const checked = e.target.checked;

      document
        .querySelectorAll("#tblIMS tbody input[type='checkbox']")
        .forEach(cb => cb.checked = checked);

    });
  }

});


// ================= HAPUS IMS =================
function hapusIMS() {

  const chk = document.querySelectorAll("#tblIMS tbody input[type='checkbox']");

  dataIMS = dataIMS.filter((_, i) => {
    return !chk[i]?.checked; // kalau dicentang → dihapus
  });

  renderIMS();
}

  // reset check all setelah render
  const checkAll = document.getElementById("checkIMS");
  if (checkAll) checkAll.checked = false;
}
