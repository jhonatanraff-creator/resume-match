import {
  PDFDocument,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";

type GenerateResumePdfParams = {
  resumeText: string;
  jobTitle: string;
  company?: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 52;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 58;

const BODY_SIZE = 10;
const BODY_LINE_HEIGHT = 14.5;

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function replaceCommonUnicode(value: string) {
  return value
    .replace(/\u00A0/g, " ")
    .replace(/[–—−]/g, "-")
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/…/g, "...")
    .replace(/[•◦▪●]/g, "-")
    .replace(/[→➜➝]/g, "->")
    .replace(/[←]/g, "<-")
    .replace(/[✓✔]/g, "OK")
    .replace(/[✕✖×]/g, "x")
    .replace(/\u200B/g, "")
    .replace(/\uFEFF/g, "");
}

function makePdfSafe(
  value: string,
  font: PDFFont,
) {
  const normalized = replaceCommonUnicode(value);

  let safe = "";

  for (const character of normalized) {
    if (character === "\n") {
      safe += character;
      continue;
    }

    try {
      font.encodeText(character);
      safe += character;
    } catch {
      safe += "";
    }
  }

  return safe;
}

function wrapLine(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  const words = text
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine
      ? `${currentLine} ${word}`
      : word;

    const width = font.widthOfTextAtSize(
      candidate,
      fontSize,
    );

    if (width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // Evita quebrar o PDF caso exista uma URL ou palavra
    // extremamente longa sem espaços.
    if (
      font.widthOfTextAtSize(word, fontSize) >
      maxWidth
    ) {
      let chunk = "";

      for (const character of word) {
        const testChunk = chunk + character;

        if (
          font.widthOfTextAtSize(
            testChunk,
            fontSize,
          ) <= maxWidth
        ) {
          chunk = testChunk;
        } else {
          if (chunk) {
            lines.push(chunk);
          }

          chunk = character;
        }
      }

      currentLine = chunk;
    } else {
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function generateResumePdf({
  resumeText,
  jobTitle,
  company,
}: GenerateResumePdfParams) {
  const pdfDocument = await PDFDocument.create();

  const regularFont = await pdfDocument.embedFont(
    StandardFonts.Helvetica,
  );

  const boldFont = await pdfDocument.embedFont(
    StandardFonts.HelveticaBold,
  );

  const safeResumeText = makePdfSafe(
    resumeText,
    regularFont,
  );

  const safeJobTitle = makePdfSafe(
    jobTitle,
    boldFont,
  );

  const safeCompany = company
    ? makePdfSafe(company, regularFont)
    : "";

  let page = pdfDocument.addPage([
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ]);

  let y = PAGE_HEIGHT - MARGIN_TOP;

  const contentWidth =
    PAGE_WIDTH - MARGIN_X * 2;

  function addPage() {
    page = pdfDocument.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

    y = PAGE_HEIGHT - MARGIN_TOP;
  }

  function ensureSpace(height: number) {
    if (y - height < MARGIN_BOTTOM) {
      addPage();
    }
  }

  // Identificação discreta
  page.drawText("RESUME MATCH", {
    x: MARGIN_X,
    y,
    size: 8,
    font: boldFont,
    color: rgb(0.91, 0.26, 0.42),
  });

  y -= 26;

  // Vaga
  const titleLines = wrapLine(
    safeJobTitle,
    boldFont,
    18,
    contentWidth,
  );

  for (const line of titleLines) {
    ensureSpace(23);

    page.drawText(line, {
      x: MARGIN_X,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.09, 0.09, 0.09),
    });

    y -= 22;
  }

  if (safeCompany.trim()) {
    ensureSpace(20);

    page.drawText(
      `Versao para ${safeCompany}`,
      {
        x: MARGIN_X,
        y,
        size: 10,
        font: regularFont,
        color: rgb(0.4, 0.4, 0.38),
      },
    );

    y -= 24;
  }

  page.drawLine({
    start: {
      x: MARGIN_X,
      y,
    },
    end: {
      x: PAGE_WIDTH - MARGIN_X,
      y,
    },
    thickness: 0.7,
    color: rgb(0.86, 0.86, 0.84),
  });

  y -= 25;

  // Currículo
  const paragraphs = safeResumeText
    .replace(/\r/g, "")
    .split("\n");

  for (const paragraph of paragraphs) {
    const cleanParagraph =
      paragraph.trim();

    if (!cleanParagraph) {
      y -= BODY_LINE_HEIGHT * 0.65;

      if (y < MARGIN_BOTTOM) {
        addPage();
      }

      continue;
    }

    const lines = wrapLine(
      cleanParagraph,
      regularFont,
      BODY_SIZE,
      contentWidth,
    );

    for (const line of lines) {
      ensureSpace(BODY_LINE_HEIGHT);

      page.drawText(line, {
        x: MARGIN_X,
        y,
        size: BODY_SIZE,
        font: regularFont,
        color: rgb(0.18, 0.18, 0.17),
      });

      y -= BODY_LINE_HEIGHT;
    }

    y -= 3;
  }

  // Rodapé
  const pages = pdfDocument.getPages();

  pages.forEach((pdfPage, index) => {
    pdfPage.drawLine({
      start: {
        x: MARGIN_X,
        y: 38,
      },
      end: {
        x: PAGE_WIDTH - MARGIN_X,
        y: 38,
      },
      thickness: 0.5,
      color: rgb(0.88, 0.88, 0.86),
    });

    pdfPage.drawText(
      `Resume Match  |  ${index + 1}/${pages.length}`,
      {
        x: MARGIN_X,
        y: 22,
        size: 7.5,
        font: regularFont,
        color: rgb(0.55, 0.55, 0.52),
      },
    );
  });

  const pdfBytes = await pdfDocument.save({
    useObjectStreams: true,
  });

  const blob = new Blob(
    [new Uint8Array(pdfBytes)],
    {
      type: "application/pdf",
    },
  );

  const fileNameParts = [
    "curriculo",
    sanitizeFileName(jobTitle),
  ];

  if (company?.trim()) {
    fileNameParts.push(
      sanitizeFileName(company),
    );
  }

  const fileName =
    `${fileNameParts.join("-")}.pdf`;

  const url = URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return {
    fileName,
    size: blob.size,
  };
}