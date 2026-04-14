// =====================================
// FILE : js/server.js
// FIX sesuai server.js backend
// =====================================

if (typeof SERVER_URL === "undefined") {
  var SERVER_URL =
    "https://tracking-server-production-6a12.up.railway.app";
}


// ===============================
// UPLOAD SEMUA DATA
// ===============================
async function uploadServerAll() {

  try {

    alert("Sinkronisasi server dimulai...");

    await syncIKRServer();
    await syncIMSServer();

    alert("Sinkronisasi selesai");

  } catch (err) {

    console.error(err);
    alert("Sinkronisasi gagal");

  }

}


// ===============================
// SINKRON IKR
// hapus lama lalu save baru
// ===============================
async function syncIKRServer() {

  if (typeof dataIKR === "undefined") return;

  await fetch(
    SERVER_URL + "/api/save",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "IKR",
        data: dataIKR
      })
    }
  );

}


// ===============================
// SINKRON IMS
// ===============================
async function syncIMSServer() {

  if (typeof dataIMS === "undefined") return;

  await fetch(
    SERVER_URL + "/api/save",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "IMS",
        data: dataIMS
      })
    }
  );

}


// ===============================
// AUTO SYNC HAPUS IKR
// ===============================
async function autoSyncIKRDelete() {

  try {
    await syncIKRServer();
  } catch (err) {
    console.log(err);
  }

}


// ===============================
// AUTO SYNC HAPUS IMS
// ===============================
async function autoSyncIMSDelete() {

  try {
    await syncIMSServer();
  } catch (err) {
    console.log(err);
  }

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
// AUTO LOAD SAAT BUKA
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadIKRServer();
  loadIMSServer();
});


window.uploadServerAll = uploadServerAll;
window.autoSyncIKRDelete = autoSyncIKRDelete;
window.autoSyncIMSDelete = autoSyncIMSDelete;
