// Frontend script for SURI Webhooks Panel
// If you deploy frontend and backend together on the same Vercel project, leave backendURL as window.location.origin.
// If backend is in a different project, replace backendURL with your backend origin (e.g. "https://seu-backend.vercel.app").
const backendURL = window.location.origin;
const webhookEndpoint = backendURL + "/webhook";

const statusText = document.getElementById("status-text");
const statusIndicator = document.getElementById("status-indicator");
const refreshBtn = document.getElementById("refresh-btn");
const copyBtn = document.getElementById("copy-btn");
const webhookUrlEl = document.getElementById("webhook-url");
const totalCountEl = document.getElementById("total-count");
const lastReceivedEl = document.getElementById("last-received");
const searchInput = document.getElementById("search-input");
const typeFilter = document.getElementById("type-filter");
const testBtn = document.getElementById("test-btn");
const webhooksContainer = document.getElementById("webhooks-container");

let webhooks = [];

function setStatus(state, text) {
  const statusEl = document.querySelector(".status");
  if (!statusEl) return;
  statusEl.className = "status " + state;
  statusText.textContent = text;
}

async function fetchWebhooks() {
  setStatus("connecting", "Conectando...");
  try {
    const res = await fetch(backendURL + "/webhooks", { method: "GET", credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    webhooks = await res.json();
    renderWebhooks();
    setStatus("connected", "Conectado");
  } catch (err) {
    console.error("fetchWebhooks error:", err);
    setStatus("disconnected", "Erro: " + err.message);
  }
}

function renderWebhooks() {
  webhooksContainer.innerHTML = "";

  const q = (searchInput.value || "").toLowerCase();
  const type = typeFilter.value;

  const filtered = webhooks.filter(w => {
    const s = JSON.stringify(w.payload || {}).toLowerCase();
    const matchesQ = q ? s.includes(q) : true;
    const matchesType = type ? (w.payload && w.payload.type === type) : true;
    return matchesQ && matchesType;
  });

  totalCountEl.textContent = filtered.length;
  lastReceivedEl.textContent = filtered[0] ? new Date(filtered[0].received_at).toLocaleString() : "Nenhum ainda";

  if (filtered.length === 0) {
    webhooksContainer.innerHTML = '<p class="empty-state">Nenhum webhook recebido ainda.</p>';
    return;
  }

  filtered.forEach(w => {
    const item = document.createElement("div");
    item.className = "webhook-item";

    const header = document.createElement("div");
    header.className = "webhook-header";

    const typeEl = document.createElement("span");
    const payloadType = (w.payload && w.payload.type) ? w.payload.type : "desconhecido";
    typeEl.className = "webhook-type type-" + payloadType;
    typeEl.textContent = payloadType;

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

  // Add delete button below container if not present
  if (!document.getElementById("delete-all-btn")) {
    const deleteBtn = document.createElement("button");
    deleteBtn.id = "delete-all-btn";
    deleteBtn.textContent = "Apagar todos os webhooks";
    deleteBtn.style.backgroundColor = "#d9534f";
    deleteBtn.style.color = "#fff";
    deleteBtn.style.border = "none";
    deleteBtn.style.padding = "10px 18px";
    deleteBtn.style.borderRadius = "8px";
    deleteBtn.style.marginTop = "12px";
    deleteBtn.style.display = "block";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Tem certeza que deseja apagar TODOS os webhooks?")) return;
      try {
        const res = await fetch(backendURL + "/webhooks", { method: "DELETE" });
        if (!res.ok) throw new Error('Falha ao deletar: ' + res.status);
        await fetchWebhooks();
      } catch (err) {
        alert("Erro ao deletar: " + err.message);
      }
    });
    webhooksContainer.insertAdjacentElement("afterend", deleteBtn);
  }
}

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(webhookEndpoint).then(() => {
    copyBtn.textContent = "Copiado!";
    setTimeout(() => copyBtn.textContent = "Copiar URL", 1500);
  });
});

refreshBtn.addEventListener("click", fetchWebhooks);
searchInput.addEventListener("input", renderWebhooks);
typeFilter.addEventListener("change", renderWebhooks);

testBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(webhookEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "test", message: "Webhook de teste enviado pelo painel" })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    await fetchWebhooks();
  } catch (err) {
    alert("Erro ao enviar webhook de teste: " + err.message);
  }
});

webhookUrlEl.textContent = webhookEndpoint;
fetchWebhooks();
setInterval(() => { if (document.hasFocus()) fetchWebhooks(); }, 5000);
