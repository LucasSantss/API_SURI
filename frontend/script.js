// =========================
// CONFIGURAÇÃO
// =========================
const backendURL = "https://seu-backend.vercel.app"; // ajuste para a URL do backend
const webhookEndpoint = backendURL + "/webhook";

// =========================
// ELEMENTOS DOM
// =========================
const statusText = document.getElementById("status-text");
const refreshBtn = document.getElementById("refresh-btn");
const copyBtn = document.getElementById("copy-btn");
const webhookUrlEl = document.getElementById("webhook-url");
const totalCountEl = document.getElementById("total-count");
const lastReceivedEl = document.getElementById("last-received");
const searchInput = document.getElementById("search-input");
const typeFilter = document.getElementById("type-filter");
const testBtn = document.getElementById("test-btn");
const webhooksContainer = document.getElementById("webhooks-container");

// Criar botão vermelho de deletar
const deleteBtn = document.createElement("button");
deleteBtn.textContent = "Apagar todos os webhooks";
deleteBtn.className = "delete-btn";
deleteBtn.style.backgroundColor = "#d9534f";
deleteBtn.style.color = "white";
deleteBtn.style.border = "none";
deleteBtn.style.padding = "10px 20px";
deleteBtn.style.margin = "20px auto";
deleteBtn.style.display = "block";
deleteBtn.style.borderRadius = "8px";
deleteBtn.style.cursor = "pointer";

// =========================
// ESTADO
// =========================
let webhooks = [];

// =========================
// FUNÇÕES
// =========================
function updateStatus(state = "connecting", msg = "Conectando...") {
    document.querySelector(".status").className = "status " + state;
    statusText.textContent = msg;
}

async function fetchWebhooks() {
    updateStatus("connecting", "Conectando...");
    try {
        const res = await fetch(backendURL + "/webhooks");
        if (!res.ok) throw new Error("Falha ao buscar webhooks");
        webhooks = await res.json();
        renderWebhooks();
        updateStatus("connected", "Conectado");
    } catch (err) {
        updateStatus("disconnected", "Erro: " + err.message);
    }
}

function renderWebhooks() {
    webhooksContainer.innerHTML = "";

    const search = searchInput.value.toLowerCase();
    const type = typeFilter.value;

    const filtered = webhooks.filter(w => {
        const payloadStr = JSON.stringify(w.payload).toLowerCase();
        const matchesSearch = payloadStr.includes(search);
        const matchesType = type ? w.payload?.type === type : true;
        return matchesSearch && matchesType;
    });

    totalCountEl.textContent = filtered.length;
    lastReceivedEl.textContent = filtered[0]
        ? new Date(filtered[0].received_at).toLocaleString()
        : "Nenhum ainda";

    if (filtered.length === 0) {
        webhooksContainer.innerHTML =
            '<p class="empty-state">Nenhum webhook recebido ainda.</p>';
    } else {
        filtered.forEach(w => {
            const item = document.createElement("div");
            item.className = "webhook-item";

            const header = document.createElement("div");
            header.className = "webhook-header";

            const typeEl = document.createElement("span");
            typeEl.className = "webhook-type type-" + (w.payload?.type || "default");
            typeEl.textContent = w.payload?.type || "desconhecido";

            const ts = document.createElement("span");
            ts.className = "webhook-timestamp";
            ts.textContent = new Date(w.received_at).toLocaleString();

            header.appendChild(typeEl);
            header.appendChild(ts);

            const data = document.createElement("pre");
            data.className = "webhook-data";
            data.textContent = JSON.stringify(w.payload, null, 2);

            item.appendChild(header);
            item.appendChild(data);
            webhooksContainer.appendChild(item);
        });
    }

    // Adiciona o botão vermelho abaixo da lista
    if (!document.body.contains(deleteBtn)) {
        webhooksContainer.insertAdjacentElement("afterend", deleteBtn);
    }
}

// =========================
// EVENTOS
// =========================
copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(webhookEndpoint);
    copyBtn.textContent = "Copiado!";
    setTimeout(() => (copyBtn.textContent = "Copiar URL"), 1500);
});

refreshBtn.addEventListener("click", fetchWebhooks);

searchInput.addEventListener("input", renderWebhooks);
typeFilter.addEventListener("change", renderWebhooks);

testBtn.addEventListener("click", async () => {
    try {
        const res = await fetch(webhookEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "test", message: "Webhook de teste enviado!" })
        });
        if (res.ok) {
            fetchWebhooks();
        } else {
            alert("Falha ao enviar webhook de teste");
        }
    } catch (err) {
        alert("Erro: " + err.message);
    }
});

// DELETE pelo botão vermelho
deleteBtn.addEventListener("click", async () => {
    if (!confirm("Tem certeza que deseja apagar TODOS os webhooks?")) return;
    try {
        await fetch(backendURL + "/webhooks", { method: "DELETE" });
        fetchWebhooks();
    } catch (err) {
        alert("Erro ao deletar: " + err.message);
    }
});

// =========================
// INICIALIZAÇÃO
// =========================
webhookUrlEl.textContent = webhookEndpoint;
fetchWebhooks();
setInterval(fetchWebhooks, 5000);
