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

const REQUEST_TIMEOUT_MS = 75_000;
const MAX_RATE_LIMIT_WAIT_MS = 65_000;

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

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRateLimitWaitMs(
  response: Response,
  data: GroqResponse,
) {
  const retryAfter =
    response.headers.get("retry-after");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (
      Number.isFinite(seconds) &&
      seconds > 0
    ) {
      return Math.min(
        Math.ceil(seconds * 1000) + 1000,
        MAX_RATE_LIMIT_WAIT_MS,
      );
    }
  }

  const message =
    data.error?.message || "";

  const match =
    message.match(
      /try again in\s+([\d.]+)s/i,
    );

  if (match) {
    const seconds =
      Number(match[1]);

    if (
      Number.isFinite(seconds) &&
      seconds > 0
    ) {
      return Math.min(
        Math.ceil(seconds * 1000) + 1000,
        MAX_RATE_LIMIT_WAIT_MS,
      );
    }
  }

  return 60_000;
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

  for (
    let rateAttempt = 1;
    rateAttempt <= 2;
    rateAttempt += 1
  ) {
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
Responda somente com o JSON solicitado, sem Markdown, sem explicações e sem raciocínio exposto.

${prompt}
                `.trim(),
              },
            ],

            temperature: 0,

            max_completion_tokens:
              attempt === 1
                ? 4200
                : 3200,

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
                      maxItems: 15,
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
                            maxItems: 8,
                            items: {
                              type: "string",
                            },
                          },
                          changes: {
                            type: "array",
                            maxItems: 8,
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
                      maxItems: 20,
                      items: {
                        type: "string",
                      },
                    },

                    unsupportedKeywords: {
                      type: "array",
                      maxItems: 20,
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
        `Groq tentativa ${attempt}/2 - chamada ${rateAttempt}/2 - model:`,
        data.model,
      );

      console.log(
        `Groq tentativa ${attempt}/2 - chamada ${rateAttempt}/2 - finish reason:`,
        data.choices?.[0]
          ?.finish_reason,
      );

      if (
        response.status === 429 &&
        rateAttempt < 2
      ) {
        const waitMs =
          getRateLimitWaitMs(
            response,
            data,
          );

        console.warn(
          `Limite de tokens do Groq atingido. Aguardando ${Math.ceil(waitMs / 1000)}s antes de tentar novamente.`,
        );

        await sleep(waitMs);
        continue;
      }

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

  throw new Error(
    "Não foi possível concluir a chamada ao Groq.",
  );
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

            context:
              experience.originalText
                ? experience.originalText.slice(
                    0,
                    900,
                  )
                : "",

            bullets:
              experience.bullets
                .slice(0, 10)
                .map((bullet) =>
                  bullet.slice(0, 700),
                ),
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
Você é um especialista sênior em recrutamento, ATS, redação de currículo e alinhamento semântico entre experiência profissional e descrição de vaga.

Seu objetivo é aumentar a clareza, a relevância e a aderência do currículo à vaga SEM alterar a verdade factual. O resultado deve ser um currículo mais competitivo para esta oportunidade, não apenas um texto com palavras-chave parecidas.

Faça a análise em duas etapas internamente, mas retorne somente o JSON final:
1. compreenda o que a vaga realmente exige e identifique evidências concretas no currículo;
2. somente depois reescreva e priorize o currículo com base nessas evidências.

PRINCÍPIO CENTRAL:
Uma reformulação só é válida quando melhora a comunicação de uma evidência que já existe. Se não houver evidência suficiente, registre a lacuna e NÃO tente compensá-la inventando conteúdo.

CRITÉRIOS DE QUALIDADE:
- interprete requisitos semanticamente, não apenas por correspondência literal de palavras;
- diferencie requisito essencial, desejável e contexto da vaga;
- priorize evidências específicas e verificáveis em vez de frases genéricas;
- preserve e valorize resultados, métricas, escopo e responsabilidades que já existam;
- use a terminologia da vaga quando ela for semanticamente equivalente ao que o currículo já comprova;
- não faça keyword stuffing e não repita termos artificialmente;
- prefira bullets claros, específicos e profissionais;
- quando possível, estruture bullets como ação + contexto/objeto + consequência ou impacto já comprovado;
- não crie impacto, resultado ou métrica quando o original não tiver;
- não enfraqueça uma evidência concreta transformando-a em frase genérica;
- não transforme o currículo em uma cópia da descrição da vaga;
- o texto final deve continuar parecendo a trajetória real da pessoa.

REGRAS DE VERDADE:
- toda afirmação deve ser sustentada pelo currículo-base;
- pode reorganizar, priorizar, reordenar bullets, melhorar clareza e aproximar terminologia;
- não invente experiência, skill, ferramenta, tecnologia, método, domínio, cliente, liderança, responsabilidade, formação, idioma, resultado, métrica, percentual ou número;
- não aumente senioridade;
- não transforme participação em liderança, apoio em ownership ou contato em responsabilidade formal;
- não transporte responsabilidades, resultados ou ferramentas entre empresas;
- não atribua ao profissional algo que aparece apenas na vaga;
- em caso de dúvida entre strong e partial, use partial;
- em caso de dúvida sobre a existência de evidência, prefira none.

REQUISITOS DA VAGA:
- extraia somente requisitos que possam influenciar a seleção, evitando duplicações e frases equivalentes;
- considere de 8 a 15 requisitos quando a vaga tiver conteúdo suficiente;
- importance = essential quando a vaga indicar obrigação, responsabilidade central ou competência indispensável;
- importance = preferred quando for diferencial, desejável ou complementar;
- importance = contextual para informações de ambiente, domínio ou forma de trabalho que não sejam requisito principal;
- evidence = strong quando o currículo demonstrar diretamente o requisito com evidência clara;
- evidence = partial quando houver experiência relacionada, mas incompleta ou indireta;
- evidence = none quando não houver sustentação suficiente;
- evidenceSource deve citar de forma curta e específica a experiência, atividade, skill, curso ou formação que sustenta a classificação;
- para evidence = none, evidenceSource deve ser string vazia;
- notes devem explicar brevemente a relação ou lacuna sem inventar justificativas.

EXPERIÊNCIAS E BULLETS:
- use somente experienceId existente;
- não crie experiências, empresas ou cargos;
- cada adaptedBullet deve ser sustentado exclusivamente pela própria experiência;
- preserve fatos, métricas, tecnologias e responsabilidades originais;
- reordene bullets para colocar primeiro os mais relevantes à vaga;
- reescreva quando houver ganho real de clareza, precisão ou alinhamento semântico;
- mantenha a especificidade do original: se houver resultado ou contexto concreto, preserve-o;
- não force todos os bullets a mencionar termos da vaga;
- não transforme atividades operacionais em liderança estratégica;
- não aumente escopo, autonomia ou senioridade;
- registre em changes somente alterações substantivas, com original, adapted e um reason objetivo;
- se uma experiência tiver pouca relação com a vaga, faça poucas alterações em vez de artificialmente adaptá-la;
- não elimine uma evidência forte apenas para economizar texto.

HEADLINE:
- deve representar a experiência real e aproximar o posicionamento da vaga apenas quando houver sustentação;
- não copie o título da vaga se ele implicar senioridade, especialização ou responsabilidade não comprovada;
- seja curta e profissional.

RESUMO:
- escreva de 2 a 4 frases;
- comece pelo posicionamento profissional realmente sustentado pelo currículo;
- destaque 2 ou 3 aspectos com maior relação com a vaga;
- use fatos existentes e evite adjetivos vazios como "excelente", "apaixonado", "altamente qualificado" ou similares sem evidência;
- não mencione lacunas ou requisitos ausentes no resumo.

SKILLS E KEYWORDS:
- skills: somente reordene skills que já existem no currículo;
- coloque primeiro as skills mais relevantes e comprovadas para a vaga;
- supportedKeywords: inclua termos relevantes da vaga somente quando houver evidência real no currículo;
- unsupportedKeywords: inclua termos importantes da vaga que não tenham evidência suficiente;
- uma palavra-chave suportada não autoriza inventar uma nova responsabilidade.

VERIFICAÇÃO FINAL ANTES DE RESPONDER:
- cada afirmação nova é comprovável pelo currículo?
- alguma frase aumentou senioridade, ownership, liderança, escopo ou impacto? Se sim, corrija;
- alguma ferramenta ou metodologia veio apenas da vaga? Se sim, remova;
- os bullets mais relevantes aparecem primeiro?
- o texto ficou mais específico e convincente, e não apenas mais parecido lexicalmente com a vaga?
- requisitos sem evidência permaneceram como lacunas em vez de serem inseridos no currículo?

Se houver conflito entre aderência à vaga e fidelidade ao currículo, priorize SEMPRE a fidelidade factual.

CURRÍCULO:
${JSON.stringify(resumeForAnalysis)}

VAGA:
Cargo: ${jobTitle || "Não informado"}
Empresa: ${company || "Não informada"}
Descrição: ${jobDescription}
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

SEGUNDA TENTATIVA: preserve todos os critérios de qualidade e verdade acima, mas seja mais econômico na saída. Mantenha no máximo 12 requisitos, evite notes redundantes e registre changes somente quando houver alteração substantiva. Não reduza a precisão nem invente conteúdo para encurtar a resposta.
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