// Registro do Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((err) => console.log(err));
}

// Inicialização
function init() {
  const container = document.getElementById("categorias-container");
  if (!container) return;

  for (let titulo in categorias) {
    const section = document.createElement("div");
    section.className = "section";
    section.innerHTML = `<h2>${titulo}</h2><div class="list-body"></div>`;

    const listBody = section.querySelector(".list-body");

    categorias[titulo].forEach((nome) => {
      const id = "prod-" + nome.replace(/\s+/g, "-").toLowerCase();
      const savedVal = localStorage.getItem(id) || 0;

      const itemDiv = document.createElement("div");
      itemDiv.className = `item ${savedVal > 0 ? "selected" : ""}`;
      itemDiv.innerHTML = `
        <label>${nome}</label>
        <div class="qty-controls">
          <button class="btn-qty btn-minus" onclick="changeQty('${id}', -1)">-</button>
          <input type="number" id="${id}" value="${savedVal}" readonly>
          <button class="btn-qty btn-plus" onclick="changeQty('${id}', 1)">+</button>
        </div>`;
      listBody.appendChild(itemDiv);
    });
    container.appendChild(section);
  }
  updatePreview();
}

function changeQty(id, delta) {
  const input = document.getElementById(id);
  let newVal = parseInt(input.value || 0) + delta;
  if (newVal < 0) newVal = 0;

  input.value = newVal;
  localStorage.setItem(id, newVal);

  const itemDiv = input.closest(".item");
  newVal > 0
    ? itemDiv.classList.add("selected")
    : itemDiv.classList.remove("selected");

  updatePreview();
}

function gerarTextoLista() {
  let grupos = { COZINHA: "", BALCÃO: "", "MASSAS E CAIXAS": "" };
  const inputs = document.querySelectorAll('input[type="number"]');

  inputs.forEach((input) => {
    if (input.value > 0) {
      const label = input.closest(".item").querySelector("label").innerText;
      const cat = input
        .closest(".section")
        .querySelector("h2")
        .innerText.toUpperCase();
      const linha = `• ${label}: ${input.value}\n`;

      if (["COZINHA", "MESA", "LIMPEZA"].includes(cat))
        grupos["COZINHA"] += linha;
      else if (cat === "BALCÃO") grupos["BALCÃO"] += linha;
      else if (cat === "MASSAS E CAIXAS") grupos["MASSAS E CAIXAS"] += linha;
    }
  });

  let texto = "";
  for (let g in grupos) if (grupos[g]) texto += `*${g}*\n${grupos[g]}\n`;
  return texto.trim();
}

function updatePreview() {
  const texto = gerarTextoLista();
  const preview = document.getElementById("lista-texto");
  if (preview) preview.innerText = texto || "Nenhum item selecionado.";
}

// Funções de Modal e Limpeza
function openModal() {
  document.getElementById("confirm-modal").style.display = "flex";
}
function closeModal() {
  document.getElementById("confirm-modal").style.display = "none";
}

function confirmClear() {
  localStorage.clear();
  document.querySelectorAll('input[type="number"]').forEach((input) => {
    input.value = 0;
    input.closest(".item").classList.remove("selected");
  });
  updatePreview();
  closeModal();
  showToast("🧹 Lista zerada!");
}

async function shareList() {
  const conteudo = gerarTextoLista();
  if (!conteudo) return showToast("⚠️ Adicione itens primeiro!");

  const textoCompleto = "🛒 *LISTA DE COMPRAS*\n\n" + conteudo;

  if (navigator.share) {
    try {
      await navigator.share({ text: textoCompleto });
    } catch (err) {}
  } else {
    navigator.clipboard
      .writeText(textoCompleto)
      .then(() => showToast("✅ Lista Copiada!"));
  }
}

function showToast(message) {
  const x = document.getElementById("toast");
  x.innerText = message;
  x.classList.add("show");
  setTimeout(() => x.classList.remove("show"), 3000);
}

document.addEventListener("DOMContentLoaded", init);
