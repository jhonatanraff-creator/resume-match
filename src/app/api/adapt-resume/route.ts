import { NextResponse } from "next/server";

import type {
  AdaptedExperience,
  AdaptedResume,
  JobRequirement,
  StructuredResume,
} from "@/types/resume";

export const runtime = "nodejs";

const GROQ_MODEL = "qwen/qwen3.8-27b";

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const REQUEST_TIMEOUT_MS = 60_000;

type RequestBody = {
  resume?: StructuredResume;

  job?: {
    title?: string;
    company?: string;
    description?: string;
  };
};

type RawRequirement = {
  requirement?: unknown;
  importance?: unknown;
  evidence?: unknown;
  evidenceSource?: unknown;
  notes?: unknown;
};

type RawChange = {
  original?: unknown;
  adapted?: unknown;
  reason?: unknown;
};

type RawAdaptedExperience = {
  experienceId?: unknown;
  adaptedBullets?: unknown;
  changes?: unknown;
};

type GroqResponse = {
  model?: string;

  choices?: Array<{
    finish_reason?: string | null;

    message?: {
      content?: string | null;
    };
  }>;

  error?: {
    message?: string;
    code?: number | string;
  };
};

function asString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter(Boolean);
}

function normalizeImportance(
  value: unknown,
): JobRequirement["importance"] {
  if (value === "essential") {
    return "essential";
  }

  if (value === "preferred") {
    return "preferred";
  }

  return "contextual";
}

function normalizeEvidence(
  value: unknown,
): JobRequirement["evidence"] {
  if (value === "strong") {
    return "strong";
  }

  if (value === "partial") {
    return "partial";
  }

  return "none";
}

