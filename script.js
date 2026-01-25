const SUPABASE_URL = "https://bhpbssjrnpavisxhfiez.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocGJzc2pybnBhdmlzeGhmaWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjM2NzMsImV4cCI6MjA4MzkzOTY3M30.H49jZC_LHsL2ouMcTRW71cJAvjYYlRNBnG9omdkG0zA";

// Lag Supabase-klient
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Knapper (sjekk at de finnes på siden før vi legger til event listeners)
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
if (loginBtn) loginBtn.addEventListener("click", login);
if (registerBtn) registerBtn.addEventListener("click", register);

// REGISTRER
async function register() {
    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    window.location.href = "main.html";
}

// LOGG INN
async function login() {
    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert("Feil e-post eller passord");
        return;
    }

    window.location.href = "main.html";
}


// 🔽 Last utstyr fra Supabase
async function loadEquipment() {
    const grid = document.getElementById("equipmentGrid");

    if (!grid) {
        console.error("Fant ikke equipmentGrid");
        return;
    }

    const { data, error } = await supabaseClient
        .from("equipment")
        .select("*")
        .order("item_number");

    if (error) {
        console.error("Supabase-feil:", error);
        return;
    }

    grid.innerHTML = "";

    data.forEach(item => {
        const row = document.createElement("div");
        row.className = "item-row";

        row.innerHTML = `
            <div class="cell name">${item.name}</div>
            <div class="cell number">${item.item_number}</div>
            <div class="cell status not-selected">Ikke valgt</div>
        `;

        row.addEventListener("click", () => toggle(row));
        grid.appendChild(row);
    });
}

// ✔️ Valgt / ikke valgt
function toggle(row) {
    const status = row.querySelector(".status");

    row.classList.toggle("active");

    if (row.classList.contains("active")) {
        status.textContent = "Valgt";
        status.classList.remove("not-selected");
        status.classList.add("selected");
    } else {
        status.textContent = "Ikke valgt";
        status.classList.remove("selected");
        status.classList.add("not-selected");
    }
}

// 🚀 Kjør når siden er lastet
document.addEventListener("DOMContentLoaded", () => {
    loadEquipment();
});
