const express = require("express");
const cors = require("cors");

const app = express();

// ================= CONFIG =================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ================= DATABASE RAM =================
let database = {
  IKR: [],
  MYREP: []
};

// ================= ROOT =================
app.get("/", (req, res) => {
  res.send("🚀 Tracking Server Aktif");
});

// ================= GET DATA =================
app.get("/api/get", (req, res) => {
  try {
    let type = String(req.query.type || "").toUpperCase();

    if (!type) type = "IKR";

    if (!database[type]) {
      database[type] = [];
    }

    res.json(database[type]);

  } catch (err) {
    console.log(err);
    res.status(500).json([]);
  }
});

// ================= SAVE DATA =================
app.post("/api/save", (req, res) => {
  try {

    let body = req.body;

    // ================= FORMAT IKR =================
    if (body.type && Array.isArray(body.data)) {

      let type = String(body.type).toUpperCase();

      if (!database[type]) {
        database[type] = [];
      }

      let map = new Map();

      // data lama
      database[type].forEach(d => {
        if (d && d.id) {
          map.set(String(d.id), d);
        }
      });

      // data baru
      body.data.forEach(d => {
        if (!d.id) d.id = Date.now() + Math.random();
        map.set(String(d.id), d);
      });

      database[type] = Array.from(map.values());

      console.log(`✅ SAVE ${type}: ${database[type].length}`);

      return res.json({
        status: "ok",
        type,
        total: database[type].length
      });
    }

    // ================= FORMAT MYREP LAMA =================
    if (Array.isArray(body)) {

      let type = "MYREP";

      if (!database[type]) {
        database[type] = [];
      }

      let map = new Map();

      database[type].forEach(d => {
        if (d && d.id) {
          map.set(String(d.id), d);
        }
      });

      body.forEach(d => {
        if (!d.id) d.id = Date.now() + Math.random();
        map.set(String(d.id), d);
      });

      database[type] = Array.from(map.values());

      console.log(`✅ SAVE MYREP: ${database[type].length}`);

      return res.json({
        status: "ok",
        type,
        total: database[type].length
      });
    }

    res.status(400).json({
      error: "Format tidak valid"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "Gagal save"
    });
  }
});

// ================= DELETE =================
app.post("/api/delete", (req, res) => {
  try {

    let type = String(req.body.type || "IKR").toUpperCase();
    let ids = req.body.ids || [];

    if (!database[type]) database[type] = [];

    database[type] = database[type].filter(
      d => !ids.includes(String(d.id))
    );

    res.json({
      status: "deleted",
      type,
      total: database[type].length
    });

  } catch (err) {
    res.status(500).json({
      error: "Gagal delete"
    });
  }
});

// ================= CLEAR =================
app.post("/api/clear", (req, res) => {
  try {

    let type = String(req.body.type || "IKR").toUpperCase();

    database[type] = [];

    res.json({
      status: "cleared",
      type
    });

  } catch (err) {
    res.status(500).json({
      error: "Gagal clear"
    });
  }
});

// ================= INFO =================
app.get("/api/info", (req, res) => {
  res.json({
    IKR: database.IKR.length,
    MYREP: database.MYREP.length
  });
});

// ================= START =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
