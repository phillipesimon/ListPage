// Inicialização do Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch((err) => console.log(err));
}

function init() {
  const container = document.getElementById("category-container");
  if (!container || typeof categorias === "undefined") return;
  container.innerHTML = "";

  for (let title in categorias) {
    const accordion = document.createElement("details");
    accordion.className = "section-accordion";
    const summary = document.createElement("summary");
    summary.innerHTML = `<span>${title}</span> <i class="seta">▼</i>`;
    const listBody = document.createElement("div");
    listBody.className = "list-body";

    categorias[title].forEach((name) => {
      const id = "prod-" + name.replace(/\s+/g, "-").toLowerCase();
      const savedVal = localStorage.getItem(id) || 0;
      const itemDiv = document.createElement("div");
      itemDiv.className = `item ${savedVal > 0 ? "selected" : ""}`;
      itemDiv.innerHTML = `
        <label>${name}</label>
        <div class="qty-controls">
          <button class="btn-qty btn-minus" onclick="updateQty(event, '${id}', -1)">-</button>
          <input type="number" id="${id}" value="${savedVal}" readonly>
          <button class="btn-qty btn-plus" onclick="updateQty(event, '${id}', 1)">+</button>
        </div>`;
      listBody.appendChild(itemDiv);
    });
    accordion.appendChild(summary);
    accordion.appendChild(listBody);
    container.appendChild(accordion);
  }
  updatePreview();
}

function updateQty(event, id, delta) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const input = document.getElementById(id);
  if (!input) return;

  let newVal = parseInt(input.value || 0) + delta;
  if (newVal < 0) newVal = 0;
  input.value = newVal;
  localStorage.setItem(id, newVal);

  const itemDiv = input.closest(".item");
  if (itemDiv) {
    if (newVal > 0) itemDiv.classList.add("selected");
    else itemDiv.classList.remove("selected");
  }

  // Manda o ID para o preview saber quem focar
  updatePreview(id);
}

function buildListText() {
  let groups = {
    COZINHA: "",
    LIMPEZA: "",
    MESA: "",
    "MASSAS E CAIXAS": "",
    BALCÃO: "",
  };
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach((input) => {
    const val = parseInt(input.value);
    if (val > 0) {
      const itemDiv = input.closest(".item");
      const label = itemDiv.querySelector("label").textContent;
      const summaryElem = input
        .closest(".section-accordion")
        .querySelector("summary span");
      const catTitle = summaryElem
        ? summaryElem.textContent.toUpperCase()
        : "OUTROS";

      const line = `• ${label}: ${val}\n`;
      if (catTitle.includes("COZINHA")) groups["COZINHA"] += line;
      else if (catTitle.includes("MESA")) groups["MESA"] += line;
      else if (catTitle.includes("LIMPEZA")) groups["LIMPEZA"] += line;
      else if (catTitle.includes("BALCÃO")) groups["BALCÃO"] += line;
      else groups["MASSAS E CAIXAS"] += line;
    }
  });
  let text = "";
  for (let g in groups) {
    if (groups[g]) text += `*${g}*\n${groups[g]}\n`;
  }
  return text.trim();
}

