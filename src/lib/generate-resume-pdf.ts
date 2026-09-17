import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import type {
  AdaptedResume,
  StructuredResume,
} from "@/types/resume";

type GenerateResumePdfInput = {
  baseResume: StructuredResume;
  adaptedResume?: AdaptedResume;
  title: string;
  company?: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_X = 54;
const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 44;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN_X * 2;

const BLACK = rgb(0, 0, 0);

const DARK_GRAY =
  rgb(0.18, 0.18, 0.18);

const MEDIUM_GRAY =
  rgb(0.42, 0.42, 0.42);

const LIGHT_GRAY =
  rgb(0.84, 0.84, 0.84);

function normalizeText(
  value: string,
  font: PDFFont,
) {
  const replacements: Record<
    string,
    string
  > = {
    "–": "-",
    "—": "-",
    "−": "-",
    "“": '"',
    "”": '"',
    "‘": "'",
    "’": "'",
    "•": "-",
    "·": "-",
    "→": "->",
    "←": "<-",
    "✓": "",
    "✔": "",
    "✕": "",
    "×": "x",
    "\u00A0": " ",
  };

  let text =
    value ?? "";

  for (
    const [from, to]
    of Object.entries(
      replacements,
    )
  ) {
    text =
      text
        .split(from)
        .join(to);
  }

  let safe = "";

  for (
    const character
    of text
  ) {
    try {
      font.encodeText(
        character,
      );

      safe += character;
    } catch {
      safe += " ";
    }
  }

  return safe
    .replace(
      /[ \t]+/g,
      " ",
    )
    .trim();
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const words =
    normalizeText(
      text,
      font,
    )
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return [""];
  }

  const lines: string[] =
    [];

  let line = "";

  for (
    const word
    of words
  ) {
    const candidate =
      line
        ? `${line} ${word}`
        : word;

    const width =
      font.widthOfTextAtSize(
        candidate,
        size,
      );

    if (
      width <= maxWidth
    ) {
      line = candidate;
    } else {
      if (line) {
        lines.push(line);
      }

      line = word;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function safeFilename(
  text: string,
) {
  return text
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-zA-Z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    )
    .toLowerCase();
}

function downloadPdf(
  bytes: Uint8Array,
  filename: string,
) {
  const arrayBuffer =
    new ArrayBuffer(
      bytes.byteLength,
    );

  new Uint8Array(
    arrayBuffer,
  ).set(
    bytes,
  );

  const blob =
    new Blob(
      [arrayBuffer],
      {
        type: "application/pdf",
      },
    );

  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href = url;
  anchor.download =
    filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(
    url,
  );
}

function formatPeriod(
  start?: string,
  end?: string,
  current?: boolean,
) {
  const parts: string[] =
    [];

  if (start) {
    parts.push(start);
  }

  if (current) {
    parts.push("Atual");
  } else if (end) {
    parts.push(end);
  }

  return parts.join(
    " - ",
  );
}

export async function generateResumePdf({
  baseResume,
  adaptedResume,
  title,
  company,
}: GenerateResumePdfInput) {
  const pdf =
    await PDFDocument.create();

  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica,
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold,
    );

  pdf.setTitle(
    `Curriculo - ${baseResume.name}`,
  );

  pdf.setSubject(
    company
      ? `Curriculo para ${title} - ${company}`
      : `Curriculo para ${title}`,
  );

  pdf.setCreator(
    baseResume.name,
  );

  pdf.setProducer(
    baseResume.name,
  );

  const keywords =
    adaptedResume
      ?.supportedKeywords
      ?.slice(0, 20) ??
    [];

  pdf.setKeywords([
    "curriculo",
    "resume",
    title,
    ...keywords,
  ]);

  let page: PDFPage =
    pdf.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  let y =
    PAGE_HEIGHT -
    MARGIN_TOP;

  function newPage() {
    page =
      pdf.addPage([
        PAGE_WIDTH,
        PAGE_HEIGHT,
      ]);

    y =
      PAGE_HEIGHT -
      MARGIN_TOP;
  }

  function ensureSpace(
    height: number,
  ) {
    if (
      y - height <
      MARGIN_BOTTOM
    ) {
      newPage();
    }
  }

  function drawWrappedText({
    text,
    font = regular,
    size = 9.7,
    lineHeight = 14,
    color = BLACK,
    x = MARGIN_X,
    maxWidth = CONTENT_WIDTH,
  }: {
    text: string;
    font?: PDFFont;
    size?: number;
    lineHeight?: number;
    color?: ReturnType<
      typeof rgb
    >;
    x?: number;
    maxWidth?: number;
  }) {
    const lines =
      wrapText(
        text,
        font,
        size,
        maxWidth,
      );

    for (
      const line
      of lines
    ) {
      ensureSpace(
        lineHeight,
      );

      page.drawText(
        line,
        {
          x,
          y,
          size,
          font,
          color,
        },
      );

      y -= lineHeight;
    }
  }

  function drawSectionTitle(
    label: string,
  ) {
    ensureSpace(42);

    y -= 16;

    page.drawText(
      normalizeText(
        label.toUpperCase(),
        bold,
      ),
      {
        x: MARGIN_X,
        y,
        size: 10,
        font: bold,
        color: BLACK,
      },
    );

    y -= 10;

    page.drawLine({
      start: {
        x: MARGIN_X,
        y,
      },

      end: {
        x:
          PAGE_WIDTH -
          MARGIN_X,
        y,
      },

      thickness: 0.7,
      color: LIGHT_GRAY,
    });

    y -= 16;
  }

  function drawBullet(
    text: string,
  ) {
    const indent = 12;

    const lines =
      wrapText(
        text,
        regular,
        9.5,
        CONTENT_WIDTH -
          indent,
      );

    ensureSpace(
      lines.length * 13 +
        4,
    );

    page.drawText(
      "-",
      {
        x: MARGIN_X,
        y,
        size: 9.5,
        font: regular,
        color: BLACK,
      },
    );

    for (
      const line
      of lines
    ) {
      page.drawText(
        line,
        {
          x:
            MARGIN_X +
            indent,
          y,
          size: 9.5,
          font: regular,
          color: DARK_GRAY,
        },
      );

      y -= 13;
    }

    y -= 3;
  }

  /*
    CABEÇALHO
  */

  drawWrappedText({
    text:
      baseResume.name,
    font: bold,
    size: 22,
    lineHeight: 25,
    color: BLACK,
  });

  const finalHeadline =
    adaptedResume
      ?.headline ||
    baseResume.headline;

  if (finalHeadline) {
    y -= 2;

    drawWrappedText({
      text:
        finalHeadline,
      font: bold,
      size: 11,
      lineHeight: 15,
      color: DARK_GRAY,
    });
  }

  const contactParts =
    [
      baseResume.contact.email,
      baseResume.contact.phone,
      baseResume.contact.location,
    ].filter(
      Boolean,
    ) as string[];

  if (
    contactParts.length
  ) {
    y -= 8;

    drawWrappedText({
      text:
        contactParts.join(
          " | ",
        ),
      size: 8.8,
      lineHeight: 12,
      color: MEDIUM_GRAY,
    });
  }

  const linkParts =
    [
      baseResume.contact.linkedin,
      baseResume.contact.portfolio,
    ].filter(
      Boolean,
    ) as string[];

  if (
    linkParts.length
  ) {
    drawWrappedText({
      text:
        linkParts.join(
          " | ",
        ),
      size: 8.8,
      lineHeight: 12,
      color: MEDIUM_GRAY,
    });
  }

  y -= 12;

  page.drawLine({
    start: {
      x: MARGIN_X,
      y,
    },

    end: {
      x:
        PAGE_WIDTH -
        MARGIN_X,
      y,
    },

    thickness: 1,
    color: BLACK,
  });

  y -= 10;

  /*
    RESUMO
  */

  const finalSummary =
    adaptedResume
      ?.summary ||
    baseResume.summary;

  if (finalSummary) {
    drawSectionTitle(
      "Resumo",
    );

    drawWrappedText({
      text:
        finalSummary,
      size: 9.7,
      lineHeight: 14,
      color: DARK_GRAY,
    });
  }

  /*
    EXPERIÊNCIA
  */

  if (
    baseResume.experiences
      .length
  ) {
    drawSectionTitle(
      "Experiência",
    );

    for (
      const experience
      of baseResume.experiences
    ) {
      ensureSpace(70);

      const adapted =
        adaptedResume
          ?.experiences
          .find(
            (
              item,
            ) =>
              item.experienceId ===
              experience.id,
          );

      drawWrappedText({
        text:
          experience.role,
        font: bold,
        size: 11,
        lineHeight: 14,
        color: BLACK,
      });

      y -= 1;

      drawWrappedText({
        text:
          experience.company,
        font: bold,
        size: 9.4,
        lineHeight: 12,
        color: DARK_GRAY,
      });

      const secondaryParts =
        [
          experience.location,
          formatPeriod(
            experience.startDate,
            experience.endDate,
            experience.current,
          ),
        ].filter(
          Boolean,
        ) as string[];

      if (
        secondaryParts.length
      ) {
        drawWrappedText({
          text:
            secondaryParts.join(
              " | ",
            ),
          size: 8.6,
          lineHeight: 11,
          color: MEDIUM_GRAY,
        });
      }

      y -= 7;

      const bullets =
        adapted
          ?.adaptedBullets
          ?.length
          ? adapted.adaptedBullets
          : experience.bullets;

      for (
        const bullet
        of bullets
      ) {
        drawBullet(
          bullet,
        );
      }

      y -= 12;
    }
  }

  /*
    FORMAÇÃO
  */

  if (
    baseResume.education
      .length
  ) {
    drawSectionTitle(
      "Formação",
    );

    for (
      const education
      of baseResume.education
    ) {
      ensureSpace(48);

      drawWrappedText({
        text:
          education.course,
        font: bold,
        size: 10.5,
        lineHeight: 14,
        color: BLACK,
      });

      const institutionLine =
        [
          education.degree,
          education.institution,
        ]
          .filter(Boolean)
          .join(" | ");

      if (institutionLine) {
        drawWrappedText({
          text:
            institutionLine,
          font: bold,
          size: 9,
          lineHeight: 12,
          color: DARK_GRAY,
        });
      }

      const educationPeriod =
        formatPeriod(
          education.startDate,
          education.endDate,
        );

      if (educationPeriod) {
        drawWrappedText({
          text:
            educationPeriod,
          size: 8.6,
          lineHeight: 11,
          color: MEDIUM_GRAY,
        });
      }

      y -= 10;
    }
  }

  /*
    CURSOS
  */

  if (
    baseResume.courses.length
  ) {
    drawSectionTitle(
      "Cursos",
    );

    for (
      const course
      of baseResume.courses
    ) {
      const primary =
        [
          course.name,
          course.institution,
        ]
          .filter(Boolean)
          .join(" | ");

      if (primary) {
        drawWrappedText({
          text:
            primary,
          font: bold,
          size: 9.3,
          lineHeight: 12,
          color: DARK_GRAY,
        });
      }

      if (course.date) {
        drawWrappedText({
          text:
            course.date,
          size: 8.5,
          lineHeight: 11,
          color: MEDIUM_GRAY,
        });
      }

      y -= 8;
    }
  }

  /*
    COMPETÊNCIAS
  */

  const finalSkills =
    adaptedResume
      ?.skills
      ?.length
      ? adaptedResume.skills
      : baseResume.skills;

  if (
    finalSkills.length
  ) {
    drawSectionTitle(
      "Competências",
    );

    drawWrappedText({
      text:
        finalSkills.join(
          " | ",
        ),
      size: 9.3,
      lineHeight: 14,
      color: DARK_GRAY,
    });
  }

  /*
    IDIOMAS
  */

  if (
    baseResume.languages
      .length
  ) {
    drawSectionTitle(
      "Idiomas",
    );

    drawWrappedText({
      text:
        baseResume.languages.join(
          " | ",
        ),
      size: 9.3,
      lineHeight: 14,
      color: DARK_GRAY,
    });
  }

  /*
    Somente número da página.
    Sem assinatura, logo, marca d'água
    ou texto "gerado por".
  */

  const pages =
    pdf.getPages();

  pages.forEach(
    (
      currentPage,
      index,
    ) => {
      const pageLabel =
        `${index + 1}/${pages.length}`;

      currentPage.drawText(
        pageLabel,
        {
          x:
            PAGE_WIDTH -
            MARGIN_X -
            18,
          y: 20,
          size: 7,
          font: regular,
          color: MEDIUM_GRAY,
        },
      );
    },
  );

  const bytes =
    await pdf.save();

  const filename =
    safeFilename(
      [
        baseResume.name,
        title,
        company,
      ]
        .filter(Boolean)
        .join("-"),
    );

  downloadPdf(
    bytes,
    `${filename || "curriculo"}.pdf`,
  );
}