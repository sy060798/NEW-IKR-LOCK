// ================= SYNC IMS -> IKR =================
function syncIMSkeIKR() {
  if (!window.dataIMS || !window.dataIKR) return;

  // kumpulin semua WO dari IMS
  let mapWO = {};

  dataIMS.forEach(d => {
    (d.detail || []).forEach(x => {
      mapWO[x.wo] = x.total;
    });
  });

  // update ke IKR
  dataIKR.forEach(row => {
    let wo = (row.wo || "").toString().trim();

    if (mapWO[wo]) {
      row.approved = "APPROVED";
      row.fs_amount = mapWO[wo];
    }
  });

  console.log("SYNC IMS -> IKR SELESAI");
}
window.syncIMSkeIKR = syncIMSkeIKR;
