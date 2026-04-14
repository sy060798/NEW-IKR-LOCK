if (typeof SERVER_URL === "undefined") {
  var SERVER_URL =
    "https://tracking-server-production-6a12.up.railway.app";
}

let isUploading = false;

// ===============================
// UPLOAD SEMUA DATA
// ===============================
async function uploadServerAll() {

  if (isUploading) return;

  isUploading = true;
  showLoading();

  try {

    setProgress(10, "Memulai koneksi server...");
    await delay(400);

    setProgress(30, "Upload data IKR...");
    await syncIKRServer();

    await delay(400);

    setProgress(65, "Upload data IMS...");
    await syncIMSServer();

    await delay(400);

    setProgress(90, "Finalisasi data...");

    await delay(400);

    setProgress(100, "Sinkronisasi selesai");

    setTimeout(() => {
      hideLoading();
      isUploading = false;
    }, 800);

  } catch (err) {

    console.error(err);

    setProgress(100, "Gagal sinkron");

    setTimeout(() => {
      hideLoading();
      isUploading = false;
    }, 1200);

  }
}

// ===============================
// SYNC IKR
// ===============================
async function syncIKRServer() {

  if (!Array.isArray(dataIKR)) return;

  const res = await fetch(SERVER_URL + "/api/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "IKR",
      data: dataIKR
    })
  });

  if (!res.ok) throw new Error("IKR upload gagal");
}

// ===============================
// SYNC IMS
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
// UTIL
// ===============================
function delay(ms){
  return new Promise(r => setTimeout(r, ms));
}

function showLoading(){
  if (document.getElementById("loadingSync")) return;

  let div = document.createElement("div");
  div.id = "loadingSync";

  div.innerHTML = `
    <div class="loadBox">
      <h3>Sinkronisasi Server</h3>
      <div class="barWrap">
        <div id="barSync"></div>
      </div>
      <div id="txtSync">0%</div>
      <small id="msgSync">Memulai...</small>
    </div>
  `;

  document.body.appendChild(div);
}

function setProgress(persen,msg){

  let bar = document.getElementById("barSync");
  let txt = document.getElementById("txtSync");
  let m   = document.getElementById("msgSync");

  if(bar) bar.style.width = persen + "%";
  if(txt) txt.innerText = persen + "%";
  if(m) m.innerText = msg;
}

function hideLoading(){
  document.getElementById("loadingSync")?.remove();
}

// ===============================
// LOAD DATA
// ===============================
async function loadIKRServer() {
  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IKR");
    const hasil = await res.json();

    if (Array.isArray(hasil)) {
      dataIKR = hasil;
      renderIKR?.();
    }
  } catch (err) {
    console.log(err);
  }
}

async function loadIMSServer() {
  try {
    const res = await fetch(SERVER_URL + "/api/get?type=IMS");
    const hasil = await res.json();

    if (Array.isArray(hasil)) {
      dataIMS = hasil;
      renderIMS?.();
    }
  } catch (err) {
    console.log(err);
  }
}

// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadIKRServer();
  loadIMSServer();
});

window.uploadServerAll = uploadServerAll;
