const SUPABASE_URL = "https://bhpbssjrnpavisxhfiez.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocGJzc2pybnBhdmlzeGhmaWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjM2NzMsImV4cCI6MjA4MzkzOTY3M30.H49jZC_LHsL2ouMcTRW71cJAvjYYlRNBnG9omdkG0zA";

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

    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return alert(error.message);

    window.location.href = "main.html";
}

async function login() {
    const email = document.getElementById("username")?.value;
    const password = document.getElementById("password")?.value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert("Feil e-post eller passord");

    window.location.href = "main.html";
}

/* ======================
   HENT BRUKER
====================== */
async function getUser() {
    const { data } = await supabaseClient.auth.getUser();
    return data.user;
}

/* ======================
   LAST UTSTYR
====================== */
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
        grid.innerHTML = "<p>Feil ved lasting</p>";
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
            } else {
                statusText = "Utlånt";
                statusClass = "locked";
            }
        }

        row.innerHTML = `
            <div class="cell">${item.tekst}</div>
            <div class="cell">${item.utstyr_nummer}</div>
            <div class="cell ${statusClass}">${statusText}</div>
        `;

        row.addEventListener("click", () => toggleLoan(item, user));
        grid.appendChild(row);
    });
}

/* ======================
   LÅN / LEVER INN
====================== */
async function toggleLoan(item, user) {

    // 🚫 Lånt av andre
    if (item.loaned && item.loaned_by !== user.id) {
        alert("Utstyret er allerede lånt av en annen");
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
    else {
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

/* ======================
   LEGG TIL UTSTYR
====================== */
async function addEquipment() {
    const name = document.getElementById("equipName").value.trim();
    const number = document.getElementById("equipNumber").value.trim();

    if (!name || !number) {
        alert("Fyll ut begge feltene");
        return;
    }

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

    document.getElementById("equipName").value = "";
    document.getElementById("equipNumber").value = "";

    loadEquipment();
}

/* ======================
   START
====================== */
document.addEventListener("DOMContentLoaded", () => {
    loadEquipment();

    const btn = document.getElementById("addBtn");
    if (btn) btn.addEventListener("click", addEquipment);
});
