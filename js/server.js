// =====================================
// FILE : js/server.js
// AUTO SYNC DELETE + UPLOAD
// =====================================

const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

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
// hapus lama lalu upload baru
// ===============================
async function syncIKRServer() {

  if (typeof dataIKR === "undefined") return;

  // hapus semua data lama
  await fetch(SERVER_URL + "/ikr", {
    method: "DELETE"
  });

  // upload data baru
  await fetch(SERVER_URL + "/ikr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dataIKR)
  });

}

// ===============================
// SINKRON IMS
// hapus lama lalu upload baru
// ===============================
async function syncIMSServer() {

  if (typeof dataIMS === "undefined") return;

  // hapus lama
  await fetch(SERVER_URL + "/ims", {
    method: "DELETE"
  });

  // upload baru
  await fetch(SERVER_URL + "/ims", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dataIMS)
  });

}

// ===============================
// AUTO SYNC SAAT HAPUS IKR
// ===============================
async function autoSyncIKRDelete() {
  try {
    await syncIKRServer();
  } catch (e) {
    console.log(e);
  }
}

// ===============================
// AUTO SYNC SAAT HAPUS IMS
// ===============================
async function autoSyncIMSDelete() {
  try {
    await syncIMSServer();
  } catch (e) {
    console.log(e);
  }
}

window.uploadServerAll = uploadServerAll;
window.autoSyncIKRDelete = autoSyncIKRDelete;
window.autoSyncIMSDelete = autoSyncIMSDelete;
