export interface ModalidadeConfig {
  slug: string;
  nome: string;
  totalDezenasGlobo: number;
  minDezenas: number;
  maxDezenas: number;
}

export const MODALIDADES_CONFIG: Record<string, ModalidadeConfig> = {
  "mega-sena": {
    slug: "mega-sena",
    nome: "Mega-Sena",
    totalDezenasGlobo: 60,
    minDezenas: 6,
    maxDezenas: 20,
  },
  lotofacil: {
    slug: "lotofacil",
    nome: "Lotofácil",
    totalDezenasGlobo: 25,
    minDezenas: 15,
    maxDezenas: 20,
  },
  quina: {
    slug: "quina",
    nome: "Quina",
    totalDezenasGlobo: 80,
    minDezenas: 5,
    maxDezenas: 15,
  },
  lotomania: {
    slug: "lotomania",
    nome: "Lotomania",
    totalDezenasGlobo: 100,
    minDezenas: 50,
    maxDezenas: 50,
  },
  "dupla-sena": {
    slug: "dupla-sena",
    nome: "Dupla-Sena",
    totalDezenasGlobo: 50,
    minDezenas: 6,
    maxDezenas: 15,
  },
};

export interface LinhaParseErro {
  linhaNumero: number;
  conteudo: string;
  motivo: string;
}

export interface ResultadoParseExterno {
  validos: number[][];
  erros: LinhaParseErro[];
}

export function formatarDezenaModalidade(num: number, modalidadeSlug: string): string {
  if (modalidadeSlug === "lotomania" && num === 100) {
    return "00";
  }
  return String(num).padStart(2, "0");
}

export function inferirSlugPorNome(nomeOuSlug?: string): string {
  if (!nomeOuSlug) return "mega-sena";
  const limpo = nomeOuSlug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (limpo.includes("lotofacil")) return "lotofacil";
  if (limpo.includes("quina")) return "quina";
  if (limpo.includes("lotomania")) return "lotomania";
  if (limpo.includes("dupla")) return "dupla-sena";
  return "mega-sena";
}

export function parseJogosExternos(texto: string, modalidadeSlug: string): ResultadoParseExterno {
  const config = MODALIDADES_CONFIG[modalidadeSlug] || MODALIDADES_CONFIG["mega-sena"];
  const linhas = (texto || "").split(/\r?\n/);
  const validos: number[][] = [];
  const erros: LinhaParseErro[] = [];

  linhas.forEach((linhaBruta, idx) => {
    const linhaTrim = linhaBruta.trim();
    if (!linhaTrim) return;

    // Remove prefixos comuns de IA/listas: "Jogo 01:", "Jogo 1 (Mega-Sena):", "Cartão #2 -", "1)", "03."
    const semPrefixo = linhaTrim.replace(
      /^(?:[-*•]\s*)?(?:(?:jogo|cart[aã]o|aposta|palpite|combina[cç][aã]o)\s*#?\s*\d+(?:\s*\([^)]*\))?\s*[:.\-–)]\s*|\(?#?\d+\)?\s*[:.)\-–]\s*)/i,
      ""
    );

    const matches = semPrefixo.match(/\d+/g);
    if (!matches || matches.length < 2) {
      // Ignora linhas puramente conversacionais de IA (ex: "Aqui estão seus jogos:")
      return;
    }

    const dezenas: number[] = [];
    for (const token of matches) {
      let valor = parseInt(token, 10);
      if (Number.isNaN(valor)) continue;

      if (config.slug === "lotomania" && valor === 0) {
        valor = 100;
      }

      if (valor < 1 || valor > config.totalDezenasGlobo) {
        erros.push({
          linhaNumero: idx + 1,
          conteudo: linhaTrim,
          motivo: `Dezena "${token}" fora do intervalo (1 a ${config.totalDezenasGlobo}).`,
        });
        return;
      }
      dezenas.push(valor);
    }

    if (new Set(dezenas).size !== dezenas.length) {
      erros.push({
        linhaNumero: idx + 1,
        conteudo: linhaTrim,
        motivo: "Contém dezenas repetidas na mesma linha.",
      });
      return;
    }

    if (dezenas.length < config.minDezenas || dezenas.length > config.maxDezenas) {
      const faixa =
        config.minDezenas === config.maxDezenas
          ? `${config.minDezenas}`
          : `entre ${config.minDezenas} e ${config.maxDezenas}`;
      erros.push({
        linhaNumero: idx + 1,
        conteudo: linhaTrim,
        motivo: `Encontradas ${dezenas.length} dezenas (${config.nome} exige ${faixa}).`,
      });
      return;
    }

    validos.push([...dezenas].sort((a, b) => a - b));
  });

  return { validos, erros };
}
