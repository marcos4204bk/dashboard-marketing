// =========================================================
// 1. DADOS
// Em um projeto real, esses dados viriam de uma API.
// Aqui criamos um HISTÓRICO DIÁRIO fictício dos últimos 91 dias.
// Todo filtro é calculado a partir dele, por isso os números
// sempre batem entre si (7 dias está "dentro" de 30, que está dentro de 90).
// =========================================================

// Ticket médio: cada venda gera R$ 150 de faturamento
const TICKET_MEDIO = 150;

// 13 semanas de histórico, da mais antiga para a mais recente.
// As 8 últimas somam 40 vendas e R$ 1.500 de investimento (os números originais).
const historicoSemanal = [
  { vendas: 2, investimento: 150 },
  { vendas: 3, investimento: 160 },
  { vendas: 2, investimento: 150 },
  { vendas: 3, investimento: 170 },
  { vendas: 4, investimento: 170 },
  // ---- a partir daqui: as "últimas 8 semanas" ----
  { vendas: 3, investimento: 170 },
  { vendas: 4, investimento: 180 },
  { vendas: 5, investimento: 185 },
  { vendas: 4, investimento: 180 },
  { vendas: 6, investimento: 195 },
  { vendas: 5, investimento: 190 },
  { vendas: 7, investimento: 205 },
  { vendas: 6, investimento: 195 },
];

// Ordem em que as vendas de uma semana são distribuídas entre os dias
// (0 = primeiro dia da semana). Assim os dias não ficam todos iguais.
const ORDEM_DIAS = [4, 1, 6, 2, 5, 0, 3];

// Transforma as semanas em uma lista de DIAS, cada um com data, vendas,
// investimento e faturamento.
function gerarHistoricoDiario() {
  const dias = [];
  const totalDias = historicoSemanal.length * 7; // 91
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  historicoSemanal.forEach((semana) => {
    // Começa com zero vendas em cada dia da semana...
    const vendasDaSemana = [0, 0, 0, 0, 0, 0, 0];
    // ...e distribui as vendas uma a uma seguindo ORDEM_DIAS
    for (let k = 0; k < semana.vendas; k++) {
      vendasDaSemana[ORDEM_DIAS[k % 7]] += 1;
    }

    vendasDaSemana.forEach((vendas) => {
      const indice = dias.length;
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - (totalDias - 1 - indice)); // o último dia é hoje

      dias.push({
        data,
        vendas,
        investimento: semana.investimento / 7, // gasto diário igual dentro da semana
        faturamento: vendas * TICKET_MEDIO,
      });
    });
  });

  return dias;
}

const historicoDiario = gerarHistoricoDiario();

// Opções do filtro: quantos dias olhar para trás e como agrupar o gráfico
const PERIODOS = {
  "7d":  { dias: 7,  agrupar: "dia",    titulo: "Últimos 7 dias" },
  "30d": { dias: 30, agrupar: "semana", titulo: "Últimos 30 dias" },
  "90d": { dias: 90, agrupar: "semana", titulo: "Últimos 90 dias" },
  "8s":  { dias: 56, agrupar: "semana", titulo: "Últimas 8 semanas" },
};

// Campanhas fictícias: a "participação" de cada uma no total.
// (Com base nas 8 semanas: 16 de 40 vendas, R$ 500 de R$ 1.500 etc.)
const campanhas = [
  { nome: "Black Friday Antecipada", canal: "Meta Ads",   pesoInvestimento: 500, pesoVendas: 16 },
  { nome: "Remarketing Carrinho",    canal: "Google Ads", pesoInvestimento: 300, pesoVendas: 10 },
  { nome: "Pesquisa de Marca",       canal: "Google Ads", pesoInvestimento: 250, pesoVendas: 7  },
  { nome: "Stories Lançamento",      canal: "Instagram",  pesoInvestimento: 280, pesoVendas: 4  },
  { nome: "Vídeo Awareness",         canal: "YouTube",    pesoInvestimento: 170, pesoVendas: 3  },
];

// =========================================================
// 2. FUNÇÕES AUXILIARES
// =========================================================

