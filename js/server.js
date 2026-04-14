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


// ===============================
// loaing server
// ===============================

function showLoading(){
  if (document.getElementById("loadingSync")) return;

  let div = document.createElement("div");
  div.id = "loadingSync";

  div.style = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);

    display: flex;
    align-items: center;
    justify-content: center;

    z-index: 999999;

    /* 🔥 FIX CENTER STABIL */
    width: 100vw;
    height: 100vh;
  `;

  div.innerHTML = `
    <div style="
      width: 320px;
      max-width: 90vw;
      background: #fff;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      font-family: Arial;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);

      /* 🔥 tambahan biar tidak geser */
      position: relative;
      margin: auto;
    ">
      <h3 style="margin:0 0 10px;">Sinkronisasi Server</h3>

      <div style="
        width:100%;
        height:10px;
        background:#eee;
        border-radius:10px;
        overflow:hidden;
        margin:15px 0;
      ">
        <div id="barSync" style="
          width:0%;
          height:100%;
          background:#4caf50;
          transition: width 0.3s ease;
        "></div>
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
