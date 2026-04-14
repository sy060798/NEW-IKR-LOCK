// =====================================
// FILE : js/server.js
// FULL FIX + LOADING PROGRESS
// =====================================

if (typeof SERVER_URL === "undefined") {
  var SERVER_URL =
    "https://tracking-server-production-6a12.up.railway.app";
}


// ===============================
// UPLOAD SEMUA DATA
// ===============================
async function uploadServerAll() {

  showLoading();

  try {

    setProgress(10, "Memulai koneksi server...");
    await delay(500);

    setProgress(35, "Upload data IKR...");
    await syncIKRServer();
    await delay(500);

    setProgress(70, "Upload data IMS...");
    await syncIMSServer();
    await delay(500);

    setProgress(95, "Finalisasi...");
    await delay(500);

    setProgress(100, "Sinkronisasi selesai");

    setTimeout(() => {
      hideLoading();
    }, 1200);

  } catch (err) {

    console.log(err);

    setProgress(100, "Terjadi kesalahan");

    setTimeout(() => {
      hideLoading();
    }, 1500);

  }

}


// ===============================
// DELAY
// ===============================
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}


// ===============================
// POPUP LOADING
// ===============================
function showLoading() {

  let old = document.getElementById("loadingSync");
  if (old) old.remove();

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


// ===============================
// UPDATE PROGRESS
// ===============================
function setProgress(persen, msg) {

  let bar = document.getElementById("barSync");
  let txt = document.getElementById("txtSync");
  let m = document.getElementById("msgSync");

  if (bar) bar.style.width = persen + "%";
  if (txt) txt.innerText = persen + "%";
  if (m) m.innerText = msg;
}


// ===============================
// CLOSE LOADING
// ===============================
function hideLoading() {
  document.getElementById("loadingSync")?.remove();
}


// ===============================
// SINKRON IKR
// ===============================
async function syncIKRServer() {

  if (typeof dataIKR === "undefined") return;

  await fetch(SERVER_URL + "/api/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "IKR",
      data: dataIKR
    })
  });

}


// ===============================
// SINKRON IMS
// ===============================
async function syncIMSServer() {

  if (typeof dataIMS === "undefined") return;

  await fetch(SERVER_URL + "/api/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "IMS",
      data: dataIMS
    })
  });

}


// ===============================
// AUTO DELETE SYNC
// ===============================
async function autoSyncIKRDelete() {
  try {
    await syncIKRServer();
  } catch (e) {}
}

async function autoSyncIMSDelete() {
  try {
    await syncIMSServer();
  } catch (e) {}
}


// ===============================
// LOAD IKR
// ===============================
async function loadIKRServer() {

  try {

    const res = await fetch(
      SERVER_URL + "/api/get?type=IKR"
    );

    const hasil = await res.json();

    if (Array.isArray(hasil)) {
      dataIKR = hasil;
      if (typeof renderIKR === "function") renderIKR();
    }

  } catch (err) {
    console.log(err);
  }

}


// ===============================
// LOAD IMS
// ===============================
async function loadIMSServer() {

  try {

    const res = await fetch(
      SERVER_URL + "/api/get?type=IMS"
    );

    const hasil = await res.json();

    if (Array.isArray(hasil)) {
      dataIMS = hasil;
      if (typeof renderIMS === "function") renderIMS();
    }

  } catch (err) {
    console.log(err);
  }

}


// ===============================
// AUTO LOAD PAGE
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadIKRServer();
  loadIMSServer();
});


// ===============================
// EXPORT GLOBAL
// ===============================
window.uploadServerAll = uploadServerAll;
window.autoSyncIKRDelete = autoSyncIKRDelete;
window.autoSyncIMSDelete = autoSyncIMSDelete;
