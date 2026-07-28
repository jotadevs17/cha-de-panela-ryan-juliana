import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { eventDetails } from "@/lib/event";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type GuestRow = {
  number: number;
  name: string;
  lines: string[];
  height: number;
};

type GuestPage = {
  rows: GuestRow[];
};

const pageWidth = 595;
const pageHeight = 842;
const marginX = 40;
const contentWidth = pageWidth - marginX * 2;
const tableTop = 198;
const tableHeaderHeight = 26;
const tableBottomLimit = 770;
const numberColumnWidth = 48;
const entryColumnWidth = 88;
const nameColumnWidth = contentWidth - numberColumnWidth - entryColumnWidth;

function unauthorized() {
  return NextResponse.json(
    { ok: false, message: "Acesso administrativo expirado. Entre novamente." },
    { status: 401 }
  );
}

function formatDateTime(value: Date) {
  return value.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function cleanText(value: string | number | null | undefined) {
  return String(value ?? "-")
    .replace(/\r?\n/g, " ")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?")
    .trim();
}

function rsvpAttendeeNames(rsvp: { attendeeNames: string[]; guestName: string }) {
  const names = rsvp.attendeeNames.length > 0 ? rsvp.attendeeNames : [rsvp.guestName];
  return names.map(cleanText).filter((name) => name.length > 0 && name !== "-");
}

function wrapText(text: string, maxLength = 58) {
  const words = cleanText(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (!current) {
      current = word;
      return;
    }

    if (`${current} ${word}`.length <= maxLength) {
      current = `${current} ${word}`;
      return;
    }

    lines.push(current);
    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : ["-"];
}

function buildGuestRows(guestNames: string[]) {
  return guestNames.map((name, index) => {
    const lines = wrapText(name);
    return {
      number: index + 1,
      name,
      lines,
      height: Math.max(32, 14 + lines.length * 12)
    };
  });
}

function paginateRows(rows: GuestRow[]) {
  const pages: GuestPage[] = [];
  let currentRows: GuestRow[] = [];
  let cursor = tableTop + tableHeaderHeight;

  rows.forEach((row) => {
    if (currentRows.length > 0 && cursor + row.height > tableBottomLimit) {
      pages.push({ rows: currentRows });
      currentRows = [];
      cursor = tableTop + tableHeaderHeight;
    }

    currentRows.push(row);
    cursor += row.height;
  });

  if (currentRows.length > 0) {
    pages.push({ rows: currentRows });
  }

  return pages.length > 0 ? pages : [{ rows: [] }];
}

function pdfEscape(value: string) {
  return cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function rgb(hex: string) {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)}`;
}

function yFromTop(top: number) {
  return pageHeight - top;
}

function rectFromTop(x: number, top: number, width: number, height: number) {
  return `${x} ${pageHeight - top - height} ${width} ${height} re`;
}

function fillRect(chunks: string[], x: number, top: number, width: number, height: number, color: string) {
  chunks.push(`${rgb(color)} rg ${rectFromTop(x, top, width, height)} f\n`);
}

function strokeRect(chunks: string[], x: number, top: number, width: number, height: number, color = "#d9e2c7", widthPt = 0.8) {
  chunks.push(`${rgb(color)} RG ${widthPt} w ${rectFromTop(x, top, width, height)} S\n`);
}

function drawText(
  chunks: string[],
  text: string,
  x: number,
  top: number,
  options: {
    size?: number;
    font?: "F1" | "F2";
    color?: string;
  } = {}
) {
  const size = options.size ?? 10;
  const font = options.font ?? "F1";
  const color = options.color ?? "#2f3528";
  chunks.push(`BT /${font} ${size} Tf ${rgb(color)} rg ${x} ${yFromTop(top)} Td (${pdfEscape(text)}) Tj ET\n`);
}

function drawLine(chunks: string[], x1: number, top1: number, x2: number, top2: number, color = "#d9e2c7", widthPt = 0.6) {
  chunks.push(`${rgb(color)} RG ${widthPt} w ${x1} ${yFromTop(top1)} m ${x2} ${yFromTop(top2)} l S\n`);
}

function drawHeader(chunks: string[], generatedAt: Date, totalGuests: number, pageNumber: number, totalPages: number) {
  fillRect(chunks, 0, 0, pageWidth, 92, "#3e4823");
  fillRect(chunks, 0, 88, pageWidth, 4, "#aebf78");

  drawText(chunks, "Lista de convidados", marginX, 36, {
    size: 23,
    font: "F2",
    color: "#ffffff"
  });
  drawText(chunks, eventDetails.title, marginX, 61, {
    size: 11,
    color: "#f1f4e7"
  });
  drawText(chunks, `${eventDetails.date} - ${eventDetails.time}`, 424, 38, {
    size: 11,
    font: "F2",
    color: "#ffffff"
  });
  drawText(chunks, `Página ${pageNumber} de ${totalPages}`, 440, 61, {
    size: 9,
    color: "#f1f4e7"
  });

  fillRect(chunks, marginX, 116, contentWidth, 54, "#f7f8ef");
  strokeRect(chunks, marginX, 116, contentWidth, 54, "#d9e2c7");
  drawText(chunks, `Evento: ${eventDetails.couple}`, marginX + 14, 136, {
    size: 10,
    font: "F2",
    color: "#4c5928"
  });
  drawText(chunks, `Local: ${eventDetails.place}`, marginX + 14, 153, {
    size: 9,
    color: "#58614f"
  });
  drawText(chunks, `Total de convidados: ${totalGuests}`, 398, 136, {
    size: 10,
    font: "F2",
    color: "#4c5928"
  });
  drawText(chunks, `Gerado em: ${formatDateTime(generatedAt)}`, 398, 153, {
    size: 8.5,
    color: "#58614f"
  });
}

function drawTableHeader(chunks: string[]) {
  fillRect(chunks, marginX, tableTop, contentWidth, tableHeaderHeight, "#edf1df");
  strokeRect(chunks, marginX, tableTop, contentWidth, tableHeaderHeight, "#cbd8a8");
  drawLine(chunks, marginX + numberColumnWidth, tableTop, marginX + numberColumnWidth, tableTop + tableHeaderHeight);
  drawLine(
    chunks,
    marginX + numberColumnWidth + nameColumnWidth,
    tableTop,
    marginX + numberColumnWidth + nameColumnWidth,
    tableTop + tableHeaderHeight
  );

  drawText(chunks, "Nº", marginX + 14, tableTop + 17, {
    size: 9,
    font: "F2",
    color: "#4c5928"
  });
  drawText(chunks, "Nome do convidado", marginX + numberColumnWidth + 12, tableTop + 17, {
    size: 9,
    font: "F2",
    color: "#4c5928"
  });
  drawText(chunks, "Entrada", marginX + numberColumnWidth + nameColumnWidth + 18, tableTop + 17, {
    size: 9,
    font: "F2",
    color: "#4c5928"
  });
}

function drawGuestRows(chunks: string[], rows: GuestRow[]) {
  let cursor = tableTop + tableHeaderHeight;

  if (rows.length === 0) {
    fillRect(chunks, marginX, cursor, contentWidth, 44, "#ffffff");
    strokeRect(chunks, marginX, cursor, contentWidth, 44, "#d9e2c7");
    drawText(chunks, "Nenhum convidado confirmado ainda.", marginX + 14, cursor + 27, {
      size: 10,
      color: "#58614f"
    });
    return;
  }

  rows.forEach((row, index) => {
    const fill = index % 2 === 0 ? "#ffffff" : "#fbfcf6";
    fillRect(chunks, marginX, cursor, contentWidth, row.height, fill);
    strokeRect(chunks, marginX, cursor, contentWidth, row.height, "#d9e2c7", 0.5);
    drawLine(chunks, marginX + numberColumnWidth, cursor, marginX + numberColumnWidth, cursor + row.height);
    drawLine(
      chunks,
      marginX + numberColumnWidth + nameColumnWidth,
      cursor,
      marginX + numberColumnWidth + nameColumnWidth,
      cursor + row.height
    );

    drawText(chunks, String(row.number).padStart(2, "0"), marginX + 13, cursor + 21, {
      size: 9.5,
      font: "F2",
      color: "#4c5928"
    });

    row.lines.forEach((line, lineIndex) => {
      drawText(chunks, line, marginX + numberColumnWidth + 12, cursor + 21 + lineIndex * 12, {
        size: 10.5,
        color: "#111827"
      });
    });

    const checkboxSize = 11;
    const checkboxX = marginX + numberColumnWidth + nameColumnWidth + 37;
    const checkboxTop = cursor + (row.height - checkboxSize) / 2;
    strokeRect(chunks, checkboxX, checkboxTop, checkboxSize, checkboxSize, "#aebf78", 0.9);

    cursor += row.height;
  });
}

function drawFooter(chunks: string[], pageNumber: number, totalPages: number) {
  drawLine(chunks, marginX, 802, pageWidth - marginX, 802, "#d9e2c7", 0.6);
  drawText(chunks, "Lista gerada automaticamente pelo site do Chá de Panela.", marginX, 818, {
    size: 8,
    color: "#68725d"
  });
  drawText(chunks, `${pageNumber}/${totalPages}`, pageWidth - marginX - 24, 818, {
    size: 8,
    color: "#68725d"
  });
}

function makePageContent(page: GuestPage, pageNumber: number, totalPages: number, generatedAt: Date, totalGuests: number) {
  const chunks: string[] = [];
  drawHeader(chunks, generatedAt, totalGuests, pageNumber, totalPages);
  drawTableHeader(chunks);
  drawGuestRows(chunks, page.rows);
  drawFooter(chunks, pageNumber, totalPages);
  return chunks.join("");
}

function buildPdf(rows: GuestRow[], generatedAt: Date) {
  const pages = paginateRows(rows);
  const pageRefs = pages.map((_, index) => ({
    pageId: 5 + index * 2,
    contentId: 6 + index * 2
  }));
  const maxObjectId = 4 + pageRefs.length * 2;
  const objects = new Map<number, Buffer>();

  objects.set(1, Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "ascii"));
  objects.set(
    2,
    Buffer.from(
      `<< /Type /Pages /Kids [${pageRefs.map((page) => `${page.pageId} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`,
      "ascii"
    )
  );
  objects.set(3, Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "ascii"));
  objects.set(4, Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "ascii"));

  pages.forEach((page, index) => {
    const refs = pageRefs[index];
    const content = Buffer.from(makePageContent(page, index + 1, pages.length, generatedAt, rows.length), "latin1");
    objects.set(
      refs.pageId,
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${refs.contentId} 0 R >>`,
        "ascii"
      )
    );
    objects.set(
      refs.contentId,
      Buffer.concat([
        Buffer.from(`<< /Length ${content.length} >>\nstream\n`, "ascii"),
        content,
        Buffer.from("\nendstream", "ascii")
      ])
    );
  });

  const buffers: Buffer[] = [Buffer.from("%PDF-1.4\n", "ascii")];
  const offsets = [0];
  let position = buffers[0].length;

  for (let id = 1; id <= maxObjectId; id += 1) {
    const body = objects.get(id);

    if (!body) {
      continue;
    }

    offsets[id] = position;
    const objectBuffer = Buffer.concat([
      Buffer.from(`${id} 0 obj\n`, "ascii"),
      body,
      Buffer.from("\nendobj\n", "ascii")
    ]);
    buffers.push(objectBuffer);
    position += objectBuffer.length;
  }

  const xrefOffset = position;
  const xref = [
    `xref\n0 ${maxObjectId + 1}`,
    "0000000000 65535 f ",
    ...Array.from({ length: maxObjectId }, (_, index) => {
      const offset = offsets[index + 1] ?? 0;
      return `${String(offset).padStart(10, "0")} 00000 n `;
    }),
    "trailer",
    `<< /Size ${maxObjectId + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF"
  ].join("\n");

  buffers.push(Buffer.from(xref, "ascii"));
  return Buffer.concat(buffers);
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  try {
    const rsvps = await prisma.attendanceConfirmation.findMany({
      orderBy: [{ createdAt: "asc" }]
    });

    const guestNames = rsvps
      .flatMap(rsvpAttendeeNames)
      .sort((first, second) => first.localeCompare(second, "pt-BR", { sensitivity: "base" }));

    const pdf = buildPdf(buildGuestRows(guestNames), new Date());

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lista-convidados-cha-de-panela.pdf"`
      }
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível exportar a lista de convidados agora." },
      { status: 500 }
    );
  }
}
