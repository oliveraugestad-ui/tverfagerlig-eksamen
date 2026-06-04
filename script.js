const SUPABASE_URL = "https://bhpbssjrnpavisxhfiez.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocGJzc2pybnBhdmlzeGhmaWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjM2NzMsImV4cCI6MjA4MzkzOTY3M30.H49jZC_LHsL2ouMcTRW71cJAvjYYlRNBnG9omdkG0zA";

// Lager en Supabase-klient slik at vi kan bruke databasen og innlogging
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

/* ======================
   LOGIN / REGISTER
====================== */

// Henter knappene fra HTML (hvis de finnes)
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

// Legger til klikk-hendelser på knappene
if (loginBtn) loginBtn.addEventListener("click", login);
if (registerBtn) registerBtn.addEventListener("click", register);

document.addEventListener("DOMContentLoaded", async () => {
    initTheme();

    document.getElementById("themeToggleBtn")?.addEventListener("click", toggleTheme);

    if (document.getElementById("equipmentGrid")) {
        document.getElementById("addBtn")?.addEventListener("click", addEquipment);
        await loadEquipment();
    }
});

function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains("dark-theme") ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
}

function applyTheme(theme) {
    const button = document.getElementById("themeToggleBtn");
    if (theme === "dark") {
        document.body.classList.add("dark-theme");
        button && (button.textContent = "Lys modus");
    } else {
        document.body.classList.remove("dark-theme");
        button && (button.textContent = "Mørk modus");
    }
    localStorage.setItem("theme", theme);
}

// 🔐 Registrer ny bruker 
async function register() {
    // Henter e-post og passord fra input-feltene
    const email = document.getElementById("username")?.value;
    const password = document.getElementById("password")?.value;

    // Sender registreringsinfo til Supabase
    const { error } = await supabaseClient.auth.signUp({ email, password });

    // Viser feilmelding hvis noe går galt
    if (error) return alert(error.message);

    // Sender brukeren videre til hovedsiden
    window.location.href = "main.html";
}

// 🔐 Logg inn eksisterende bruker
async function login() {
    const email = document.getElementById("username")?.value;
    const password = document.getElementById("password")?.value;

    // Forsøker å logge inn brukeren
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) return alert("Feil e-post eller passord");

    window.location.href = "main.html";
}

/* ======================
   HENT BRUKER
====================== */

// Henter den brukeren som er logget inn
async function getUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data.user;
}

/* ======================
   LAST UTSTYR
====================== */

// Laster alt utstyr fra databasen og viser det på nettsiden
async function loadEquipment() {
    const grid = document.getElementById("equipmentGrid");
    if (!grid) return;

    // Henter innlogget bruker
    const user = await getUser();

    // Hvis ingen er logget inn
    if (!user) {
        grid.innerHTML = "<p>Du må være logget inn</p>";
        return;
    }

    // Henter alt utstyr fra databasen
    const { data, error } = await supabaseClient
        .from("equipment")
        .select("*")
        .order("utstyr_nummer");

    if (error) {
        console.error(error);
        grid.innerHTML = "<p>Feil ved lasting</p>";
        return;
    }

    // Tømmer listen før vi legger inn nytt
    grid.innerHTML = "";

    // Går gjennom hvert utstyr
    data.forEach(item => {
        const row = document.createElement("div");
        row.className = "item-row";

        // Standard status
        let statusText = "Ledig";
        let statusClass = "not-selected";

        // Hvis utstyret er lånt
        if (item.loaned) {
            // Hvis det er lånt av innlogget bruker
            if (item.loaned_by === user.id) {
                statusText = "Lånt av deg";
                statusClass = "selected";
            } 
            // Hvis det er lånt av noen andre
            else {
                statusText = "Utlånt";
                statusClass = "locked";
            }
        }

        const borrowerInfo = getBorrowerInfo(item, user);

        // Setter inn HTML for én rad med utstyr
        row.innerHTML = `
            <div class="cell">${item.tekst}</div>
            <div class="cell">${item.utstyr_nummer}</div>
            <div class="cell">${borrowerInfo}</div>
            <div class="cell ${statusClass}">${statusText}</div>
        `;

        // Klikk på raden låner eller leverer utstyret
        row.addEventListener("click", () => toggleLoan(item, user));

        grid.appendChild(row);
    });
}

function getBorrowerInfo(item, user) {
    if (!item.loaned) return "Ledig";

    const when = item.loaned_at ? formatDate(item.loaned_at) : "Nylig lånt";
    if (item.loaned_by === user.id) {
        return `Lånt av deg • ${when}`;
    }

    const borrower = item.loaned_by_email
        ? item.loaned_by_email
        : item.loaned_by
            ? `bruker ${shortId(item.loaned_by)}`
            : "ukjent bruker";
    return `${borrower} • ${when}`;
}

function formatDate(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleDateString("nb-NO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return "Ukjent tidspunkt";
    }
}

function shortId(id) {
    return typeof id === "string" ? id.slice(0, 8) : String(id);
}

/* ======================
   LÅN / LEVER INN
====================== */

// Låner eller leverer inn utstyr
async function toggleLoan(item, user) {

    // Hvis utstyret er lånt av noen andre
    if (item.loaned && item.loaned_by !== user.id) {
        alert("Utstyret er allerede lånt av en annen");
        return;
    }

    const isReturning = item.loaned && item.loaned_by === user.id;
    const payload = isReturning
        ? { loaned: false, loaned_by: null, loaned_at: null }
        : { loaned: true, loaned_by: user.id, loaned_at: new Date().toISOString() };

    const result = await updateEquipment(item.id_utstyr, payload);
    if (result.error) {
        const actionText = isReturning ? "innlevering" : "utlån";
        alert(`Feil ved ${actionText}: ${result.error.message}`);
        return;
    }

    // Laster utstyret på nytt
    loadEquipment();
}

async function updateEquipment(id, payload) {
    let result = await supabaseClient
        .from("equipment")
        .update(payload)
        .eq("id_utstyr", id);

    if (result.error && isColumnNotFoundError(result.error, "loaned_at")) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.loaned_at;

        result = await supabaseClient
            .from("equipment")
            .update(fallbackPayload)
            .eq("id_utstyr", id);
    }

    return result;
}

function isColumnNotFoundError(error, columnName) {
    const message = `${error.message || ""} ${error.details || ""}`;
    return error.code === "42703" || message.toLowerCase().includes(columnName);
}

/* ======================
   LEGG TIL UTSTYR
====================== */

// Legger til nytt utstyr i databasen
async function addEquipment() {
    const name = document.getElementById("equipName").value.trim();
    const number = document.getElementById("equipNumber").value.trim();

    // Sjekker at begge feltene er fylt ut
    if (!name || !number) {
        alert("Fyll ut begge feltene");
        return;
    }

    // Setter inn nytt utstyr i databasen
    const { error } = await supabaseClient
        .from("equipment")
        .insert({
            tekst: name,
            utstyr_nummer: number
        });

    if (error) {
        alert(error.message);
        return;
    }

    // Tømmer input-feltene
    document.getElementById("equipName").value = "";
    document.getElementById("equipNumber").value = "";

    // Oppdaterer listen
    loadEquipment();
}

/* ======================
   START
====================== */

// Kjører når siden er ferdig lastet
document.addEventListener("DOMContentLoaded", () => {
    loadEquipment();

    // Knytter "legg til"-knappen til funksjonen
    const btn = document.getElementById("addBtn");
    if (btn) btn.addEventListener("click", addEquipment);
});