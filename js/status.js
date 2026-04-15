function showStatusWO(jenis, tahun) {

  let list = [];

  dataIKR.forEach(d => {

    if (
      String(d.wotype).trim().toUpperCase() === String(jenis).trim().toUpperCase() &&
      String(d.tahun).trim() === String(tahun).trim()
    ) {

      if (Array.isArray(d.approvedList)) {
        d.approvedList.forEach(x => {
          if (x && (x.pra || x.invoice)) {
            list.push({
              pra: x.pra || "",
              invoice: x.invoice || "",
              name: x.name || x.invoiceName || "",
              total: Number(x.total || x.amount || 0)
            });
          }
        });
      }

    }

  });

  // ================= UNIQUE =================
  let seen = new Set();
  let unique = [];

  list.forEach(x => {

    let key =
      String(x.pra).trim().toUpperCase() +
      "|" +
      String(x.invoice).trim().toUpperCase();

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(x);
    }

  });

  // ================= RENDER =================
  let head = document.querySelector("#tblDetail thead");
  let tb = document.querySelector("#tblDetail tbody");

  head.innerHTML = `
    <tr>
      <th>Pra Invoice Number</th>
      <th>Invoice Number</th>
      <th>Invoice Name</th>
      <th>Invoice Total</th>
    </tr>
  `;

  if (unique.length === 0) {
    tb.innerHTML = `<tr><td colspan="4">Tidak ada data</td></tr>`;
  } else {

    let html = "";

    unique.forEach(x => {
      html += `
        <tr>
          <td>${x.pra}</td>
          <td>${x.invoice}</td>
          <td>${x.name}</td>
          <td>${x.total}</td>
        </tr>
      `;
    });

    tb.innerHTML = html;
  }

  document.getElementById("popupWO").style.display = "block";
}
