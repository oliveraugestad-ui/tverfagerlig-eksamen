const SUPABASE_URL = "https://bhpbssjrnpavisxhfiez.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocGJzc2pybnBhdmlzeGhmaWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjM2NzMsImV4cCI6MjA4MzkzOTY3M30.H49jZC_LHsL2ouMcTRW71cJAvjYYlRNBnG9omdkG0zA";

// Lag Supabase-klient
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ======================
   LOGIN / REGISTER
====================== */

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

if (loginBtn) loginBtn.addEventListener("click", login);
if (registerBtn) registerBtn.addEventListener("click", register);

async function register() {
    const email = document.getElementById("username")?.value;
    const password = document.getElementById("password")?.value;

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

async function login() {
    const email = document.getElementById("username")?.value;
    const password = document.getElementById("password")?.value;

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

/* ======================
   UTSTYR
====================== */

// Hent innlogget bruker
async function getUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data.user;
}

// Last utstyr
async function loadEquipment() {
    const grid = document.getElementById("equipmentGrid");
    if (!grid) return;

    const user = await getUser();

    if (!user) {
        grid.innerHTML = "<p>Du må være logget inn</p>";
        return;
    }

    const { data, error } = await supabaseClient
        .from("equipment")
        .select("*")
        .order("utstyr_nummer");

    if (error) {
        console.error(error);
        grid.innerHTML = "<p>Kunne ikke laste utstyr</p>";
        return;
    }

    grid.innerHTML = "";

    data.forEach(item => {
        const row = document.createElement("div");
        row.className = "item-row";

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

        row.addEventListener("click", () => toggleLoan(item.id_utstyr, user));
        grid.appendChild(row);
    });
}

// Lån / lever inn
async function toggleLoan(id, user) {

    const { data: item } = await supabaseClient
        .from("equipment")
        .select("*")
        .eq("id_utstyr", id)
        .single();

    if (item.loaned && item.loaned_by !== user.id) {
        alert("Utstyret er allerede lånt");
        return;
    }

    if (item.loaned && item.loaned_by === user.id) {
        await supabaseClient
            .from("equipment")
            .update({ loaned: false, loaned_by: null })
            .eq("id_utstyr", id);
    } else {
        await supabaseClient
            .from("equipment")
            .update({ loaned: true, loaned_by: user.id })
            .eq("id_utstyr", id);
    }

    loadEquipment();
}

/* ======================
   START
====================== */

document.addEventListener("DOMContentLoaded", () => {
    loadEquipment();
});