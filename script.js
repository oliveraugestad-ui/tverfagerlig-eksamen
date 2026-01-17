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

let grid = null;

//  Hent utstyr fra Supabase
async function loadEquipment() {
    grid = document.getElementById("equipmentGrid");
    
    if (!grid) {
        console.error("Feil: equipmentGrid-elementet finnes ikke");
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
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
            <h3>${item.name}</h3>
            <small>Varenr: ${item.item_number}</small>

            <ul class="status-list">
                <li class="not-selected">Ikke valgt</li>
            </ul>
        `;

        div.addEventListener("click", () => toggle(div));
        grid.appendChild(div);
    });
}

// ✔️ Valgt / ikke valgt
function toggle(element) {
    const li = element.querySelector("li");

    element.classList.toggle("active");

    if (element.classList.contains("active")) {
        li.textContent = "Valgt";
        li.className = "selected";
    } else {
        li.textContent = "Ikke valgt";
        li.className = "not-selected";
    }
}

// 🚀 Start
loadEquipment();