function cleanJsonContent(content: string) {
  let cleaned = content.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace =
    cleaned.indexOf("{");

  const lastBrace =
    cleaned.lastIndexOf("}");

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

function calculateCompatibility(
  requirements: JobRequirement[],
) {
  if (requirements.length === 0) {
    return {
      score: 0,
      matched: 0,
      partial: 0,
      missing: 0,
    };
  }

  let earned = 0;
  let possible = 0;

  let matched = 0;
  let partial = 0;
  let missing = 0;

  for (const requirement of requirements) {
    const weight =
      requirement.importance === "essential"
        ? 3
        : requirement.importance === "preferred"
          ? 2
          : 1;

    possible += weight;

    if (requirement.evidence === "strong") {
      earned += weight;
      matched += 1;
    } else if (
      requirement.evidence === "partial"
    ) {
      earned += weight * 0.5;
      partial += 1;
    } else {
      missing += 1;
    }
  }

  const score =
    possible === 0
      ? 0
      : Math.round(
          (earned / possible) * 100,
        );

  return {
    score,
    matched,
    partial,
    missing,
  };
}

function normalizeSkills(
  suggestedSkills: string[],
  originalSkills: string[],
) {
  const originalMap = new Map(
    originalSkills.map((skill) => [
      skill
        .trim()
        .toLocaleLowerCase("pt-BR"),

      skill,
    ]),
  );

  const result: string[] = [];

  for (const suggested of suggestedSkills) {
    const original =
      originalMap.get(
        suggested
          .trim()
          .toLocaleLowerCase("pt-BR"),
      );

    if (
      original &&
      !result.includes(original)
    ) {
      result.push(original);
    }
  }

  for (const original of originalSkills) {
    if (!result.includes(original)) {
      result.push(original);
    }
  }

  return result;
}

async function callGroq(
  prompt: string,
  attempt: number,
) {
  const apiKey =
    process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY não foi encontrada no ambiente.",
    );
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

  try {
    const response = await fetch(
      GROQ_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${apiKey}`,
        },

        signal:
          controller.signal,

        body: JSON.stringify({
          model:
            GROQ_MODEL,

          messages: [
            {
              role: "user",
              content: `
Você é o motor de alinhamento semântico de currículos do Resume Match.

Responda somente com o objeto JSON solicitado.
Não use Markdown.
Não escreva explicações fora do JSON.
Não exponha raciocínio.

${prompt}
              `.trim(),
            },
          ],

          temperature: 0,

          max_completion_tokens:
            attempt === 1
              ? 12000
              : 15000,

          reasoning_effort:
            "none",

          response_format: {
            type: "json_schema",

            json_schema: {
              name:
                "resume_match_adaptation",

              strict: true,

              schema: {
                type: "object",
                additionalProperties: false,

                properties: {
                  headline: {
                    type: "string",
                  },

                  summary: {
                    type: "string",
                  },

                  requirements: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        requirement: {
                          type: "string",
                        },
                        importance: {
                          type: "string",
                          enum: [
                            "essential",
                            "preferred",
                            "contextual",
                          ],
                        },
                        evidence: {
                          type: "string",
                          enum: [
                            "strong",
                            "partial",
                            "none",
                          ],
                        },
                        evidenceSource: {
                          type: "string",
                        },
                        notes: {
                          type: "string",
                        },
                      },
                      required: [
                        "requirement",
                        "importance",
                        "evidence",
                        "evidenceSource",
                        "notes",
                      ],
                    },
                  },

                  experiences: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        experienceId: {
                          type: "string",
                        },
                        adaptedBullets: {
                          type: "array",
                          items: {
                            type: "string",
                          },
                        },
                        changes: {
                          type: "array",
                          items: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                              original: {
                                type: "string",
                              },
                              adapted: {
                                type: "string",
                              },
                              reason: {
                                type: "string",
                              },
                            },
                            required: [
                              "original",
                              "adapted",
                              "reason",
                            ],
                          },
                        },
                      },
                      required: [
                        "experienceId",
                        "adaptedBullets",
                        "changes",
                      ],
                    },
                  },

                  skills: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },

                  supportedKeywords: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },

                  unsupportedKeywords: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },

                required: [
                  "headline",
                  "summary",
                  "requirements",
                  "experiences",
                  "skills",
                  "supportedKeywords",
                  "unsupportedKeywords",
                ],
              },
            },
          },
        }),
      },
    );

    let data: GroqResponse;

    try {
      data =
        (await response.json()) as
          GroqResponse;
    } catch {
      throw new Error(
        `Groq respondeu com status ${response.status}, mas sem JSON válido.`,
      );
    }

    console.log(
      `Groq tentativa ${attempt}/2 - model:`,
      data.model,
    );

    console.log(
      `Groq tentativa ${attempt}/2 - finish reason:`,
      data.choices?.[0]
        ?.finish_reason,
    );

    if (!response.ok) {
      const message =
        data.error?.message ||
        `Groq respondeu com status ${response.status}.`;

      throw new Error(message);
    }

    const content =
      data.choices?.[0]
        ?.message
        ?.content
        ?.trim() || "";

    if (!content) {
      throw new Error(
        "O Groq respondeu, mas não entregou conteúdo utilizável.",
      );
    }

    return {
      content,
      model:
        data.model || GROQ_MODEL,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error(
        `A análise ultrapassou ${REQUEST_TIMEOUT_MS / 1000} segundos.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as
        RequestBody;

    const resume = body.resume;
    const job = body.job;

    if (!resume) {
      return NextResponse.json(
        {
          error:
            "O currículo estruturado não foi enviado.",
        },
        {
          status: 400,
        },
      );
    }

    const jobTitle =
      asString(job?.title);

    const company =
      asString(job?.company);

    const jobDescription =
      asString(job?.description);

    if (!jobDescription) {
      return NextResponse.json(
        {
          error:
            "A descrição da vaga está vazia.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      jobDescription.length < 80
    ) {
      return NextResponse.json(
        {
          error:
            "A descrição da vaga é curta demais para uma análise confiável.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      jobDescription.length >
      15000
    ) {
      return NextResponse.json(
        {
          error:
            "A descrição da vaga ultrapassa 15.000 caracteres.",
        },
        {
          status: 400,
        },
      );
    }

    const resumeForAnalysis = {
      headline:
        resume.headline,

      summary:
        resume.summary,

      experiences:
        resume.experiences.map(
          (experience) => ({
            id:
              experience.id,

            company:
              experience.company,

            role:
              experience.role,

            location:
              experience.location,

            startDate:
              experience.startDate,

            endDate:
              experience.endDate,

            current:
              experience.current,

            originalText:
              experience.originalText,

            bullets:
              experience.bullets,
          }),
        ),

      education:
        resume.education,

      courses:
        resume.courses,

      skills:
        resume.skills,

      languages:
        resume.languages,
    };

    const prompt = `
Você é o motor de alinhamento semântico de currículos do Resume Match.

Analise o currículo e a vaga abaixo.

Crie uma versão direcionada do MESMO currículo.

A prioridade absoluta é preservar a verdade factual.

==================================================
REGRAS
==================================================

Toda afirmação precisa ser sustentada pelo currículo-base.

É permitido:

- reorganizar informações;
- priorizar experiências relevantes;
- reordenar bullets;
- melhorar clareza;
- aproximar terminologia;
- usar termos semanticamente equivalentes;
- destacar evidências existentes;
- combinar fatos relacionados apenas dentro da mesma experiência.

É proibido:

- inventar experiência;
- inventar competência;
- inventar ferramenta;
- inventar metodologia;
- inventar tecnologia;
- inventar domínio;
- inventar cliente;
- inventar liderança;
- inventar responsabilidade;
- inventar formação;
- inventar idioma;
- inventar resultado;
- inventar métrica;
- inventar percentual;
- inventar número;
- aumentar senioridade;
- transformar participação em liderança;
- transportar responsabilidades entre empresas.

==================================================
REQUISITOS
==================================================

Extraia requisitos reais da vaga.

Para cada requisito use:

importance:
"essential"
"preferred"
"contextual"

evidence:
"strong"
"partial"
"none"

Quando houver evidência, informe evidenceSource.

Quando não houver:

evidenceSource = ""

==================================================
EXPERIÊNCIAS
==================================================

Use somente IDs existentes no currículo.

Não crie experiências.

Não misture empresas.

Cada adaptedBullet deve ser sustentado pela própria experiência.

==================================================
HEADLINE
==================================================

Pode aproximar a headline da vaga somente se continuar factual.

Nunca aumente senioridade.

==================================================
RESUMO
==================================================

Crie um resumo direcionado de 2 a 4 frases usando somente fatos existentes.

==================================================
SKILLS
==================================================

Apenas reordene skills existentes.

Não crie novas.

==================================================
KEYWORDS
==================================================

supportedKeywords:
termos relevantes da vaga com sustentação real.

unsupportedKeywords:
termos relevantes da vaga sem sustentação suficiente.

==================================================
FORMATO OBRIGATÓRIO
==================================================

Retorne exatamente um objeto JSON neste formato:

{
  "headline": "",
  "summary": "",
  "requirements": [
    {
      "requirement": "",
      "importance": "essential",
      "evidence": "strong",
      "evidenceSource": "",
      "notes": ""
    }
  ],
  "experiences": [
    {
      "experienceId": "exp-1",
      "adaptedBullets": [
        ""
      ],
      "changes": [
        {
          "original": "",
          "adapted": "",
          "reason": ""
        }
      ]
    }
  ],
  "skills": [
    ""
  ],
  "supportedKeywords": [
    ""
  ],
  "unsupportedKeywords": [
    ""
  ]
}

Não escreva nada fora do JSON.

==================================================
CURRÍCULO
==================================================

${JSON.stringify(
  resumeForAnalysis,
  null,
  2,
)}

==================================================
VAGA
==================================================

Cargo:
${jobTitle || "Não informado"}

Empresa:
${company || "Não informada"}

Descrição:

${jobDescription}
    `.trim();

    let aiResult:
      Awaited<
        ReturnType<
          typeof callGroq
        >
      > | null = null;

    let parsed:
      Record<string, unknown> | null =
      null;

    let lastAttemptError:
      unknown = null;

    for (
      let attempt = 1;
      attempt <= 2;
      attempt += 1
    ) {
      try {
        const retryInstruction =
          attempt === 1
            ? ""
            : `

IMPORTANTE NESTA SEGUNDA TENTATIVA:
- responda de forma compacta;
- não escreva raciocínio;
- priorize no máximo 15 requisitos realmente relevantes da vaga;
- registre changes somente quando houver alteração real;
- mantenha bullets e justificativas curtos;
- entregue o JSON completo antes de atingir o limite de tokens.
            `.trim();

        const attemptPrompt =
          retryInstruction
            ? `${prompt}\n\n${retryInstruction}`
            : prompt;

        const result =
          await callGroq(
            attemptPrompt,
            attempt,
          );

        const cleaned =
          cleanJsonContent(
            result.content,
          );

        let candidate:
          Record<string, unknown>;

        try {
          candidate =
            JSON.parse(cleaned);
        } catch {
          console.error(
            `JSON inválido recebido do Groq na tentativa ${attempt}/2:`,
            cleaned.slice(
              0,
              4000,
            ),
          );

          throw new Error(
            "A IA respondeu, mas o JSON veio inválido.",
          );
        }

        aiResult =
          result;

        parsed =
          candidate;

        if (attempt > 1) {
          console.log(
            `Adaptação recuperada com sucesso na tentativa ${attempt}/2.`,
          );
        }

        break;
      } catch (
        attemptError
      ) {
        lastAttemptError =
          attemptError;

        console.error(
          `Falha na tentativa ${attempt}/2 do Groq:`,
          attemptError,
        );

        if (attempt < 2) {
          console.log(
            "Tentando novamente a adaptação com uma resposta mais compacta no Groq.",
          );
        }
      }
    }

    if (
      !aiResult ||
      !parsed
    ) {
      const lastMessage =
        lastAttemptError instanceof Error
          ? lastAttemptError.message
          : "Erro desconhecido.";

      throw new Error(
        `A adaptação falhou após 2 tentativas. ${lastMessage}`,
      );
    }

    const rawRequirements =
      Array.isArray(
        parsed.requirements,
      )
        ? (parsed.requirements as RawRequirement[])
        : [];

    const requirements:
      JobRequirement[] =
      rawRequirements
        .map(
          (
            requirement,
            index,
          ) => ({
            id:
              `req-${index + 1}`,

            requirement:
              asString(
                requirement.requirement,
              ),

            importance:
              normalizeImportance(
                requirement.importance,
              ),

            evidence:
              normalizeEvidence(
                requirement.evidence,
              ),

            evidenceSource:
              asString(
                requirement.evidenceSource,
              ) || undefined,

            notes:
              asString(
                requirement.notes,
              ) || undefined,
          }),
        )
        .filter(
          (requirement) =>
            requirement.requirement,
        );

    const rawExperiences =
      Array.isArray(
        parsed.experiences,
      )
        ? (parsed.experiences as RawAdaptedExperience[])
        : [];

    const generatedMap =
      new Map<
        string,
        RawAdaptedExperience
      >();

    for (
      const generated
      of rawExperiences
    ) {
      const id =
        asString(
          generated.experienceId,
        );

      if (id) {
        generatedMap.set(
          id,
          generated,
        );
      }
    }

    const adaptedExperiences:
      AdaptedExperience[] =
      resume.experiences.map(
        (experience) => {
          const generated =
            generatedMap.get(
              experience.id,
            );

          const generatedBullets =
            asStringArray(
              generated
                ?.adaptedBullets,
            );

          const adaptedBullets =
            generatedBullets.length > 0
              ? generatedBullets
              : experience.bullets;

          const rawChanges =
            Array.isArray(
              generated?.changes,
            )
              ? (generated?.changes as RawChange[])
              : [];

          const changes =
            rawChanges
              .map((change) => ({
                original:
                  asString(
                    change.original,
                  ),

                adapted:
                  asString(
                    change.adapted,
                  ),

                reason:
                  asString(
                    change.reason,
                  ),
              }))
              .filter(
                (change) =>
                  change.original &&
                  change.adapted,
              );

          return {
            experienceId:
              experience.id,

            company:
              experience.company,

            role:
              experience.role,

            originalBullets:
              experience.bullets,

            adaptedBullets,

            changes,
          };
        },
      );

    const skills =
      normalizeSkills(
        asStringArray(
          parsed.skills,
        ),

        resume.skills,
      );

    const supportedKeywords =
      Array.from(
        new Set(
          asStringArray(
            parsed.supportedKeywords,
          ),
        ),
      );

    const unsupportedKeywords =
      Array.from(
        new Set(
          asStringArray(
            parsed.unsupportedKeywords,
          ),
        ),
      );

    const compatibility =
      calculateCompatibility(
        requirements,
      );

    const generatedHeadline =
      asString(
        parsed.headline,
      );

    const generatedSummary =
      asString(
        parsed.summary,
      );

    const adaptedResume:
      AdaptedResume = {
      jobTitle:
        jobTitle ||
        "Vaga sem título",

      company:
        company || undefined,

      headline:
        generatedHeadline ||
        resume.headline,

      summary:
        generatedSummary ||
        resume.summary,

      experiences:
        adaptedExperiences,

      education:
        resume.education,

      courses:
        resume.courses,

      skills,

      requirements,

      supportedKeywords,

      unsupportedKeywords,

      compatibility,
    };

    return NextResponse.json({
      provider:
        "groq",

      model:
        aiResult.model,

      adaptedResume,
    });
  } catch (error) {
    console.error(
      "Erro ao adaptar currículo:",
      error,
    );

    const detail =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    return NextResponse.json(
      {
        error:
          "Não foi possível adaptar o currículo para esta vaga.",

        detail:
          process.env.NODE_ENV ===
          "development"
            ? detail
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}