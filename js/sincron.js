// ================= SYNC IMS -> IKR =================
function syncIMSkeIKR() {
  if (!Array.isArray(dataIMS) || !Array.isArray(dataIKR)) return;

  // 🔥 MAP WO dari IMS
  let mapWO = {};

  dataIMS.forEach(d => {
    (d.detail || []).forEach(x => {
      const wo = String(x.wo || "").trim();
      if (!wo) return;

      // overwrite kalau ada duplicate → ambil latest
      mapWO[wo] = Number(x.total || 0);
    });
  });

  // 🔥 RESET IKR dulu (biar selalu fresh)
  dataIKR.forEach(group => {
    group.approved = 0;
    group.fs = 0;
  });

  // 🔥 SYNC ke IKR
  dataIKR.forEach(group => {
    let counted = new Set(); // anti double WO dalam group

    (group.detail || []).forEach(x => {
      const wo = String(x.wo || "").trim();
      if (!wo) return;

      if (mapWO[wo] !== undefined && !counted.has(wo)) {
        counted.add(wo);

        // ✅ increment approved
        group.approved += 1;

        // ✅ akumulasi FS
        group.fs += mapWO[wo];

        // ✅ update status detail
        x.status = "APPROVED";
      } else {
        x.status = "OPEN";
      }
    });
  });

  console.log("SYNC IMS -> IKR SELESAI");
}

// expose global
window.syncIMSkeIKR = syncIMSkeIKR;