// Formata números como dinheiro brasileiro: 1500 -> "R$ 1.500,00"
function formatarReais(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Formata datas: 07/11
function formatarData(data) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// CPA = quanto custou, em média, cada venda (investimento ÷ vendas)
function calcularCPA(investimento, vendas) {
  return vendas > 0 ? investimento / vendas : null; // sem vendas não dá para dividir
}

// ROAS = quantos reais voltaram para cada R$ 1 investido (faturamento ÷ investimento)
function calcularROAS(faturamento, investimento) {
  return investimento > 0 ? faturamento / investimento : null;
}

// Formata o ROAS: 4 -> "4,00x"
function formatarROAS(roas) {
  if (roas === null) return "—";
  return roas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "x";
}

// Soma vendas, investimento e faturamento de uma lista de dias
function somar(dias) {
  return dias.reduce(
    (total, dia) => ({
      vendas: total.vendas + dia.vendas,
      investimento: total.investimento + dia.investimento,
      faturamento: total.faturamento + dia.faturamento,
    }),
    { vendas: 0, investimento: 0, faturamento: 0 }
  );
}

// Divide um total inteiro (ex.: 25 vendas) entre itens com pesos,
// garantindo que a soma das partes seja exatamente o total.
// (Método do "maior resto": arredonda para baixo e distribui o que sobrou.)
function distribuirInteiros(total, pesos) {
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  const exatos = pesos.map((p) => (total * p) / somaPesos);
  const partes = exatos.map(Math.floor);
  let sobra = total - partes.reduce((a, b) => a + b, 0);

  exatos
    .map((valor, i) => ({ i, resto: valor - Math.floor(valor) }))
    .sort((a, b) => b.resto - a.resto)
    .forEach(({ i }) => {
      if (sobra > 0) { partes[i] += 1; sobra -= 1; }
    });

  return partes;
}

// =========================================================
// 3. CARTÕES DE KPI
// =========================================================

function atualizarKPIs(totais) {
  const cpa = calcularCPA(totais.investimento, totais.vendas);
  const roas = calcularROAS(totais.faturamento, totais.investimento);

  document.getElementById("kpi-investimento").textContent = formatarReais(totais.investimento);
  document.getElementById("kpi-faturamento").textContent = formatarReais(totais.faturamento);
  document.getElementById("kpi-vendas").textContent = totais.vendas;
  document.getElementById("kpi-cpa").textContent = cpa === null ? "—" : formatarReais(cpa);
  document.getElementById("kpi-roas").textContent = formatarROAS(roas);
}

// =========================================================
// 4. GRÁFICO DE BARRAS (SVG, sem bibliotecas)
// =========================================================

// Agrupa os dias em barras: uma por dia, ou uma a cada 7 dias (semana).
function agruparParaGrafico(dias, modo) {
  if (modo === "dia") {
    return dias.map((dia) => ({
      rotulo: formatarData(dia.data),
      detalhe: dia.data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }),
      vendas: dia.vendas,
      faturamento: dia.faturamento,
    }));
  }

  // Agrupa de 7 em 7 a partir do dia mais recente (a semana mais antiga pode ficar incompleta)
  const grupos = [];
  for (let fim = dias.length; fim > 0; fim -= 7) {
    const bloco = dias.slice(Math.max(0, fim - 7), fim);
    const t = somar(bloco);
    const inicio = bloco[0].data;
    const ultimo = bloco[bloco.length - 1].data;
    grupos.unshift({ // unshift = coloca no começo, para ficar em ordem cronológica
      rotulo: formatarData(inicio),
      detalhe: `${formatarData(inicio)} a ${formatarData(ultimo)}` + (bloco.length < 7 ? ` (${bloco.length} dias)` : ""),
      vendas: t.vendas,
      faturamento: t.faturamento,
    });
  }
  return grupos;
}

