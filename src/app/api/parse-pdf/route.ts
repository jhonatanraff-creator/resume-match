import { NextResponse } from "next/server";
import { extractText } from "unpdf";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PAGES = 30;

export async function POST(request: Request) {
  try {
    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Nenhum arquivo foi enviado.",
        },
        {
          status: 400,
        },
      );
    }

    const isPdf =
      file.type ===
        "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          error:
            "O arquivo precisa estar em formato PDF.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "O arquivo precisa ter no máximo 5 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const arrayBuffer =
      await file.arrayBuffer();

    const pdfData =
      new Uint8Array(
        arrayBuffer,
      );

    const result =
      await extractText(
        pdfData,
        {
          mergePages: true,
        },
      );

    if (
      result.totalPages >
      MAX_PAGES
    ) {
      return NextResponse.json(
        {
          error:
            `O currículo possui ${result.totalPages} páginas. O limite é de ${MAX_PAGES}.`,
        },
        {
          status: 400,
        },
      );
    }

    const text =
      result.text.trim();

    if (!text) {
      return NextResponse.json(
        {
          error:
            "Não encontramos texto neste PDF. Tente exportar novamente o currículo ou envie outro arquivo.",
        },
        {
          status: 422,
        },
      );
    }

    return NextResponse.json({
      fileName:
        file.name,

      fileSize:
        file.size,

      pages:
        result.totalPages,

      text,
    });
  } catch (error) {
    console.error(
      "Erro ao processar PDF:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível ler este PDF.",
      },
      {
        status: 500,
      },
    );
  }
}