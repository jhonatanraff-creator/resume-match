import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

const MODEL = "qwen/qwen3.8-27b";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function asString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function asOptionalString(value: unknown) {
  const text = asString(value);

  return text || undefined;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter(Boolean);
}

function asBoolean(value: unknown) {
  return value === true;
}

function cleanJsonContent(content: string) {
  let cleaned = content.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    cleaned = cleaned.slice(
      firstBrace,
      lastBrace + 1,
    );
  }

  return cleaned;
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error:
            "A chave da Groq não está configurada.",
        },
        {
          status: 500,
        },
      );
    }

    const body = await request.json();

    const rawText =
      typeof body.rawText === "string"
        ? body.rawText.trim()
        : "";

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "O texto do currículo está vazio.",
        },
        {
          status: 400,
        },
      );
    }

    if (rawText.length > 50000) {
      return NextResponse.json(
        {
          error:
            "O currículo é grande demais para esta versão do MVP.",
        },
        {
          status: 400,
        },
      );
    }

    const prompt = `
Você é um mecanismo de EXTRAÇÃO DE DADOS DE CURRÍCULO.

Sua tarefa NÃO é escrever um currículo novo.

Sua tarefa NÃO é melhorar o texto.

Sua tarefa NÃO é resumir.

Sua tarefa NÃO é adaptar para vaga.

Sua tarefa é apenas interpretar o documento fornecido e organizar fielmente as informações existentes.

REGRAS ABSOLUTAS

1. Nunca invente informação.

2. Nunca invente:
- empresa
- cargo
- data
- responsabilidade
- ferramenta
- tecnologia
- metodologia
- competência
- formação
- curso
- idioma
- número
- percentual
- resultado
- conquista

3. Não transforme inferências em fatos.

4. Não use conhecimento externo sobre empresas ou cargos.

5. Não complete informações que não estejam presentes.

6. Preserve números e métricas exatamente como aparecem.

7. Preserve os nomes das empresas.

8. Preserve os cargos.

9. Preserve datas conforme aparecem no documento.

10. Quando uma informação estiver ambígua, use null, string vazia ou array vazio. Nunca adivinhe.

11. Remova ruído de extração como:
"Page 1 of 7"
"Page 2 of 7"
e outros marcadores técnicos de paginação.

12. Corrija apenas quebras de linha claramente provocadas pela extração do PDF.

13. "originalText" deve preservar o conteúdo daquela experiência o mais próximo possível do documento original.

14. "bullets" deve apenas separar e organizar fatos já existentes em "originalText".

15. Não reescreva bullets para parecerem melhores.

16. Não transforme atividades em resultados.

17. Não crie resumo profissional caso o documento não possua um resumo ou texto equivalente.

18. Skills só podem conter competências, ferramentas, métodos ou tecnologias explicitamente presentes no currículo.

19. Não derive uma competência apenas porque determinado cargo normalmente exige essa competência.

20. Não omita experiências simplesmente por parecerem pouco importantes.

21. Não omita formação ou cursos existentes.

FORMATO DE RESPOSTA

Responda SOMENTE com um objeto JSON válido.

Use exatamente esta estrutura:

{
  "name": "string",
  "headline": "string ou null",

  "contact": {
    "email": "string ou null",
    "phone": "string ou null",
    "location": "string ou null",
    "linkedin": "string ou null",
    "portfolio": "string ou null"
  },

  "summary": "string ou null",

  "experiences": [
    {
      "company": "string",
      "role": "string",
      "location": "string ou null",
      "startDate": "string ou null",
      "endDate": "string ou null",
      "current": true,
      "originalText": "string",
      "bullets": [
        "string"
      ]
    }
  ],

  "education": [
    {
      "institution": "string",
      "course": "string",
      "degree": "string ou null",
      "startDate": "string ou null",
      "endDate": "string ou null"
    }
  ],

  "courses": [
    {
      "institution": "string ou null",
      "name": "string",
      "date": "string ou null"
    }
  ],

  "skills": [
    "string"
  ],

  "languages": [
    "string"
  ]
}

IMPORTANTE

Não escreva explicações antes ou depois do JSON.

Não use markdown.

Não use bloco de código.

Não inclua comentários.

Não crie campos adicionais.

CURRÍCULO ORIGINAL:

${rawText}
    `.trim();

    const completion =
      await groq.chat.completions.create({
        model: MODEL,

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        reasoning_effort: "none",

        temperature: 0,

        max_completion_tokens: 10000,

        response_format: {
          type: "json_object",
        },
      });

    const content =
      completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error(
        "O modelo não retornou conteúdo.",
      );
    }

    const cleanedContent =
      cleanJsonContent(content);

    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error(
        "Resposta JSON inválida:",
        cleanedContent,
      );

      throw parseError;
    }

    const contact =
      parsed.contact &&
      typeof parsed.contact === "object"
        ? (parsed.contact as Record<
            string,
            unknown
          >)
        : {};

    const experiences = Array.isArray(
      parsed.experiences,
    )
      ? parsed.experiences
      : [];

    const education = Array.isArray(
      parsed.education,
    )
      ? parsed.education
      : [];

    const courses = Array.isArray(
      parsed.courses,
    )
      ? parsed.courses
      : [];

    const structuredResume = {
      name: asString(parsed.name),

      headline: asOptionalString(
        parsed.headline,
      ),

      contact: {
        email: asOptionalString(
          contact.email,
        ),

        phone: asOptionalString(
          contact.phone,
        ),

        location: asOptionalString(
          contact.location,
        ),

        linkedin: asOptionalString(
          contact.linkedin,
        ),

        portfolio: asOptionalString(
          contact.portfolio,
        ),
      },

      summary: asOptionalString(
        parsed.summary,
      ),

      experiences: experiences
        .filter(
          (item): item is Record<
            string,
            unknown
          > =>
            Boolean(
              item &&
                typeof item === "object",
            ),
        )
        .map((experience, index) => {
          const bullets = asStringArray(
            experience.bullets,
          );

          return {
            id: `exp-${index + 1}`,

            company: asString(
              experience.company,
            ),

            role: asString(
              experience.role,
            ),

            location: asOptionalString(
              experience.location,
            ),

            startDate: asOptionalString(
              experience.startDate,
            ),

            endDate: asOptionalString(
              experience.endDate,
            ),

            current: asBoolean(
              experience.current,
            ),

            originalText:
              asString(
                experience.originalText,
              ) || bullets.join("\n"),

            bullets,
          };
        })
        .filter(
          (experience) =>
            experience.company ||
            experience.role ||
            experience.originalText,
        ),

      education: education
        .filter(
          (item): item is Record<
            string,
            unknown
          > =>
            Boolean(
              item &&
                typeof item === "object",
            ),
        )
        .map((item, index) => ({
          id: `edu-${index + 1}`,

          institution: asString(
            item.institution,
          ),

          course: asString(
            item.course,
          ),

          degree: asOptionalString(
            item.degree,
          ),

          startDate: asOptionalString(
            item.startDate,
          ),

          endDate: asOptionalString(
            item.endDate,
          ),
        }))
        .filter(
          (item) =>
            item.institution ||
            item.course,
        ),

      courses: courses
        .filter(
          (item): item is Record<
            string,
            unknown
          > =>
            Boolean(
              item &&
                typeof item === "object",
            ),
        )
        .map((course, index) => ({
          id: `course-${index + 1}`,

          institution: asOptionalString(
            course.institution,
          ),

          name: asString(course.name),

          date: asOptionalString(
            course.date,
          ),
        }))
        .filter((course) => course.name),

      skills: asStringArray(
        parsed.skills,
      ),

      languages: asStringArray(
        parsed.languages,
      ),

      rawText,
    };

    if (!structuredResume.name) {
      console.warn(
        "A IA não identificou o nome do candidato.",
      );
    }

    if (
      structuredResume.experiences
        .length === 0
    ) {
      console.warn(
        "Nenhuma experiência foi identificada.",
      );
    }

    return NextResponse.json({
      model: MODEL,
      resume: structuredResume,
    });
  } catch (error) {
    console.error(
      "Erro ao estruturar currículo:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    return NextResponse.json(
      {
        error:
          "Não foi possível estruturar o currículo com IA.",

        detail:
          process.env.NODE_ENV ===
          "development"
            ? message
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}