function updatePreview(lastId) {
  const text = buildListText();
  const preview = document.getElementById("list-preview");
  const outputDiv = document.getElementById("output-panel");

  if (!preview || !outputDiv) return;

  preview.innerText = text || "Nenhum item selecionado.";

  // ROLAGEM INTELIGENTE POR ITEM
  if (lastId && text) {
    const input = document.getElementById(lastId);
    if (input) {
      // Pegamos o nome do item que acabou de ser alterado
      const itemLabel = input
        .closest(".item")
        .querySelector("label").textContent;

      setTimeout(() => {
        // Criamos um "buscador" de texto dentro do preview
        const walker = document.createTreeWalker(
          preview,
          NodeFilter.SHOW_TEXT,
          null,
          false,
        );
        let node;
        while ((node = walker.nextNode())) {
          // Se acharmos o nome do item no texto do preview...
          if (node.textContent.includes(itemLabel)) {
            // Calculamos a posição daquela linha de texto
            const range = document.createRange();
            range.selectNodeContents(node);
            const rect = range.getBoundingClientRect();
            const containerRect = preview.getBoundingClientRect();

            // Fazemos o scroll relativo ao topo do container
            preview.scrollTo({
              top:
                preview.scrollTop +
                rect.top -
                containerRect.top -
                preview.clientHeight / 2,
              behavior: "smooth",
            });
            break;
          }
        }
      }, 100); // 100ms para garantir que o texto novo já existe
    }
  }

  const totalQty = Array.from(
    document.querySelectorAll('input[type="number"]'),
  ).reduce((acc, input) => acc + parseInt(input.value || 0), 0);

  outputDiv.style.display = totalQty === 0 ? "none" : "flex";

  const h3 = outputDiv.querySelector("h3");
  if (h3) {
    const label = outputDiv.classList.contains("expandida")
      ? "▼ Fechar"
      : "▲ Ver Lista";
    h3.innerHTML = `🛒 Itens: ${totalQty} <small>${label}</small>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  const output = document.getElementById("output-panel");
  const preview = document.getElementById("list-preview");

  if (output) {
    output.addEventListener("click", (e) => {
      if (e.target.closest("h3")) {
        output.classList.toggle("expandida");
        document.body.classList.toggle(
          "modal-open",
          output.classList.contains("expandida"),
        );
        updatePreview();
      }
    });
  }

  // ANIMAÇÃO ESTILINGUE E TRAVA DE ROLAGEM DUPLA
  if (preview) {
    let startY = 0;
    preview.addEventListener(
      "touchstart",
      (e) => {
        startY = e.touches[0].pageY;
      },
      { passive: true },
    );

    preview.addEventListener(
      "touchmove",
      (e) => {
        const deltaY = e.touches[0].pageY - startY;
        const scrollTop = preview.scrollTop;
        const scrollHeight = preview.scrollHeight;
        const clientHeight = preview.clientHeight;

        // Impede que a rolagem do fundo (body) se mexa
        if (scrollHeight > clientHeight) {
          e.stopPropagation();
        }

        // Efeito Estilingue no TOPO (Puxar para baixo)
        if (scrollTop <= 0 && deltaY > 0) {
          preview.style.transform = `translateY(${deltaY / 4}px)`;
        }

        // Efeito Estilingue no FINAL (Puxar para cima)
        // Adicionamos uma margem de 1px para garantir que o navegador detecte o fim
        else if (scrollTop + clientHeight >= scrollHeight - 1 && deltaY < 0) {
          preview.style.transform = `translateY(${deltaY / 4}px)`;
        }
      },
      { passive: false }, // Importante: false permite o preventDefault se necessário
    );

    preview.addEventListener("touchend", () => {
      preview.style.transform = "translateY(0)";
    });
  }
});

// MODAL E COMPARTILHAMENTO
function openModal() {
  document.getElementById("confirm-modal").style.display = "flex";
}
function closeModal() {
  document.getElementById("confirm-modal").style.display = "none";
}
function confirmClear() {
  localStorage.clear();
  location.reload();
}

async function shareList() {
  const content = buildListText();

  if (!content || content === "") {
    showToast("⚠️ A lista está vazia!");
    return;
  }

  const fullText = "🛒 *LISTA DE COMPRAS*\n\n" + content;

  if (navigator.share) {
    try {
      await navigator.share({ text: fullText });
    } catch (err) {
      console.log("Erro ao compartilhar:", err);
    }
  } else {
    navigator.clipboard.writeText(fullText);
    showToast("✅ Copiada!");
  }
}

function showToast(m) {
  const x = document.getElementById("toast");
  if (!x) return;

  // Remove a classe caso ela já esteja lá (reseta o estado)
  x.classList.remove("show");

  // Força o navegador a "recalcular" o elemento (hack de reflow)
  void x.offsetWidth;

  // Define a mensagem e adiciona a classe novamente
  x.innerText = m;
  x.classList.add("show");

  // Remove após 3 segundos
  setTimeout(() => {
    x.classList.remove("show");
  }, 3000);
}
