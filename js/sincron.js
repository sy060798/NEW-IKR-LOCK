// ================= SYNC IMS -> IKR =================
function syncIMSkeIKR() {
  if (!Array.isArray(dataIMS) || !Array.isArray(dataIKR)) return;

  let mapWO = {};

  //  MAP IMS
  dataIMS.forEach(d => {
    (d.detail || []).forEach(x => {
      const wo = String(x.wo || "")
        .trim()
        .toUpperCase();

      if (!wo) return;

      mapWO[wo] = Number(x.total || 0);
    });
  });

  //  RESET
  dataIKR.forEach(group => {
    group.approved = 0;
    group.fs = 0;
  });

  //  SYNC
  dataIKR.forEach(group => {
    let counted = new Set();

    (group.detail || []).forEach(x => {
      const wo = String(x.wo || "")
        .trim()
        .toUpperCase();

      if (!wo) return;

      if (mapWO[wo] !== undefined && !counted.has(wo)) {
        counted.add(wo);

        group.approved += 1;
        group.fs += mapWO[wo];

        x.status = "APPROVED";
      } else {
        x.status = "OPEN";
      }
    });
  });

  console.log("SYNC IMS -> IKR SELESAI");
  renderIKR(); 
}

window.syncIMSkeIKR = syncIMSkeIKR;
