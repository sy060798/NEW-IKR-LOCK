// ================= GLOBAL =================
let dataIKR = [];
let editId = null;

// ================= INIT ==================
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    renderTable();
});

// ================= SIMPAN DATA =================
function simpanData() {
    const wo = document.getElementById("wo").value;
    const area = document.getElementById("area").value;
    const tanggal = document.getElementById("tanggal").value;
    const status = document.getElementById("status").value;

    if (!wo || !area) {
        alert("WO & Area wajib diisi!");
        return;
    }

    if (editId !== null) {
        dataIKR = dataIKR.map(item => {
            if (item.id === editId) {
                return { ...item, wo, area, tanggal, status };
            }
            return item;
        });
        editId = null;
    } else {
        dataIKR.push({
            id: Date.now(),
            wo,
            area,
            tanggal,
            status
        });
    }

    saveToStorage();
    resetForm();
    renderTable();
}

// ================= RENDER =================
function renderTable(filter = "") {
    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    let filtered = dataIKR.filter(item =>
        item.wo.toLowerCase().includes(filter.toLowerCase()) ||
        item.area.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach((item, i) => {
        tbody.innerHTML += `
        <tr>
            <td>${i + 1}</td>
            <td>${item.wo}</td>
            <td>${item.area}</td>
            <td>${item.tanggal}</td>
            <td>${item.status}</td>
            <td>
                <button onclick="editData(${item.id})">Edit</button>
                <button onclick="hapusData(${item.id})">Hapus</button>
            </td>
        </tr>`;
    });
}

// ================= EDIT =================
function editData(id) {
    const item = dataIKR.find(d => d.id === id);

    document.getElementById("wo").value = item.wo;
    document.getElementById("area").value = item.area;
    document.getElementById("tanggal").value = item.tanggal;
    document.getElementById("status").value = item.status;

    editId = id;
}

// ================= HAPUS =================
function hapusData(id) {
    if (confirm("Yakin hapus data?")) {
        dataIKR = dataIKR.filter(d => d.id !== id);
        saveToStorage();
        renderTable();
    }
}

// ================= SEARCH =================
function searchData() {
    const keyword = document.getElementById("search").value;
    renderTable(keyword);
}

// ================= STORAGE =================
function saveToStorage() {
    localStorage.setItem("IKRLOCK_DATA", JSON.stringify(dataIKR));
}

function loadData() {
    const data = localStorage.getItem("IKRLOCK_DATA");
    if (data) dataIKR = JSON.parse(data);
}

// ================= RESET =================
function resetForm() {
    document.getElementById("wo").value = "";
    document.getElementById("area").value = "";
    document.getElementById("tanggal").value = "";
    document.getElementById("status").value = "";
}
