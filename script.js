// ==========================================
// SUPABASE OPPSETT
// ==========================================

const SUPABASE_URL = "https://bhpbssjrnpavisxhfiez.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocGJzc2pybnBhdmlzeGhmaWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjM2NzMsImV4cCI6MjA4MzkzOTY3M30.H49jZC_LHsL2ouMcTRW71cJAvjYYlRNBnG9omdkG0zA";

// Lager en forbindelse til Supabase-prosjektet.
// Denne klienten brukes til autentisering (innlogging)
// og til å hente/oppdatere data i databasen.
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
// `supabaseClient` brukes gjennom hele filen for å snakke med Supabase API.

/* ======================
   LOGIN / REGISTER
====================== */

// Henter innloggingsknappen fra HTML-siden.
const loginBtn = document.getElementById("loginBtn");

// Henter registreringsknappen fra HTML-siden.
const registerBtn = document.getElementById("registerBtn");

// Sjekker at knappene faktisk finnes før vi legger til event listeners.
// Dette hindrer feil dersom samme JavaScript-fil brukes på flere sider.
if (loginBtn) loginBtn.addEventListener("click", login);
if (registerBtn) registerBtn.addEventListener("click", register);

// Kjøres når HTML-dokumentet er ferdig lastet.
// Da er alle elementene på siden tilgjengelige.
document.addEventListener("DOMContentLoaded", async () => {

    // Leser lagret tema og bruker det.
    initTheme();

    // Knytter tema-knappen til funksjonen som bytter tema.
    document.getElementById("themeToggleBtn")
        ?.addEventListener("click", toggleTheme);

    // Hvis vi er på siden som viser utstyr,
    // kobler vi til "legg til"-knappen og laster inn utstyret.
    if (document.getElementById("equipmentGrid")) {

        document.getElementById("addBtn")
            ?.addEventListener("click", addEquipment);

        // Last og vis utstyr, og oppdater utlånstidene jevnlig.
        await loadEquipment();
        refreshLoanDurations();
        // Oppdater hver 30 sekund for å holde tidene korrekte.
        setInterval(refreshLoanDurations, 30000);
    }
});

// ==========================================
// TEMA (LYS / MØRK MODUS)
// ==========================================

// Leser lagret tema fra nettleserens localStorage.
// Hvis ingen verdi finnes brukes lys modus som standard.
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
}

// Bytter mellom lys og mørk modus.
function toggleTheme() {

    // Sjekker hvilket tema som brukes nå.
    const currentTheme =
        document.body.classList.contains("dark-theme")
            ? "dark"
            : "light";

    // Velger motsatt tema.
    const nextTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";

    applyTheme(nextTheme);
}

// Oppdaterer nettsidens utseende basert på valgt tema.
function applyTheme(theme) {

    const button = document.getElementById("themeToggleBtn");

    if (theme === "dark") {

        // Legger til CSS-klassen som aktiverer mørk modus.
        document.body.classList.add("dark-theme");

        // Oppdaterer knappeteksten.
        if (button) button.textContent = "Lys modus";

    } else {

        // Fjerner mørk modus.
        document.body.classList.remove("dark-theme");

        // Oppdaterer knappeteksten.
        if (button) button.textContent = "Mørk modus";
    }

    // Lagrer brukerens valg slik at temaet huskes.
    localStorage.setItem("theme", theme);
}

/* ======================
   REGISTRERING
====================== */

// Registrerer en ny bruker i Supabase.
async function register() {

    // Henter verdiene brukeren har skrevet inn.
    const email =
        document.getElementById("username")?.value;

    const password =
        document.getElementById("password")?.value;

    // Sender registreringsinformasjonen til Supabase.
    const { error } =
        await supabaseClient.auth.signUp({
            email,
            password
        });

    // Hvis noe gikk galt vises feilmeldingen.
    if (error) {
        alert(error.message);
        return;
    }

    // Sender brukeren videre til hovedsiden.
    window.location.href = "main.html";
}

/* ======================
   LOGIN
====================== */

// Logger inn en eksisterende bruker.
async function login() {

    // Henter e-post og passord fra skjemaet.
    const email =
        document.getElementById("username")?.value;

    const password =
        document.getElementById("password")?.value;

    // Forsøker innlogging mot Supabase.
    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    // Hvis innlogging mislykkes.
    if (error) {
        alert("Feil e-post eller passord");
        return;
    }

    // Sender brukeren videre til hovedsiden.
    window.location.href = "main.html";
}

/* ======================
   HENT BRUKER
====================== */

// Henter informasjon om innlogget bruker.
async function getUser() {

    const { data } =
        await supabaseClient.auth.getUser();

    return data.user;
}

/* ======================
   LAST UTSTYR
====================== */