function desenharGrafico(barras) {
  const container = document.getElementById("grafico");
  const tooltip = document.getElementById("tooltip");
  tooltip.classList.remove("visivel");

  // Tamanho "virtual" do desenho. O CSS faz ele se ajustar à tela.
  const largura = 800;
  const altura = 300;
  const margem = { topo: 24, direita: 8, baixo: 32, esquerda: 32 };
  const areaLargura = largura - margem.esquerda - margem.direita;
  const areaAltura = altura - margem.topo - margem.baixo;

  // Escala do eixo Y se adapta aos dados do período
  const maiorValor = Math.max(...barras.map((b) => b.vendas), 1);
  const passoEixo = maiorValor <= 4 ? 1 : maiorValor <= 10 ? 2 : 5;
  const maximo = (Math.floor(maiorValor / passoEixo) + 1) * passoEixo;

  const passo = areaLargura / barras.length;
  const larguraBarra = Math.min(48, passo * 0.55);
  // Com muitas barras, mostramos o rótulo de uma sim, uma não (para não amontoar)
  const pularRotulos = barras.length > 8;

  const y = (valor) => margem.topo + areaAltura - (valor / maximo) * areaAltura;

  let svg = `<svg viewBox="0 0 ${largura} ${altura}" role="img"
              aria-label="Gráfico de barras com vendas por período">`;

  // Linhas de grade + números do eixo Y
  for (let v = 0; v <= maximo; v += passoEixo) {
    svg += `<line class="linha-grade" x1="${margem.esquerda}" x2="${largura - margem.direita}"
              y1="${y(v)}" y2="${y(v)}"></line>`;
    svg += `<text class="texto-eixo" x="${margem.esquerda - 10}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  }

  // Mostra o número só na primeira barra com o maior valor
  const indiceMelhor = barras.findIndex((b) => b.vendas === maiorValor);

  barras.forEach((barra, i) => {
    const centroX = margem.esquerda + passo * i + passo / 2;
    const xBarra = centroX - larguraBarra / 2;
    const topoBarra = y(barra.vendas);
    const base = y(0);
    const r = Math.min(4, base - topoBarra); // arredondamento só no topo

    barra._centro = centroX;
    barra._topo = topoBarra;

    svg += `<g class="grupo-barra" tabindex="0" data-indice="${i}"
              aria-label="${barra.detalhe}: ${barra.vendas} vendas">
      <rect class="alvo" x="${centroX - passo / 2}" y="${margem.topo}" width="${passo}" height="${areaAltura}"></rect>`;

    if (barra.vendas > 0) {
      svg += `<path class="barra" d="M${xBarra},${base}
        V${topoBarra + r} Q${xBarra},${topoBarra} ${xBarra + r},${topoBarra}
        H${xBarra + larguraBarra - r} Q${xBarra + larguraBarra},${topoBarra} ${xBarra + larguraBarra},${topoBarra + r}
        V${base} Z"></path>`;
    }
    svg += `</g>`;

    if (i === indiceMelhor) {
      svg += `<text class="texto-valor" x="${centroX}" y="${topoBarra - 8}" text-anchor="middle">${barra.vendas}</text>`;
    }

    // Rótulo embaixo (com muitas barras, mostra sempre a última e pula alternadas)
    const mostrarRotulo = !pularRotulos || (barras.length - 1 - i) % 2 === 0;
    if (mostrarRotulo) {
      svg += `<text class="texto-eixo" x="${centroX}" y="${altura - 8}" text-anchor="middle">${barra.rotulo}</text>`;
    }
  });

  svg += `</svg>`;
  container.innerHTML = svg;

  // ----- Tooltip ao passar o mouse / tocar / focar com teclado -----
  const svgEl = container.querySelector("svg");

  function mostrar(grupo) {
    const barra = barras[grupo.dataset.indice];
    const textoVendas = barra.vendas === 1 ? "1 venda" : `${barra.vendas} vendas`;
    tooltip.innerHTML = `<strong>${textoVendas}</strong>${barra.detalhe} · ${formatarReais(barra.faturamento)}`;

    const caixaSvg = svgEl.getBoundingClientRect();
    const caixaCartao = container.parentElement.getBoundingClientRect();
    const escala = caixaSvg.width / largura;

    tooltip.style.left = `${caixaSvg.left - caixaCartao.left + barra._centro * escala}px`;
    tooltip.style.top = `${caixaSvg.top - caixaCartao.top + barra._topo * escala - 10}px`;
    tooltip.classList.add("visivel");
  }

  const esconder = () => tooltip.classList.remove("visivel");

  container.querySelectorAll(".grupo-barra").forEach((grupo) => {
    grupo.addEventListener("mouseenter", () => mostrar(grupo));
    grupo.addEventListener("focus", () => mostrar(grupo));
    grupo.addEventListener("click", () => mostrar(grupo)); // toque no celular
    grupo.addEventListener("mouseleave", esconder);
    grupo.addEventListener("blur", esconder);
  });
}

