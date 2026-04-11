// ================= IMPORT =================
// GANTI HANYA FUNCTION INI
function importExcel(e){
  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){

    let wb = XLSX.read(evt.target.result,{type:'binary'});
    dataIKR = [];

    let raw = [];
    let isIMS = false;

    wb.SheetNames.forEach(s=>{

      let json = XLSX.utils.sheet_to_json(wb.Sheets[s],{
        defval:"",
        raw:false
      });

      if(json.length){

        let first = json[0];

        // 🔥 DETEKSI IMS LEBIH KUAT
        if(
          first["Wo End"] ||
          first["WO END"] ||
          first["City"] ||
          first["Job Name"]
        ){
          isIMS = true;
        }

        json.forEach(r=>raw.push(r));
      }

    });

    // ================= IMS =================
    if(isIMS){

      let map = {};

      raw.forEach(r=>{

        let city = r.City || r.CITY || "";
        let woEnd = r["Wo End"] || r["WO END"] || "";
        let job = r["Job Name"] || r["JOB NAME"] || "";

        if(!city || !woEnd) return;

        let woRaw =
          r["Wo Total"] ??
          r["WO TOTAL"] ??
          r["WoTotal"] ??
          r["WO_TOTAL"] ??
          0;

        let wo = parseAngka(woRaw);

        let date;

        if(typeof woEnd === "string" && woEnd.includes("/")){
          let [d,m,y] = woEnd.split(" ")[0].split("/");
          date = new Date(`${y}-${m}-${d}`);
        }else{
          date = new Date(woEnd);
        }

        if(isNaN(date)) return;

        let tahun = date.getFullYear();
        let bulan = date.toLocaleString("id-ID",{month:"short"});

        let key = city + "_" + bulan + "_" + job;

        if(!map[key]){
          map[key] = {
            city:city,
            tahun:tahun,
            bulan:bulan,
            job:job,
            total:0,
            woTotal:0,
            listWO:[]
          };
        }

        map[key].total++;
        map[key].woTotal += wo;

        map[key].listWO.push({
          wo:r["Wonumber"] || r["WONUMBER"] || "-",
          ref:r["Reference Code"] || "-",
          quo:r["Quotation Id"] || "-",
          status:r["Status"] || "-"
        });

      });

      Object.values(map).forEach(g=>{

        let amount = Math.round(g.woTotal * 1.11);

        dataIKR.push({
          id:Date.now()+Math.random(),
          type:"IKR",
          region:g.city,
          tahun:g.tahun,
          wotype:g.job,
          bulan:g.bulan,
          jumlah:g.total,
          approved:0,
          amount:amount,
          fs:0,
          selisih:amount,
          remark:"",
          invoice:"",
          note:"",
          done:"NO",
          listWO:g.listWO || []
        });

      });

    }

    // ================= FORMAT LAMA =================
    else{

      raw.forEach(r=>{

        let region = r.REGION || r.Region || "";
        if(!region) return;

        let amount = parseAngka(r.AMOUNT || r.Amount);
        let fs = parseAngka(r["FS AMOUNT"] || r["FS Amount"]);

        dataIKR.push({
          id:Date.now()+Math.random(),
          type:"IKR",
          region:region,
          tahun:r.TAHUN || r.Tahun || "",
          wotype:r["WO TYPE"] || r["Wo Type"] || "",
          bulan:r.BULAN || r.Bulan || "",
          jumlah:r["JUMLAH WO"] || 0,
          approved:r["WO APPROVED"] || 0,
          amount:amount,
          fs:fs,
          selisih:amount-fs,
          remark:r.REMARK || "",
          invoice:r["NO INVOICE"] || "",
          note:r.NOTE || "",
          done:r.DONE || "NO",
          listWO:[]
        });

      });

    }

    render();
    alert("Upload sukses : " + dataIKR.length + " data");

  };

  reader.readAsBinaryString(file);
}