// Henter alt utstyr fra databasen og viser det på siden.
async function loadEquipment() {

    const grid =
        document.getElementById("equipmentGrid");

    // Avslutter dersom elementet ikke finnes.
    if (!grid) return;

    // Henter innlogget bruker.
    const user = await getUser();

    // Hvis ingen bruker er logget inn.
    if (!user) {
        grid.innerHTML =
            "<p>Du må være logget inn</p>";
        return;
    }

    // Henter alle rader fra equipment-tabellen.
    const { data, error } =
        await supabaseClient
            .from("equipment")
            .select("*")
            .order("utstyr_nummer");

    // Håndterer databasefeil.
    if (error) {
        console.error(error);
        grid.innerHTML =
            "<p>Feil ved lasting</p>";
        return;
    }

    // Tømmer eksisterende innhold før vi bygger DOM på nytt.
    grid.innerHTML = "";

    // Går gjennom hvert utstyr i databasen.
    data.forEach(item => {

        // Lager en ny rad i brukergrensesnittet.
        const row = document.createElement("div");

        row.className = "item-row";

        // Standardverdier dersom utstyret er ledig.
        let statusText = "Ledig";
        let statusClass = "not-selected";

        // Bestemmer utlånsstart og om varen er utlånt.
        // `loanedAt` hentes fra mulige tidsstempel-felt.
        const loanedAt = getLoanStartedAt(item);
        const isLoaned = Boolean(item.loaned || loanedAt);

        // Bestem visningsstatus basert på hvem som har lånt det.
        // Hvis innlogget bruker har lånt det viser vi "Lånt av deg".
        // Ellers vises "Utlånt" og raden låses visuelt.
        // Hvis ikke utlånt forblir det "Ledig".
        // Hvis `isLoaned` er true går vi inn i denne blokken.
        // Hvis utstyret er lånt ut.
        if (isLoaned) {

            // Hvis innlogget bruker har lånt det.
            if (item.loaned_by === user.id) {
                statusText = "Lånt av deg";
                statusClass = "selected";
            } else {
                // Hvis en annen bruker har lånt det.
                statusText = "Utlånt";
                statusClass = "locked";
            }
        }

        // Lager tekst som viser hvor lenge utstyret har vært utlånt.
        // `getLoanDurationHtml` returnerer en menneskelig lesbar streng.
        const loanDurationHtml = getLoanDurationHtml(item, loanedAt);

        // Setter inn innholdet i raden.
        row.innerHTML = `
            <div class="cell">${item.tekst}</div>
            <div class="cell">${item.utstyr_nummer}</div>
            <div class="cell loan-duration" data-loaned-at="${loanedAt || ""}" data-loaned="${isLoaned}">${loanDurationHtml}</div>
            <div class="cell ${statusClass}">
                ${statusText}
            </div>
        `;

        // Ved klikk forsøker vi å låne eller levere inn; `toggleLoan` håndterer
        // både utlån og innlevering basert på nåværende tilstand.
        row.addEventListener("click", () =>
            toggleLoan(item, user)
        );

        // Legger raden inn på siden.
        grid.appendChild(row);
    });
}

// Henter starttidspunkt for utlån fra tilgjengelige felter.
function getLoanStartedAt(item) {
    // Bruk bare faktiske utlånsdatoer.
    return item.loaned_at || item.loanedAt || item.loanedAtTimestamp || null;
}

// Lager tekst som viser hvor lenge utstyret har vært utlånt.
function getLoanDurationHtml(item, loanedAt) {
    // Returnerer "Ledig" hvis ikke utlånt, ellers en formatert tid.
    const hasLoan = Boolean(item.loaned || loanedAt);
    if (!hasLoan) return "Ledig";
    // Dersom vi ikke har et tidspunkt viser vi en kort tekst.
    if (!loanedAt) return formatLoanDurationText(null);
    return formatLoanDurationText(loanedAt);
}

// Lager tekst som viser hvor lenge det er siden utlån.
function formatLoanDurationText(timestamp) {
    // Konverterer et tidsstempel til en kort, norsk tekst:
    // - mindre enn 1 minutt
    // - X minutter
    // - X timer Y minutter
    // - X dager Y timer
    try {
        const loanedAt = timestamp ? new Date(timestamp) : null;
        const now = new Date();
        const diffMs = loanedAt ? Math.max(0, now - loanedAt) : 0;

        const minutes = Math.floor(diffMs / 60000);
        if (!loanedAt || minutes < 1) return "Lånt i mindre enn 1 minutt";
        if (minutes < 60) return `Lånt i ${minutes} minutter`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours < 24) {
            return remainingMinutes === 0
                ? `Lånt i ${hours} ${hours === 1 ? "time" : "timer"}`
                : `Lånt i ${hours} ${hours === 1 ? "time" : "timer"} ${remainingMinutes} minutter`;
        }

        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        if (remainingHours === 0) {
            return days === 1
                ? `Lånt i 1 dag`
                : `Lånt i ${days} dager`;
        }
        return days === 1
            ? `Lånt i 1 dag ${remainingHours} ${remainingHours === 1 ? "time" : "timer"}`
            : `Lånt i ${days} dager ${remainingHours} ${remainingHours === 1 ? "time" : "timer"}`;
    } catch {
        return "Ukjent tidspunkt";
    }
}

