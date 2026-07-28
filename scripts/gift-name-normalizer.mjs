const lowercaseWords = new Set([
  "a",
  "ao",
  "aos",
  "as",
  "às",
  "com",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "em",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "para",
  "por",
  "sem"
]);

const wordReplacements = {
  aco: "Aço",
  agua: "Água",
  arroz: "Arroz",
  aureo: "Áureo",
  baú: "Baú",
  bau: "Baú",
  britania: "Britânia",
  "britânia": "Britânia",
  bvp02l: "BVP02L",
  cafe: "Café",
  cha: "Chá",
  eletrica: "Elétrica",
  elétrica: "Elétrica",
  eletronica: "Eletrônica",
  eletrônica: "Eletrônica",
  eletrolux: "Electrolux",
  electrolux: "Electrolux",
  espatulas: "Espátulas",
  espátulas: "Espátulas",
  hermetico: "Hermético",
  hermético: "Hermético",
  hermeticos: "Herméticos",
  herméticos: "Herméticos",
  l: "L",
  lencol: "Lençol",
  lençol: "Lençol",
  liquido: "Líquido",
  líquido: "Líquido",
  louca: "Louça",
  louças: "Louças",
  loucas: "Louças",
  microondas: "Micro-ondas",
  "micro-ondas": "Micro-ondas",
  ml: "ml",
  óleo: "Óleo",
  oleo: "Óleo",
  pe12g: "PE12G",
  pecas: "Peças",
  peças: "Peças",
  pó: "Pó",
  po: "Pó",
  portatil: "Portátil",
  portátil: "Portátil",
  retratil: "Retrátil",
  retrátil: "Retrátil",
  suica: "Suíça",
  suiça: "Suíça",
  suíte: "Suíte",
  suite: "Suíte",
  tabua: "Tábua",
  tábua: "Tábua",
  utensilios: "Utensílios",
  utensílios: "Utensílios",
  versati: "Versáti",
  versáti: "Versáti",
  xicara: "Xícara",
  xícara: "Xícara"
};

function toTitleCase(word) {
  const lower = word.toLocaleLowerCase("pt-BR");
  return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
}

function normalizeWord(word, isSegmentStart, isFirstWord) {
  if (word.includes("/")) {
    return word
      .split("/")
      .map((part) => normalizeWord(part, true, isFirstWord))
      .join("/");
  }

  const unitMatch = word.match(/^(\d+(?:[,.]\d+)?)(ml|l)$/i);
  if (unitMatch) {
    const value = unitMatch[1].replace(".", ",");
    const unit = unitMatch[2].toLocaleLowerCase("pt-BR") === "ml" ? "ml" : "L";
    return `${value} ${unit}`;
  }

  if (/^\d+$/.test(word)) {
    return word;
  }

  const lower = word.toLocaleLowerCase("pt-BR");
  const replacement = wordReplacements[lower];

  if (replacement) {
    return replacement;
  }

  if (!isFirstWord && lowercaseWords.has(lower)) {
    return lower;
  }

  return toTitleCase(word);
}

export function normalizeGiftName(value) {
  const normalized = String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bp\/\s*/gi, "para ")
    .replace(/\bmicro\s*ondas\b/gi, "microondas")
    .replace(/\s*\+\s*/g, " + ")
    .replace(/\s+[-–]\s+/g, " - ");

  const words = normalized.split(" ");
  const result = [];
  let isSegmentStart = true;
  let isFirstWord = true;

  for (const word of words) {
    if (word === "+" || word === "-" || word === "–") {
      result.push(word === "–" ? "-" : word);
      isSegmentStart = true;
      continue;
    }

    result.push(normalizeWord(word, isSegmentStart, isFirstWord));
    isFirstWord = false;

    if (!/^\d+$/.test(word)) {
      isSegmentStart = false;
    }
  }

  return result.join(" ").replace(/\s+/g, " ").trim();
}
