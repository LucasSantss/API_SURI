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

// Novos elementos
const responseStatusInput = document.getElementById("response-status");
const responseBodyInput = document.getElementById("response-body");
const saveConfigBtn = document.getElementById("save-config-btn");

const docTypeSelect = document.getElementById("doc-type");
const docValueInput = document.getElementById("doc-value");
const docResponseInput = document.getElementById("doc-response");
const addDocBtn = document.getElementById("add-doc-btn");
const docsListBody = document.getElementById("docs-list-body");

let webhooks = [];
let authorizedDocs = [];

// Funções de Validação (Mantidas se necessário no futuro, mas não usadas agora)
function isValidCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let cpfs = cpf.split('').map(el => +el);
    const rest = (count) => (cpfs.slice(0, count - 12).reduce((soma, el, index) => soma + el * (count - index), 0) * 10) % 11 % 10;
    return rest(10) === cpfs[9] && rest(11) === cpfs[10];
}

function isValidCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result != digits.charAt(0)) return false;
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result != digits.charAt(1)) return false;
    return true;
}

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
    webhooksContainer.innerHTML = '<p class="empty-state">Nenhum resultado recebido ainda.</p>';
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
    deleteBtn.textContent = "Apagar todos os Resultados";
    deleteBtn.style.backgroundColor = "#d9534f";
    deleteBtn.style.color = "#fff";
    deleteBtn.style.border = "none";
    deleteBtn.style.padding = "10px 18px";
    deleteBtn.style.borderRadius = "8px";
    deleteBtn.style.marginTop = "12px";
    deleteBtn.style.display = "block";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Tem certeza que deseja apagar TODOS os Resultados?")) return;
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
      body: JSON.stringify({ type: "teste", message: "Dados de teste enviado pelo painel" })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    await fetchWebhooks();
  } catch (err) {
    alert("Erro ao enviar Dados de teste: " + err.message);
  }
});

// Event Listeners para Configuração e Validação
saveConfigBtn.addEventListener("click", async () => {
    const status = parseInt(responseStatusInput.value);
    let body;
    try {
        body = JSON.parse(responseBodyInput.value);
    } catch (e) {
        alert("Erro no JSON: " + e.message);
        return;
    }

    saveConfigBtn.disabled = true;
    saveConfigBtn.textContent = "Salvando...";

    try {
        const res = await fetch(backendURL + "/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, body })
        });
        if (!res.ok) throw new Error("Erro ao salvar configuração");
        alert("Configuração salva com sucesso!");
    } catch (err) {
        alert("Erro: " + err.message);
    } finally {
        saveConfigBtn.disabled = false;
        saveConfigBtn.textContent = "Salvar Configuração";
    }
});

async function loadConfig() {
    try {
        const res = await fetch(backendURL + "/api/config");
        if (res.ok) {
            const config = await res.json();
            if (config) {
                responseStatusInput.value = config.status || 200;
                responseBodyInput.value = JSON.stringify(config.body || {}, null, 2);
            }
        }
    } catch (err) {
        console.error("Erro ao carregar config:", err);
    }
}

// Gerenciamento de Documentos
async function fetchDocs() {
    try {
        const res = await fetch(backendURL + "/api/documents");
        if (!res.ok) throw new Error("Erro ao buscar documentos");
        authorizedDocs = await res.json();
        renderDocs();
    } catch (err) {
        console.error("fetchDocs error:", err);
    }
}

function renderDocs() {
    docsListBody.innerHTML = "";
    authorizedDocs.forEach(doc => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${doc.doc_type}</td>
            <td>${doc.doc_value}</td>
            <td><pre style="font-size: 10px">${JSON.stringify(doc.custom_response, null, 2)}</pre></td>
            <td>
                <button class="btn-delete" onclick="deleteDoc(${doc.id})">Excluir</button>
            </td>
        `;
        docsListBody.appendChild(tr);
    });
}

window.deleteDoc = async (id) => {
    if (!confirm("Excluir este documento?")) return;
    try {
        const res = await fetch(`${backendURL}/api/documents?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao deletar");
        fetchDocs();
    } catch (err) {
        alert(err.message);
    }
};

addDocBtn.addEventListener("click", async () => {
    const doc_type = docTypeSelect.value;
    const doc_value = docValueInput.value.trim();
    let custom_response;

    if (!doc_value) return alert("Digite o número do documento");

    try {
        custom_response = JSON.parse(docResponseInput.value);
    } catch (e) {
        return alert("Erro no JSON de retorno: " + e.message);
    }

    addDocBtn.disabled = true;
    try {
        const res = await fetch(backendURL + "/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ doc_type, doc_value, custom_response })
        });
        if (!res.ok) throw new Error("Erro ao salvar documento");
        docValueInput.value = "";
        fetchDocs();
    } catch (err) {
        alert(err.message);
    } finally {
        addDocBtn.disabled = false;
    }
});

webhookUrlEl.textContent = webhookEndpoint;
fetchWebhooks();
loadConfig();
fetchDocs();
setInterval(() => { if (document.hasFocus()) fetchWebhooks(); }, 5000);
