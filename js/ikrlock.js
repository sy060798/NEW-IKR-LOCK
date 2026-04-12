raw.forEach(r => {

  let region =
    r.REGION ||
    r.Region ||
    r.region ||
    "";

  if (!region) return;

  let amount = parseAngka(
    r.AMOUNT ||
    r.Amount ||
    r.amount
  );

  let fs = parseAngka(
    r["FS AMOUNT"] ||
    r["FS Amount"] ||
    r["fs amount"]
  );

  newData.push({
    id: Date.now() + Math.random(),

    type:"IKR",
    region: region.trim(),

    tahun:
      r.TAHUN ||
      r.Tahun ||
      r.tahun ||
      "",

    wotype:
      r["WO TYPE"] ||
      r["Wo Type"] ||
      r["wo type"] ||
      "",

    bulan:
      r.BULAN ||
      r.Bulan ||
      r.bulan ||
      "",

    jumlah:
      Number(
        r["JUMLAH WO"] ||
        r["Jumlah WO"] ||
        0
      ),

    approved:
      Number(
        r["WO APPROVED"] ||
        r["Wo Approved"] ||
        0
      ),

    amount: amount,
    fs: fs,
    selisih: amount - fs,

    remark: r.REMARK || "",
    invoice: r["NO INVOICE"] || "",
    note: r.NOTE || "",
    done: r.DONE || "NO",

    listWO:[]
  });

});
