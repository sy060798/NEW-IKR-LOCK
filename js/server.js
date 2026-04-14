// =====================================
// FILE : js/server.js
// =====================================

const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// ===============================
// UPLOAD ALL DATA
// ===============================
async function uploadServerAll() {

  try {

    if (!confirm("Upload semua data ke server?")) return;

    alert("Proses upload dimulai...");

    await uploadIKRServer();
    await uploadIMSServer();

    alert("Upload selesai");

  } catch (err) {
    console.error(err);
    alert("Upload gagal");
  }

}

// ===============================
// UPLOAD DATA IKR
// ===============================
async function uploadIKRServer() {

  if (typeof dataIKR === "undefined" || !dataIKR.length) {
    return;
  }

  const res = await fetch(SERVER_URL + "/ikr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dataIKR)
  });

  if (!res.ok) {
    throw new Error("Upload IKR gagal");
  }

}

// ===============================
// UPLOAD DATA IMS
// ===============================
async function uploadIMSServer() {

  if (typeof dataIMS === "undefined" || !dataIMS.length) {
    return;
  }

  const res = await fetch(SERVER_URL + "/ims", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dataIMS)
  });

  if (!res.ok) {
    throw new Error("Upload IMS gagal");
  }

}

window.uploadServerAll = uploadServerAll;
