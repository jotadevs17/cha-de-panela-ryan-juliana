import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeGiftName } from "./gift-name-normalizer.mjs";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const jsonPath = path.join(rootDir, "cha_panela_dados_crud.json");
const csvPath = path.join(rootDir, "cha_panela_presentes.csv");
const args = new Set(process.argv.slice(2));

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ";" && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function formatCsvValue(header, value) {
  const rawValue = String(value ?? "");

  if (["id", "linha_planilha", "valor_centavos", "preenchido"].includes(header)) {
    return rawValue;
  }

  if (!rawValue) {
    return "";
  }

  return `"${rawValue.replace(/"/g, '""')}"`;
}

function syncCsv() {
  const lines = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  const giftIndex = headers.indexOf("opcao_presente");

  if (giftIndex === -1) {
    throw new Error("Coluna opcao_presente nao encontrada no CSV.");
  }

  const output = [
    headers.join(";"),
    ...lines.map((line) => {
      const values = parseCsvLine(line);
      values[giftIndex] = normalizeGiftName(values[giftIndex]);
      return headers.map((header, index) => formatCsvValue(header, values[index])).join(";");
    })
  ];

  fs.writeFileSync(csvPath, `${output.join("\n")}\n`);
}

function escapeJsonString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function syncJson() {
  const json = fs.readFileSync(jsonPath, "utf8");
  const output = json.replace(/("giftTitle":\s*")([^"]*)(")/g, (_match, prefix, title, suffix) => {
    return `${prefix}${escapeJsonString(normalizeGiftName(title))}${suffix}`;
  });

  fs.writeFileSync(jsonPath, output);
}

async function syncDatabase() {
  const gifts = await prisma.gift.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      id: "asc"
    }
  });

  let updated = 0;

  for (const gift of gifts) {
    const normalizedName = normalizeGiftName(gift.name);

    if (normalizedName === gift.name) {
      continue;
    }

    await prisma.gift.update({
      where: {
        id: gift.id
      },
      data: {
        name: normalizedName
      }
    });

    updated += 1;
    console.log(`#${gift.id}: ${gift.name} -> ${normalizedName}`);
  }

  console.log(`Nomes atualizados no banco: ${updated}`);
}

async function main() {
  if (args.has("--sources")) {
    syncCsv();
    syncJson();
    console.log("CSV e JSON sincronizados com nomes padronizados.");
  }

  if (args.has("--db")) {
    await syncDatabase();
  }

  if (!args.has("--sources") && !args.has("--db")) {
    console.log("Use --sources para atualizar CSV/JSON e/ou --db para atualizar o banco.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