// =========================================================
// 5. TABELA DE CAMPANHAS
// Divide os totais do período entre as campanhas, mantendo
// a mesma participação de cada uma.
// =========================================================

function montarTabela(totais) {
  const corpo = document.getElementById("tabela-campanhas");

  const vendasPorCampanha = distribuirInteiros(totais.vendas, campanhas.map((c) => c.pesoVendas));
  const somaPesosInv = campanhas.reduce((s, c) => s + c.pesoInvestimento, 0);

  const linhas = campanhas.map((c, i) => {
    const vendas = vendasPorCampanha[i];
    const investimento = totais.investimento * (c.pesoInvestimento / somaPesosInv);
    const faturamento = vendas * TICKET_MEDIO;
    const cpa = calcularCPA(investimento, vendas);
    const roas = calcularROAS(faturamento, investimento);

    // Regra simples: ROAS de 3x ou mais é considerado saudável
    const status = roas !== null && roas >= 3
      ? `<span class="status status--bom">✓ Saudável</span>`
      : `<span class="status status--alerta">! Atenção</span>`;

    return `
      <tr>
        <td class="nome">${c.nome}</td>
        <td class="canal">${c.canal}</td>
        <td class="num">${formatarReais(investimento)}</td>
        <td class="num">${vendas}</td>
        <td class="num">${formatarReais(faturamento)}</td>
        <td class="num">${cpa === null ? "—" : formatarReais(cpa)}</td>
        <td class="num">${formatarROAS(roas)}</td>
        <td>${status}</td>
      </tr>`;
  });

  corpo.innerHTML = linhas.join("");
}

// =========================================================
// 6. FILTRO DE PERÍODO
// Esta é a função central: recebe o período escolhido,
// filtra os dias e atualiza TODAS as partes do painel.
// =========================================================

function aplicarPeriodo(chave) {
  const periodo = PERIODOS[chave];

  // .slice(-N) pega os N últimos itens da lista = os N dias mais recentes
  const dias = historicoDiario.slice(-periodo.dias);
  const totais = somar(dias);

  atualizarKPIs(totais);
  desenharGrafico(agruparParaGrafico(dias, periodo.agrupar));
  montarTabela(totais);

  // Textos que dependem do período
  document.getElementById("grafico-titulo").textContent =
    periodo.agrupar === "dia" ? "Vendas por dia" : "Vendas por semana";
  document.getElementById("periodo-datas").textContent =
    `${formatarData(dias[0].data)} a ${formatarData(dias[dias.length - 1].data)}`;
  document.getElementById("tabela-periodo").textContent =
    `${periodo.titulo} · dados fictícios para fins de estudo`;

  // Marca visualmente o botão ativo
  document.querySelectorAll(".filtro__botao").forEach((botao) => {
    botao.setAttribute("aria-pressed", botao.dataset.periodo === chave ? "true" : "false");
  });
}

// Liga cada botão do filtro à função aplicarPeriodo
document.querySelectorAll(".filtro__botao").forEach((botao) => {
  botao.addEventListener("click", () => aplicarPeriodo(botao.dataset.periodo));
});

// =========================================================
// 7. INICIAR: começa mostrando as últimas 8 semanas
// =========================================================
aplicarPeriodo("8s");

// Se a janela mudar de tamanho, escondemos o tooltip para ele não ficar fora do lugar
window.addEventListener("resize", () => document.getElementById("tooltip").classList.remove("visivel"));
