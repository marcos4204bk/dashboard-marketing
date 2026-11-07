// =========================================================
// PÁGINA DE CAMPANHAS
// Arquivo separado do script.js para não interferir no dashboard.
// =========================================================

// 1. DADOS FICTÍCIOS ---------------------------------------
const campanhas = [
  { nome: "Remarketing - Carrinho abandonado", plataforma: "Meta Ads",   investimento: 420,  faturamento: 3150, vendas: 21 },
  { nome: "Prospecção - Público semelhante",   plataforma: "Meta Ads",   investimento: 980,  faturamento: 3600, vendas: 24 },
  { nome: "Stories - Lançamento coleção",      plataforma: "Meta Ads",   investimento: 650,  faturamento: 1650, vendas: 11 },
  { nome: "Reels - Engajamento",               plataforma: "Meta Ads",   investimento: 310,  faturamento: 450,  vendas: 3  },
  { nome: "Pesquisa - Marca",                  plataforma: "Google Ads", investimento: 280,  faturamento: 2700, vendas: 18 },
  { nome: "Pesquisa - Termos genéricos",       plataforma: "Google Ads", investimento: 1150, faturamento: 3900, vendas: 26 },
  { nome: "Shopping - Catálogo completo",      plataforma: "Google Ads", investimento: 870,  faturamento: 3300, vendas: 22 },
  { nome: "YouTube - Vídeo institucional",     plataforma: "Google Ads", investimento: 540,  faturamento: 750,  vendas: 5  },
];

// 2. FUNÇÕES DE CÁLCULO E FORMATAÇÃO -----------------------
function formatarReais(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function calcularCPA(investimento, vendas) {
  return vendas > 0 ? investimento / vendas : null;
}
function calcularROAS(faturamento, investimento) {
  return investimento > 0 ? faturamento / investimento : null;
}
function formatarROAS(roas) {
  if (roas === null) return "—";
  return roas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "x";
}

// Soma investimento, faturamento e vendas de todas as campanhas
function somarTotais(lista) {
  return lista.reduce(
    (t, c) => ({
      investimento: t.investimento + c.investimento,
      faturamento:  t.faturamento  + c.faturamento,
      vendas:       t.vendas       + c.vendas,
    }),
    { investimento: 0, faturamento: 0, vendas: 0 }
  );
}

// 3. INDICADORES --------------------------------------------
function atualizarKPIs(totais) {
  const cpa = calcularCPA(totais.investimento, totais.vendas);
  document.getElementById("kpi-investimento").textContent = formatarReais(totais.investimento);
  document.getElementById("kpi-faturamento").textContent  = formatarReais(totais.faturamento);
  document.getElementById("kpi-vendas").textContent       = totais.vendas;
  document.getElementById("kpi-cpa").textContent          = cpa === null ? "—" : formatarReais(cpa);
  document.getElementById("kpi-roas").textContent         = formatarROAS(calcularROAS(totais.faturamento, totais.investimento));
}

// 4. TABELA -------------------------------------------------
// Cria as células de uma linha. "data-label" é usado pelo CSS
// para mostrar o nome da coluna quando a tabela vira cartão no celular.
function celulasDaLinha(dados) {
  const cpa = calcularCPA(dados.investimento, dados.vendas);
  return `
    <td class="num" data-label="Investimento">${formatarReais(dados.investimento)}</td>
    <td class="num" data-label="Faturamento">${formatarReais(dados.faturamento)}</td>
    <td class="num" data-label="Vendas">${dados.vendas}</td>
    <td class="num" data-label="CPA">${cpa === null ? "—" : formatarReais(cpa)}</td>
    <td class="num" data-label="ROAS">${formatarROAS(calcularROAS(dados.faturamento, dados.investimento))}</td>
  `;
}

function montarTabela(lista, totais) {
  // Ordena da campanha com maior ROAS para a menor
  const ordenadas = [...lista].sort(
    (a, b) => calcularROAS(b.faturamento, b.investimento) - calcularROAS(a.faturamento, a.investimento)
  );

  document.getElementById("tabela-campanhas").innerHTML = ordenadas
    .map((c) => {
      // Classe usada para colorir o selo da plataforma
      const classe = c.plataforma === "Meta Ads" ? "plataforma--meta" : "plataforma--google";
      return `
        <tr>
          <td class="nome" data-label="Campanha">${c.nome}</td>
          <td data-label="Plataforma"><span class="plataforma ${classe}">${c.plataforma}</span></td>
          ${celulasDaLinha(c)}
        </tr>`;
    })
    .join("");

  document.getElementById("tabela-total").innerHTML = `
    <tr>
      <td class="nome" data-label="Total">Total</td>
      <td data-label="Plataforma">Todas</td>
      ${celulasDaLinha(totais)}
    </tr>`;

  document.getElementById("tabela-resumo").textContent =
    `${lista.length} campanhas · ordenadas pelo maior ROAS · dados fictícios`;
}

// 5. INICIALIZAÇÃO -------------------------------------------
const totais = somarTotais(campanhas);
atualizarKPIs(totais);
montarTabela(campanhas, totais);
