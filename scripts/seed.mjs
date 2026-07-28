import { PrismaClient, GiftStatus } from "@prisma/client";
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

function parseSemicolonCsv(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());

  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function toNullableString(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableInt(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function inferCategory(title) {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/air fryer|cafeteira|microondas|eletrica|purificador|aspirador|ventilador|umidificador|fondue/.test(normalized)) {
    return "Eletroportateis";
  }

  if (/toalha|edredom|lencol|cama|cortina/.test(normalized)) {
    return "Cama e banho";
  }

  if (/lixeira|cabide|organizador|cesto|porta tempero|dispenser|varal|escada/.test(normalized)) {
    return "Organizacao";
  }

  if (/aparelho de jantar|copos|caneca|prato|tigela|talher|bowls|bowl|taca|jarra|petisqueira|bandeja|porta frios/.test(normalized)) {
    return "Mesa posta";
  }

  if (/panela|assadeira|forma|facas|utensilio|escorredor|pote|tabua|spray|abridor|cortador|pipoqueira|saladeira/.test(normalized)) {
    return "Cozinha";
  }

  return "Casa";
}

async function main() {
  const crudData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const csvRows = parseSemicolonCsv(fs.readFileSync(csvPath, "utf8"));
  const giftsById = new Map(crudData.gifts.map((gift) => [String(gift.id), gift]));
  const upsertOnly = args.has("--upsert-only");

  if (!upsertOnly) {
    await prisma.reservation.deleteMany();
    await prisma.gift.deleteMany();
  }

  for (const row of csvRows) {
    const jsonGift = giftsById.get(row.id);
    const giftId = Number.parseInt(row.id, 10);
    const rawTitle = toNullableString(row.opcao_presente) ?? jsonGift?.giftTitle;
    const title = rawTitle ? normalizeGiftName(rawTitle) : null;
    const guestName = toNullableString(jsonGift?.guestName ?? row.nome_sobrenome);
    const isReserved = Boolean(jsonGift?.isReserved ?? row.preenchido === "true");

    if (!giftId || !title) {
      continue;
    }

    const giftData = {
      name: title,
      category: inferCategory(title),
      priceLabel: toNullableString(row.valor_formatado ?? jsonGift?.priceLabel),
      priceCents: toNullableInt(row.valor_centavos ?? jsonGift?.priceCents),
      sheetRow: toNullableInt(row.linha_planilha ?? jsonGift?.sheetRow)
    };

    if (upsertOnly) {
      await prisma.gift.upsert({
        where: {
          id: giftId
        },
        create: {
          id: giftId,
          ...giftData,
          status: isReserved ? GiftStatus.RESERVADO : GiftStatus.DISPONIVEL,
          reservation: isReserved && guestName
            ? {
                create: {
                  guestName
                }
              }
            : undefined
        },
        update: giftData
      });
      continue;
    }

    await prisma.gift.create({
      data: {
        id: giftId,
        ...giftData,
        status: isReserved ? GiftStatus.RESERVADO : GiftStatus.DISPONIVEL,
        reservation: isReserved && guestName
          ? {
              create: {
                guestName
              }
            }
          : undefined
      }
    });
  }

  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('presentes', 'id'), COALESCE((SELECT MAX(id) FROM presentes), 1), true);"
  );
  await prisma.$executeRawUnsafe(
    "SELECT setval(pg_get_serial_sequence('reservas', 'id'), COALESCE((SELECT MAX(id) FROM reservas), 1), true);"
  );

  const total = await prisma.gift.count();
  const reserved = await prisma.gift.count({ where: { status: GiftStatus.RESERVADO } });
  const available = total - reserved;

  console.log(
    `${upsertOnly ? "Sincronizacao" : "Seed"} concluido: ${total} presentes, ${available} disponiveis, ${reserved} reservados.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
