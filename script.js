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

// 🔑 Hent innlogget bruker
async function getUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

// 🔽 Last utstyr
async function loadEquipment() {
    const grid = document.getElementById("equipmentGrid");
    if (!grid) return;

    const user = await getUser();
    if (!user) {
        alert("Du må være logget inn");
        return;
    }

    const { data, error } = await supabaseClient
        .from("equipment")
        .select("id_utstyr, tekst, utstyr_nummer, loaned, loaned_by")
        .order("utstyr_nummer");

    if (error) {
        console.error(error);
        return;
    }

    grid.innerHTML = "";

    data.forEach(item => {
        const row = document.createElement("div");
        row.className = "item-row";
        row.dataset.id = item.id_utstyr;

        let statusText = "Ledig";
        let statusClass = "not-selected";

        if (item.loaned) {
            if (item.loaned_by === user.id) {
                statusText = "Lånt av deg";
                statusClass = "selected";
                row.classList.add("active");
            } else {
                statusText = "Utlånt";
                statusClass = "locked";
            }
        }

        row.innerHTML = `
            <div class="cell name">${item.tekst}</div>
            <div class="cell number">${item.utstyr_nummer}</div>
            <div class="cell status ${statusClass}">${statusText}</div>
        `;

        row.addEventListener("click", () => toggleLoan(item, user));
        grid.appendChild(row);
    });
}

// 🔄 Lån / lever inn
async function toggleLoan(item, user) {

    // ❌ Andre kan ikke levere inn
    if (item.loaned && item.loaned_by !== user.id) {
        alert("Dette utstyret er allerede lånt");
        return;
    }

    // 🔄 Lever inn
    if (item.loaned && item.loaned_by === user.id) {
        await supabaseClient
            .from("equipment")
            .update({
                loaned: false,
                loaned_by: null
            })
            .eq("id_utstyr", item.id_utstyr);
    }

    // ✅ Lån
    if (!item.loaned) {
        await supabaseClient
            .from("equipment")
            .update({
                loaned: true,
                loaned_by: user.id
            })
            .eq("id_utstyr", item.id_utstyr);
    }

    loadEquipment();
}

// 🚀 Start
document.addEventListener("DOMContentLoaded", () => {
    loadEquipment();
});

