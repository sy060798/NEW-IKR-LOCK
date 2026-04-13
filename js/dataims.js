// ================= GLOBAL =================
let dataIMS = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

  const fileIMS = document.getElementById("fileIMS");

  if (fileIMS) fileIMS.addEventListener("change", importIMS);

  renderIMS();
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
