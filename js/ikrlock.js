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
  if (fileIMS) fileIMS.addEventListener("change", importExcel);

  if (checkAll) {
    checkAll.addEventListener("change", e => {
      document.querySelectorAll(".chk").forEach(c => c.checked = e.target.checked);
    });
  }

  loadServer();
});

// ================= LOADING =================
function showLoading(text = "Loading...") {
  let old = document.getElementById("loadingBox");
  if (old) old.style.display = "flex";

  if (old) {
    old.innerHTML = `
      <div style="
        background:#111;
        padding:25px;
        border-radius:12px;
        min-width:260px;
        text-align:center;
        border:1px solid #444;
      ">
        <div style="font-size:26px;margin-bottom:10px">⏳</div>
        <div id="loadingText">${text}</div>
      </div>
    `;
  }
}

function setLoading(text) {
  let el = document.getElementById("loadingText");
  if (el) el.innerText = text;
}

function hideLoading() {
  let box = document.getElementById("loadingBox");
  if (box) box.style.display = "none";
}

// ================= TAB =================
function showTab(id, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  let tab = document.getElementById(id);
  if (tab) tab.classList.add("active");

  document.querySelectorAll(".menu button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (id === "pivot") generatePivot();
}

// ================= UPLOAD =================
function triggerUpload() {
  let el = document.getElementById("file");
  if (el) el.click();
}

function triggerUploadIMS() {
  let el = document.getElementById("fileIMS");
  if (el) el.click();
}

// ================= IMPORT =================
function importExcel(e) {
  let file = e.target.files[0];
  if (!file) return;

  showLoading("Membaca File...");

  let reader = new FileReader();

  reader.onload = function (evt) {

    setTimeout(() => {

      let wb = XLSX.read(evt.target.result, { type: "binary" });
      dataIKR = [];

      let raw = [];
      let isIMS = false;

      wb.SheetNames.forEach(s => {
        let json = XLSX.utils.sheet_to_json(wb.Sheets[s], {
          defval: "",
          raw: false
        });

        if (json.length) {
          let first = json[0];

          if (
            first["Wo End"] ||
            first["WO END"] ||
            first["City"] ||
            first["city"] ||
            first["Job Name"]
          ) {
            isIMS = true;
          }

          json.forEach(r => raw.push(r));
        }
      });

      // ================= IMS =================
      if (isIMS) {

        let map = {};

        raw.forEach(r => {

          let city = r.City || r.CITY || r.city || "";
          let woEnd = r["Wo End"] || r["WO END"] || "";
          let job = r["Job Name"] || r["JOB NAME"] || "";

          if (!city || !woEnd) return;

          let wo = parseAngka(
            r["Wo Total"] ??
            r["WO TOTAL"] ??
            0
          );

          let date = new Date(woEnd);
          if (isNaN(date)) return;

          let tahun = date.getFullYear();
          let bulan = date.toLocaleString("id-ID", { month: "short" });

          let key = city + "_" + bulan + "_" + job;

          if (!map[key]) {
            map[key] = {
              city, tahun, bulan, job,
              total: 0,
              woTotal: 0,
              listWO: []
            };
          }

          map[key].total++;
          map[key].woTotal += wo;

          map[key].listWO.push({
            wo: r["Wonumber"] || "-",
            ref: r["Reference Code"] || "-",
            quo: r["Quotation Id"] || "-",
            status: r["Status"] || "-"
          });

        });

        Object.values(map).forEach(g => {
          let amount = Math.round(g.woTotal * 1.11);

          dataIKR.push({
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

          dataIKR.push({
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
            remark: "",
            invoice: "",
            note: "",
            done: "NO",
            listWO: []
          });

        });
      }

      render();
      hideLoading();
      alert("Upload sukses : " + dataIKR.length + " data");
      e.target.value = "";

    }, 300);
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function render() {
  let tb = document.querySelector("#tbl tbody");
  if (!tb) return;

  let html = "";

  dataIKR.forEach((d, i) => {
    html += `
    <tr>
      <td>${i + 1}</td>
      <td><input type="checkbox" class="chk"></td>
      <td>${d.region}</td>
      <td>${d.tahun}</td>
      <td>${d.wotype}</td>
      <td>${d.bulan}</td>
      <td><span onclick="showDetail(${i})" style="cursor:pointer;color:cyan">${d.jumlah}</span></td>
      <td>${d.approved}</td>
      <td>${format(d.amount)}</td>
      <td>${format(d.fs)}</td>
      <td style="color:red">${format(d.selisih)}</td>
      <td contenteditable oninput="edit(${i},'remark',this.innerText)">${d.remark}</td>
      <td contenteditable oninput="edit(${i},'invoice',this.innerText)">${d.invoice}</td>
      <td contenteditable oninput="edit(${i},'note',this.innerText)">${d.note}</td>
      <td><input type="checkbox" ${d.done=="YES"?"checked":""} onchange="toggleDone(${i},this.checked)"></td>
    </tr>
    `;
  });

  tb.innerHTML = html;
}

// ================= DELETE + SERVER =================
async function hapusData() {

  let chk = document.querySelectorAll(".chk");

  let ids = [];

  dataIKR = dataIKR.filter((d, i) => {
    if (chk[i].checked) {
      ids.push(String(d.id));
      return false;
    }
    return true;
  });

  render();

  if (ids.length === 0) return;

  try {
    await fetch(SERVER_URL + "/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "IKR",
        ids: ids
      })
    });
  } catch (e) {}
}

// ================= SERVER UPLOAD BERTAHAP =================
async function uploadServer() {

  if (dataIKR.length === 0) {
    alert("Data kosong");
    return;
  }

  showLoading("Upload 0%");

  const chunk = 50;
  let total = Math.ceil(dataIKR.length / chunk);

  try {

    for (let i = 0; i < dataIKR.length; i += chunk) {

      let part = dataIKR.slice(i, i + chunk);

      await fetch(SERVER_URL + "/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "IKR",
          data: part
        })
      });

      let now = Math.ceil((i + chunk) / chunk);
      let persen = Math.min(100, Math.round((now / total) * 100));

      setLoading("Upload " + persen + "%");

      await new Promise(r => setTimeout(r, 150));
    }

    hideLoading();
    alert("Upload berhasil");

  } catch (e) {
    hideLoading();
    alert("Gagal upload");
  }
}

// ================= LOAD =================
async function loadServer() {
  try {

    showLoading("Ambil data server...");

    let r = await fetch(SERVER_URL + "/api/get?type=IKR");
    dataIKR = await r.json();

    if (!Array.isArray(dataIKR)) dataIKR = [];

    render();
    hideLoading();

  } catch (e) {
    hideLoading();
  }
}

// ================= UTIL =================
function parseAngka(v) {
  return parseInt(String(v || 0).replace(/[^0-9]/g, "")) || 0;
}

function format(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

function edit(i, f, v) {
  if (dataIKR[i]) dataIKR[i][f] = v;
}

function toggleDone(i, v) {
  if (dataIKR[i]) dataIKR[i].done = v ? "YES" : "NO";
}