// Oppdaterer varigheten i alle lånte utstyrsceller.
function refreshLoanDurations() {
    document.querySelectorAll(".loan-duration").forEach(cell => {
        const loanedAt = cell.dataset.loanedAt;
        const isLoaned = cell.dataset.loaned === "true";

        // Oppdater tekst i cellen basert på timestamp.
        if (!loanedAt) {
            // Hvis vi vet at varen er lånt men mangler timestamp,
            // viser vi en kort fallback-melding.
            cell.textContent = isLoaned ? "Lånt i mindre enn 1 minutt" : "Ledig";
            return;
        }
        // Bruk formatfunksjonen for å vise hvor lenge den er lånt.
        cell.textContent = formatLoanDurationText(loanedAt);
    });
}

/* ======================
   LÅN / LEVER INN
====================== */

// Håndterer utlån og innlevering av utstyr.
async function toggleLoan(item, user) {

    // Hindrer at andre kan overta utstyr som er utlånt.
    if (
        item.loaned &&
        item.loaned_by !== user.id
    ) {
        alert(
            "Utstyret er allerede lånt av en annen"
        );
        return;
    }

    // Sjekker om brukeren leverer inn utstyr.
    const isReturning =
        item.loaned &&
        item.loaned_by === user.id;

    // Lager dataene som skal lagres.
    const payload = isReturning
        ? {
            loaned: false,
            loaned_by: null,
            loaned_by_email: null,
            loaned_at: null
        }
        : {
            loaned: true,
            loaned_by: user.id,
            loaned_by_email: user.email || null,
            loaned_at: new Date().toISOString()
        };

    // Oppdaterer databasen.
    const result =
        await updateEquipment(
            item.id_utstyr,
            payload
        );

    // Håndterer feil.
    if (result.error) {

        const actionText =
            isReturning
                ? "innlevering"
                : "utlån";

        alert(
            `Feil ved ${actionText}: ${result.error.message}`
        );

        return;
    }

    // Oppdaterer listen på nytt.
    loadEquipment();
}

// Oppdaterer en rad i equipment-tabellen.
async function updateEquipment(id, payload) {

    let result =
        await supabaseClient
            .from("equipment")
            .update(payload)
            .eq("id_utstyr", id);

    // Hvis noen kolonner mangler i databasen (f.eks. eldre skjema),
    // prøver vi å oppdatere uten de feltene for å unngå feil.
    if (result.error) {
        const fallbackPayload = { ...payload };
        let retry = false;

        if (isColumnNotFoundError(result.error, "loaned_at")) {
            delete fallbackPayload.loaned_at;
            retry = true;
        }
        if (isColumnNotFoundError(result.error, "loaned_by_email")) {
            delete fallbackPayload.loaned_by_email;
            retry = true;
        }

        if (retry) {
            result =
                await supabaseClient
                    .from("equipment")
                    .update(fallbackPayload)
                    .eq("id_utstyr", id);
        }
    }

    return result;
}

// Sjekker om feilen skyldes manglende kolonne.
function isColumnNotFoundError(
    error,
    columnName
) {

    const message =
        `${error.message || ""} ${error.details || ""}`;

    return (
        error.code === "42703" ||
        message.toLowerCase().includes(columnName)
    );
}

/* ======================
   LEGG TIL UTSTYR
====================== */

// Legger nytt utstyr inn i databasen.
async function addEquipment() {

    // Leser verdiene fra skjemaet.
    const name =
        document.getElementById("equipName")
            ?.value.trim();

    const number =
        document.getElementById("equipNumber")
            ?.value.trim();

    // Kontrollerer at begge feltene er fylt ut.
    if (!name || !number) {
        alert("Fyll ut begge feltene");
        return;
    }

    // Oppretter ny rad i databasen.
    const { error } =
        await supabaseClient
            .from("equipment")
            .insert({
                tekst: name,
                utstyr_nummer: number
            });

    // Håndterer feil.
    if (error) {
        alert(error.message);
        return;
    }

    // Tømmer skjemaet etter vellykket lagring.
    document.getElementById("equipName").value = "";
    document.getElementById("equipNumber").value = "";

    // Oppdaterer listen med utstyr.
    loadEquipment();
}