"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  generateResumePdf,
} from "@/lib/generate-resume-pdf";

import {
  supabase,
} from "@/lib/supabase/client";

import type {
  AdaptedResume,
  StructuredResume,
} from "@/types/resume";

type SavedResult = {
  id: string;
  roundId?: string;
  title: string;
  company?: string;
  description?: string;
  compatibility?: number;
  status?: string;
  createdAt?: string;
  resumeText?: string;
  sourceResumeFile?: string;
  adaptedResume?: AdaptedResume;
  baseResumeSnapshot?: StructuredResume;
};

type DatabaseApplication = {
  id: string;
  client_id: string | null;
  job_title: string;
  company: string | null;
  job_description: string | null;
  compatibility_score: number | null;
  adapted_resume: AdaptedResume | null;
  base_resume_snapshot: StructuredResume | null;
  created_at: string;
};

type EvidenceFilter =
  | "all"
  | "strong"
  | "partial"
  | "none";

type HistoryScoreFilter =
  | "all"
  | "high"
  | "medium"
  | "low";

function formatDate(
  date?: string,
) {
  if (!date) {
    return "";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(parsed);
}

function evidenceLabel(
  evidence: string,
) {
  if (
    evidence === "strong"
  ) {
    return "Atendido";
  }

  if (
    evidence === "partial"
  ) {
    return "Parcial";
  }

  return "Não identificado";
}

function importanceLabel(
  importance: string,
) {
  if (
    importance === "essential"
  ) {
    return "Essencial";
  }

  if (
    importance === "preferred"
  ) {
    return "Desejável";
  }

  return "Contextual";
}

function getScore(
  result: SavedResult,
) {
  return (
    result
      .adaptedResume
      ?.compatibility
      .score ??
    result.compatibility ??
    0
  );
}

function getResumeForResult(
  result: SavedResult,
  currentBaseResume:
    | StructuredResume
    | null,
) {
  return (
    result.baseResumeSnapshot ??
    currentBaseResume
  );
}

function buildResumeText(
  result: SavedResult,
  currentBaseResume:
    | StructuredResume
    | null,
) {
  const baseResume =
    getResumeForResult(
      result,
      currentBaseResume,
    );

  const adapted =
    result.adaptedResume;

  if (!baseResume) {
    return (
      result.resumeText ||
      ""
    );
  }

  const lines: string[] =
    [];

  lines.push(
    baseResume.name,
  );

  const headline =
    adapted?.headline ||
    baseResume.headline;

  if (headline) {
    lines.push(
      headline,
    );
  }

  const contact =
    [
      baseResume.contact.email,
      baseResume.contact.phone,
      baseResume.contact.location,
      baseResume.contact.linkedin,
      baseResume.contact.portfolio,
    ].filter(
      Boolean,
    ) as string[];

  if (
    contact.length
  ) {
    lines.push(
      contact.join(" | "),
    );
  }

  lines.push("");

  const summary =
    adapted?.summary ||
    baseResume.summary;

  if (summary) {
    lines.push(
      "RESUMO",
      summary,
      "",
    );
  }

  if (
    baseResume.experiences.length
  ) {
    lines.push(
      "EXPERIÊNCIA",
      "",
    );

    for (
      const experience
      of baseResume.experiences
    ) {
      const adaptedExperience =
        adapted
          ?.experiences
          .find(
            (
              item,
            ) =>
              item.experienceId ===
              experience.id,
          );

      lines.push(
        `${experience.role} | ${experience.company}`,
      );

      const period =
        [
          experience.startDate,
          experience.current
            ? "Atual"
            : experience.endDate,
        ]
          .filter(Boolean)
          .join(" - ");

      const details =
        [
          experience.location,
          period,
        ]
          .filter(Boolean)
          .join(" | ");

      if (details) {
        lines.push(
          details,
        );
      }

      const bullets =
        adaptedExperience
          ?.adaptedBullets
          ?.length
          ? adaptedExperience.adaptedBullets
          : experience.bullets;

      for (
        const bullet
        of bullets
      ) {
        lines.push(
          `- ${bullet}`,
        );
      }

      lines.push("");
    }
  }

  if (
    baseResume.education.length
  ) {
    lines.push(
      "FORMAÇÃO",
      "",
    );

    for (
      const education
      of baseResume.education
    ) {
      const period =
        [
          education.startDate,
          education.endDate,
        ]
          .filter(Boolean)
          .join(" - ");

      lines.push(
        [
          education.course,
          education.degree,
          education.institution,
          period,
        ]
          .filter(Boolean)
          .join(" | "),
      );
    }

    lines.push("");
  }

  if (
    baseResume.courses.length
  ) {
    lines.push(
      "CURSOS",
      "",
    );

    for (
      const course
      of baseResume.courses
    ) {
      lines.push(
        [
          course.name,
          course.institution,
          course.date,
        ]
          .filter(Boolean)
          .join(" | "),
      );
    }

    lines.push("");
  }

  const skills =
    adapted
      ?.skills
      ?.length
      ? adapted.skills
      : baseResume.skills;

  if (
    skills.length
  ) {
    lines.push(
      "COMPETÊNCIAS",
      skills.join(" | "),
      "",
    );
  }

  if (
    baseResume.languages.length
  ) {
    lines.push(
      "IDIOMAS",
      baseResume.languages.join(
        " | ",
      ),
    );
  }

  return lines.join("\n");
}

export default function ResultsPage() {
  const router =
    useRouter();

  const [
    currentResults,
    setCurrentResults,
  ] =
    useState<SavedResult[]>(
      [],
    );

  const [
    history,
    setHistory,
  ] =
    useState<SavedResult[]>(
      [],
    );

  const [
    currentBaseResume,
    setCurrentBaseResume,
  ] =
    useState<
      StructuredResume | null
    >(null);

  const [
    expandedId,
    setExpandedId,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedResult,
    setSelectedResult,
  ] =
    useState<
      SavedResult | null
    >(null);

  const [
    evidenceFilter,
    setEvidenceFilter,
  ] =
    useState<EvidenceFilter>(
      "all",
    );

  const [
    copiedId,
    setCopiedId,
  ] =
    useState<
      string | null
    >(null);

  const [
    downloadingId,
    setDownloadingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    historySearch,
    setHistorySearch,
  ] =
    useState("");

  const [
    historyScoreFilter,
    setHistoryScoreFilter,
  ] =
    useState<HistoryScoreFilter>(
      "all",
    );

  const [
    loadingResults,
    setLoadingResults,
  ] =
    useState(true);

  const [
    accountSyncWarning,
    setAccountSyncWarning,
  ] =
    useState(false);

  useEffect(() => {
    let active =
      true;

    async function loadResults() {
      setLoadingResults(
        true,
      );

      setAccountSyncWarning(
        false,
      );

      /*
        Primeiro carregamos o que existe
        neste navegador.

        Isso mantém o Resume Match funcionando
        também para quem ainda não criou conta.
      */

      let loadedCurrent:
        SavedResult[] = [];

      let loadedHistory:
        SavedResult[] = [];

      let base:
        | StructuredResume
        | null =
        null;

      try {
        const currentRaw =
          localStorage.getItem(
            "resume-match-current-round",
          );

        const historyRaw =
          localStorage.getItem(
            "resume-match-history",
          );

        const baseRaw =
          localStorage.getItem(
            "resume-match-structured-resume",
          );

        if (baseRaw) {
          base =
            JSON.parse(
              baseRaw,
            ) as StructuredResume;
        }

        if (currentRaw) {
          const parsed =
            JSON.parse(
              currentRaw,
            );

          if (
            Array.isArray(
              parsed,
            )
          ) {
            loadedCurrent =
              parsed;
          }
        }

        if (historyRaw) {
          const parsed =
            JSON.parse(
              historyRaw,
            );

          if (
            Array.isArray(
              parsed,
            )
          ) {
            loadedHistory =
              parsed;
          }
        }
      } catch (
        localError
      ) {
        console.error(
          "Erro ao carregar resultados locais:",
          localError,
        );
      }

      /*
        Recupera a sessão.

        Sem usuário logado, o histórico local
        continua sendo a fonte de dados.
      */

      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        if (!active) {
          return;
        }

        setCurrentBaseResume(
          base,
        );

        setCurrentResults(
          loadedCurrent,
        );

        setHistory(
          loadedHistory,
        );

        setLoadingResults(
          false,
        );

        return;
      }

      try {
        /*
          Currículo-base ativo da conta.
          O Supabase é a fonte principal
          quando existe usuário logado.
        */

        const {
          data:
            resumeRows,
          error:
            resumeError,
        } =
          await supabase
            .from(
              "resumes",
            )
            .select(
              "data, source",
            )
            .eq(
              "user_id",
              user.id,
            )
            .eq(
              "is_active",
              true,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(
              1,
            );

        if (
          resumeError
        ) {
          throw resumeError;
        }

        const databaseResume =
          resumeRows?.[0]
            ?.data as
            | StructuredResume
            | undefined;

        const databaseSource =
          resumeRows?.[0]
            ?.source as
            | string
            | undefined;

        if (
          databaseResume
        ) {
          base =
            databaseResume;

          localStorage.setItem(
            "resume-match-structured-resume",
            JSON.stringify(
              databaseResume,
            ),
          );

          if (
            databaseSource
          ) {
            localStorage.setItem(
              "resume-match-resume-source",
              databaseSource,
            );
          }
        }

        /*
          Histórico completo da conta.
        */

        const {
          data:
            applicationRows,
          error:
            applicationsError,
        } =
          await supabase
            .from(
              "applications",
            )
            .select(
              "id, client_id, job_title, company, job_description, compatibility_score, adapted_resume, base_resume_snapshot, created_at",
            )
            .eq(
              "user_id",
              user.id,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            );

        if (
          applicationsError
        ) {
          throw applicationsError;
        }

        const databaseHistory =
          (
            applicationRows ??
            []
          ).map(
            (
              row,
            ) => {
              const application =
                row as DatabaseApplication;

              const localMatch =
                [
                  ...loadedCurrent,
                  ...loadedHistory,
                ].find(
                  (
                    result,
                  ) =>
                    result.id ===
                    (
                      application.client_id ??
                      application.id
                    ),
                );

              return {
                id:
                  application.client_id ??
                  application.id,

                roundId:
                  localMatch?.roundId,

                title:
                  application.job_title,

                company:
                  application.company ??
                  undefined,

                description:
                  application.job_description ??
                  undefined,

                compatibility:
                  application.compatibility_score ??
                  undefined,

                status:
                  "ready",

                createdAt:
                  application.created_at,

                resumeText:
                  localMatch?.resumeText,

                sourceResumeFile:
                  localMatch?.sourceResumeFile,

                adaptedResume:
                  application.adapted_resume ??
                  localMatch?.adaptedResume,

                baseResumeSnapshot:
                  application.base_resume_snapshot ??
                  localMatch?.baseResumeSnapshot,
              } satisfies SavedResult;
            },
          );

        /*
          A rodada atual continua vindo do navegador,
          pois ela representa exatamente o lote que
          acabou de ser processado nesta sessão.

          O histórico, porém, vem da conta e por isso
          funciona também em outro navegador/dispositivo.
        */

        loadedHistory =
          databaseHistory;

        /*
          Se a rodada atual existir localmente,
          substituímos seus dados pelos equivalentes
          vindos do banco quando possível.
        */

        loadedCurrent =
          loadedCurrent.map(
            (
              current,
            ) => {
              const databaseVersion =
                databaseHistory.find(
                  (
                    result,
                  ) =>
                    result.id ===
                    current.id,
                );

              return (
                databaseVersion ??
                current
              );
            },
          );

        /*
          Mantemos um espelho local do histórico.
          Isso preserva compatibilidade com o restante
          do MVP durante a transição para Supabase.
        */

        localStorage.setItem(
          "resume-match-history",
          JSON.stringify(
            loadedHistory,
          ),
        );
      } catch (
        cloudError
      ) {
        console.error(
          "Erro ao carregar resultados da conta:",
          cloudError,
        );

        setAccountSyncWarning(
          true,
        );
      }

      if (!active) {
        return;
      }

      /*
        Migração defensiva de resultados antigos
        que ainda não possuíam snapshot.
      */

      if (base) {
        let currentChanged =
          false;

        let historyChanged =
          false;

        loadedCurrent =
          loadedCurrent.map(
            (
              result,
            ) => {
              if (
                result.baseResumeSnapshot
              ) {
                return result;
              }

              currentChanged =
                true;

              return {
                ...result,
                baseResumeSnapshot:
                  base as StructuredResume,
              };
            },
          );

        loadedHistory =
          loadedHistory.map(
            (
              result,
            ) => {
              if (
                result.baseResumeSnapshot
              ) {
                return result;
              }

              historyChanged =
                true;

              return {
                ...result,
                baseResumeSnapshot:
                  base as StructuredResume,
              };
            },
          );

        if (
          currentChanged
        ) {
          localStorage.setItem(
            "resume-match-current-round",
            JSON.stringify(
              loadedCurrent,
            ),
          );
        }

        if (
          historyChanged
        ) {
          localStorage.setItem(
            "resume-match-history",
            JSON.stringify(
              loadedHistory,
            ),
          );
        }
      }

      setCurrentBaseResume(
        base,
      );

      setCurrentResults(
        loadedCurrent,
      );

      setHistory(
        loadedHistory,
      );

      setLoadingResults(
        false,
      );
    }

    loadResults();

    return () => {
      active =
        false;
    };
  }, []);

  const previousResults =
    useMemo(() => {
      const currentIds =
        new Set(
          currentResults.map(
            (
              result,
            ) =>
              result.id,
          ),
        );

      return history.filter(
        (
          result,
        ) =>
          !currentIds.has(
            result.id,
          ),
      );
    }, [
      history,
      currentResults,
    ]);

  const filteredHistory =
    useMemo(() => {
      const query =
        historySearch
          .trim()
          .toLocaleLowerCase(
            "pt-BR",
          );

      return previousResults.filter(
        (result) => {
          const score =
            getScore(
              result,
            );

          const matchesText =
            !query ||
            result.title
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                query,
              ) ||
            (
              result.company ||
              ""
            )
              .toLocaleLowerCase(
                "pt-BR",
              )
              .includes(
                query,
              );

          const matchesScore =
            historyScoreFilter ===
              "all" ||
            (
              historyScoreFilter ===
                "high" &&
              score >= 80
            ) ||
            (
              historyScoreFilter ===
                "medium" &&
              score >= 60 &&
              score < 80
            ) ||
            (
              historyScoreFilter ===
                "low" &&
              score < 60
            );

          return (
            matchesText &&
            matchesScore
          );
        },
      );
    }, [
      previousResults,
      historySearch,
      historyScoreFilter,
    ]);

  function addNewJobs() {
    localStorage.removeItem(
      "resume-match-jobs",
    );

    localStorage.removeItem(
      "resume-match-review",
    );

    router.push(
      "/novo/vaga",
    );
  }

  function replaceBaseResume() {
    router.push(
      "/novo/curriculo",
    );
  }

  function toggleAnalysis(
    id: string,
  ) {
    setEvidenceFilter(
      "all",
    );

    setExpandedId(
      (
        current,
      ) =>
        current === id
          ? null
          : id,
    );
  }

  async function copyResume(
    result: SavedResult,
  ) {
    const text =
      buildResumeText(
        result,
        currentBaseResume,
      );

    if (!text) {
      return;
    }

    await navigator
      .clipboard
      .writeText(
        text,
      );

    setCopiedId(
      result.id,
    );

    window.setTimeout(
      () => {
        setCopiedId(
          null,
        );
      },
      1800,
    );
  }

  async function downloadPdf(
    result: SavedResult,
  ) {
    const baseResume =
      getResumeForResult(
        result,
        currentBaseResume,
      );

    if (!baseResume) {
      window.alert(
        "O currículo-base usado nesta candidatura não foi encontrado.",
      );

      return;
    }

    try {
      setDownloadingId(
        result.id,
      );

      await generateResumePdf({
        baseResume,
        adaptedResume:
          result.adaptedResume,
        title:
          result.title,
        company:
          result.company,
      });
    } catch (
      error
    ) {
      console.error(
        "Erro ao gerar PDF:",
        error,
      );

      window.alert(
        "Não foi possível gerar o PDF.",
      );
    } finally {
      setDownloadingId(
        null,
      );
    }
  }

  function renderAnalysis(
    result: SavedResult,
  ) {
    const adapted =
      result.adaptedResume;

    if (!adapted) {
      return (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            border:
              "1px solid #E7E5E2",
            borderRadius: 16,
            background:
              "#FAFAF8",
            color:
              "#696969",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Esta candidatura foi
          criada antes da análise
          semântica detalhada.
        </div>
      );
    }

    const requirements =
      adapted.requirements.filter(
        (
          requirement,
        ) =>
          evidenceFilter ===
            "all" ||
          requirement.evidence ===
            evidenceFilter,
      );

    const changedExperiences =
      adapted.experiences.filter(
        (
          experience,
        ) =>
          experience.changes
            .length > 0,
      );

    return (
      <div
        style={{
          marginTop: 26,
          paddingTop: 26,
          borderTop:
            "1px solid #E7E5E2",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 30,
          }}
        >
          <MetricCard
            value={`${adapted.compatibility.score}%`}
            label="Compatibilidade"
          />

          <MetricCard
            value={
              adapted
                .compatibility
                .matched
            }
            label="Atendidos"
          />

          <MetricCard
            value={
              adapted
                .compatibility
                .partial
            }
            label="Parciais"
          />

          <MetricCard
            value={
              adapted
                .compatibility
                .missing
            }
            label="Não identificados"
          />
        </div>

        <section
          style={{
            marginBottom: 34,
          }}
        >
          <SectionHeading
            title="Leitura da vaga"
            description="Cada requisito foi comparado com evidências reais do currículo-base usado nesta candidatura."
          />

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <FilterButton
              active={
                evidenceFilter ===
                "all"
              }
              onClick={() =>
                setEvidenceFilter(
                  "all",
                )
              }
            >
              Todos
            </FilterButton>

            <FilterButton
              active={
                evidenceFilter ===
                "strong"
              }
              onClick={() =>
                setEvidenceFilter(
                  "strong",
                )
              }
            >
              Atendidos
            </FilterButton>

            <FilterButton
              active={
                evidenceFilter ===
                "partial"
              }
              onClick={() =>
                setEvidenceFilter(
                  "partial",
                )
              }
            >
              Parciais
            </FilterButton>

            <FilterButton
              active={
                evidenceFilter ===
                "none"
              }
              onClick={() =>
                setEvidenceFilter(
                  "none",
                )
              }
            >
              Não identificados
            </FilterButton>
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            {requirements.map(
              (
                requirement,
              ) => (
                <div
                  key={
                    requirement.id
                  }
                  style={{
                    padding:
                      "16px 18px",
                    border:
                      "1px solid #E7E5E2",
                    borderRadius: 14,
                    background:
                      "#FFFFFF",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                      alignItems:
                        "flex-start",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 220,
                      }}
                    >
                      <div
                        style={{
                          fontWeight:
                            650,
                          lineHeight:
                            1.45,
                        }}
                      >
                        {
                          requirement.requirement
                        }
                      </div>

                      {requirement.evidenceSource && (
                        <div
                          style={{
                            marginTop: 8,
                            color:
                              "#66625E",
                            fontSize: 13,
                            lineHeight:
                              1.5,
                          }}
                        >
                          Evidência:{" "}
                          {
                            requirement.evidenceSource
                          }
                        </div>
                      )}

                      {requirement.notes && (
                        <div
                          style={{
                            marginTop: 6,
                            color:
                              "#8A8680",
                            fontSize: 13,
                            lineHeight:
                              1.5,
                          }}
                        >
                          {
                            requirement.notes
                          }
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        gap: 7,
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <Pill>
                        {importanceLabel(
                          requirement.importance,
                        )}
                      </Pill>

                      <EvidencePill
                        evidence={
                          requirement.evidence
                        }
                      >
                        {evidenceLabel(
                          requirement.evidence,
                        )}
                      </EvidencePill>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <section
          style={{
            marginBottom: 34,
          }}
        >
          <SectionHeading
            title="Palavras-chave"
            description="Termos importantes da vaga separados entre evidências existentes e lacunas."
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            <KeywordPanel
              title="Com evidência"
              subtitle="Podem ser usados naturalmente no currículo."
              keywords={
                adapted.supportedKeywords
              }
              emptyText="Nenhuma palavra-chave suportada foi identificada."
            />

            <KeywordPanel
              title="Sem evidência suficiente"
              subtitle="Não serão adicionadas artificialmente."
              keywords={
                adapted.unsupportedKeywords
              }
              emptyText="Nenhuma lacuna importante foi identificada."
            />
          </div>
        </section>

        <section>
          <SectionHeading
            title="O que foi direcionado"
            description="Comparação das reformulações feitas pela IA com o texto original."
          />

          {changedExperiences.length ===
          0 ? (
            <div
              style={{
                padding: 20,
                border:
                  "1px solid #E7E5E2",
                borderRadius: 14,
                color:
                  "#6D6964",
                fontSize: 14,
              }}
            >
              Nenhuma alteração
              relevante foi
              registrada.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              {changedExperiences.map(
                (
                  experience,
                ) => (
                  <div
                    key={
                      experience.experienceId
                    }
                    style={{
                      border:
                        "1px solid #E7E5E2",
                      borderRadius: 16,
                      overflow:
                        "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding:
                          "16px 18px",
                        borderBottom:
                          "1px solid #E7E5E2",
                        background:
                          "#FAFAF8",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        {
                          experience.role
                        }
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          color:
                            "#716D68",
                          fontSize: 13,
                        }}
                      >
                        {
                          experience.company
                        }
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 18,
                        display: "grid",
                        gap: 18,
                      }}
                    >
                      {experience.changes.map(
                        (
                          change,
                          index,
                        ) => (
                          <div
                            key={`${experience.experienceId}-${index}`}
                            style={{
                              display:
                                "grid",
                              gap: 10,
                            }}
                          >
                            <CompareBlock
                              label="Original"
                              text={
                                change.original
                              }
                            />

                            <CompareBlock
                              label="Direcionado"
                              text={
                                change.adapted
                              }
                              highlight
                            />

                            {change.reason && (
                              <div
                                style={{
                                  fontSize: 13,
                                  lineHeight:
                                    1.55,
                                  color:
                                    "#716D68",
                                }}
                              >
                                <strong>
                                  Motivo:
                                </strong>{" "}
                                {
                                  change.reason
                                }
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderResultCard(
    result: SavedResult,
    isCurrent = false,
  ) {
    const score =
      getScore(
        result,
      );

    const isExpanded =
      expandedId ===
      result.id;

    const hasSnapshot =
      Boolean(
        result.baseResumeSnapshot,
      );

    return (
      <article
        key={result.id}
        style={{
          border:
            "1px solid #E3E1DE",
          borderRadius: 18,
          background:
            "#FFFFFF",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems:
              "flex-start",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background:
                isCurrent
                  ? "#FDE7ED"
                  : "#F2F1EE",
              display: "grid",
              placeItems:
                "center",
              fontSize: 12,
              fontWeight: 700,
              color:
                isCurrent
                  ? "#E9426B"
                  : "#68645F",
              flexShrink: 0,
            }}
          >
            CV
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 19,
              }}
            >
              {result.title}
            </h2>

            <div
              style={{
                marginTop: 6,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                color:
                  "#716D68",
                fontSize: 13,
              }}
            >
              {result.company && (
                <span>
                  {result.company}
                </span>
              )}

              {formatDate(
                result.createdAt,
              ) && (
                <span>
                  {formatDate(
                    result.createdAt,
                  )}
                </span>
              )}
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 10,
                alignItems:
                  "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  padding:
                    "9px 12px",
                  borderRadius: 10,
                  background:
                    "#F2F7F4",
                  fontSize: 13,
                }}
              >
                Compatibilidade{" "}
                <strong
                  style={{
                    color:
                      "#247A52",
                  }}
                >
                  {score}%
                </strong>
              </div>

              <span
                style={{
                  color:
                    "#247A52",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ✓ Pronto
              </span>
            </div>

            {result.sourceResumeFile && (
              <div
                style={{
                  marginTop: 15,
                  color:
                    "#77736E",
                  fontSize: 12,
                }}
              >
                Fonte:{" "}
                {result.sourceResumeFile}
              </div>
            )}

            <div
              style={{
                marginTop: 7,
                color:
                  hasSnapshot
                    ? "#247A52"
                    : "#8A8680",
                fontSize: 11,
              }}
            >
              {hasSnapshot
                ? "✓ Currículo-base preservado nesta candidatura"
                : "Usando currículo-base atual"}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop:
              "1px solid #E7E5E2",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setSelectedResult(
                result,
              )
            }
            style={
              secondaryButtonStyle
            }
          >
            Ver currículo
          </button>

          <button
            type="button"
            onClick={() =>
              copyResume(
                result,
              )
            }
            style={
              secondaryButtonStyle
            }
          >
            {copiedId ===
            result.id
              ? "Copiado"
              : "Copiar texto"}
          </button>

          <button
            type="button"
            onClick={() =>
              toggleAnalysis(
                result.id,
              )
            }
            style={
              secondaryButtonStyle
            }
          >
            {isExpanded
              ? "Fechar análise"
              : "Ver análise"}
          </button>

          <button
            type="button"
            disabled={
              downloadingId ===
              result.id
            }
            onClick={() =>
              downloadPdf(
                result,
              )
            }
            style={{
              ...primaryButtonStyle,
              opacity:
                downloadingId ===
                result.id
                  ? 0.65
                  : 1,
            }}
          >
            {downloadingId ===
            result.id
              ? "Gerando PDF..."
              : "Baixar PDF"}
          </button>
        </div>

        {isExpanded &&
          renderAnalysis(
            result,
          )}
      </article>
    );
  }

  if (
    loadingResults
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",
          background:
            "#F7F7F5",
          color:
            "#181818",
          display:
            "grid",
          placeItems:
            "center",
        }}
      >
        <div
          style={{
            textAlign:
              "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 650,
            }}
          >
            Carregando seus resultados...
          </p>

          <p
            style={{
              margin:
                "8px 0 0",
              fontSize: 13,
              color:
                "#77736E",
            }}
          >
            Sincronizando seu histórico.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "#F7F7F5",
        color: "#181818",
      }}
    >
      <div
        style={{
          width:
            "min(1040px, calc(100% - 40px))",
          margin: "0 auto",
          padding:
            "64px 0 100px",
        }}
      >
        <header
          style={{
            marginBottom: 38,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 24,
              alignItems:
                "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                maxWidth: 680,
              }}
            >
              <div
                style={{
                  color:
                    "#E9426B",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                RESUME MATCH
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize:
                    "clamp(34px, 5vw, 52px)",
                  lineHeight: 1.05,
                  letterSpacing:
                    "-0.04em",
                }}
              >
                Seus currículos
                direcionados
              </h1>

              <p
                style={{
                  maxWidth: 660,
                  margin:
                    "18px 0 0",
                  color:
                    "#66625E",
                  fontSize: 16,
                  lineHeight: 1.65,
                }}
              >
                Continue usando o
                mesmo currículo-base
                para novas vagas ou
                substitua o currículo
                principal quando
                precisar.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={
                  replaceBaseResume
                }
                style={
                  secondaryButtonStyle
                }
              >
                Trocar currículo-base
              </button>

              <button
                type="button"
                onClick={
                  addNewJobs
                }
                style={
                  primaryButtonStyle
                }
              >
                + Adicionar novas vagas
              </button>
            </div>
          </div>
        </header>

        {accountSyncWarning && (
          <div
            style={{
              marginBottom: 24,
              padding:
                "14px 16px",
              border:
                "1px solid #E9D8A6",
              borderRadius: 12,
              background:
                "#FFFBEF",
              color:
                "#765F1D",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            Não foi possível carregar a versão mais recente da sua conta agora. Os resultados disponíveis neste navegador continuam acessíveis.
          </div>
        )}

        <section>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-end",
              marginBottom: 16,
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  color:
                    "#77736E",
                  fontSize: 13,
                  marginBottom: 5,
                }}
              >
                Última rodada
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 23,
                }}
              >
                Candidaturas
                processadas
              </h2>
            </div>

            <div
              style={{
                fontSize: 13,
                color:
                  "#77736E",
              }}
            >
              {currentResults.length}{" "}
              {currentResults.length ===
              1
                ? "currículo"
                : "currículos"}
            </div>
          </div>

          {currentResults.length ===
          0 ? (
            <div
              style={{
                padding: 28,
                border:
                  "1px solid #E3E1DE",
                borderRadius: 18,
                background:
                  "#FFFFFF",
                color:
                  "#68645F",
              }}
            >
              Nenhum resultado
              recente encontrado.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              {currentResults.map(
                (
                  result,
                ) =>
                  renderResultCard(
                    result,
                    true,
                  ),
              )}
            </div>
          )}
        </section>

        {previousResults.length >
          0 && (
          <section
            style={{
              marginTop: 54,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 20,
                alignItems:
                  "flex-end",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      "#77736E",
                    fontSize: 13,
                    marginBottom: 5,
                  }}
                >
                  Histórico
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 23,
                  }}
                >
                  Candidaturas
                  anteriores
                </h2>

                <div
                  style={{
                    marginTop: 6,
                    color:
                      "#77736E",
                    fontSize: 12,
                  }}
                >
                  {
                    filteredHistory.length
                  }{" "}
                  de{" "}
                  {
                    previousResults.length
                  }{" "}
                  resultados
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                border:
                  "1px solid #E3E1DE",
                borderRadius: 16,
                background:
                  "#FFFFFF",
                marginBottom: 14,
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) auto",
                gap: 10,
              }}
            >
              <input
                type="search"
                value={
                  historySearch
                }
                onChange={(
                  event,
                ) =>
                  setHistorySearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar por cargo ou empresa..."
                style={{
                  height: 44,
                  border:
                    "1px solid #DCD9D5",
                  borderRadius: 10,
                  padding:
                    "0 14px",
                  fontSize: 14,
                  outline: "none",
                  minWidth: 0,
                }}
              />

              <select
                value={
                  historyScoreFilter
                }
                onChange={(
                  event,
                ) =>
                  setHistoryScoreFilter(
                    event.target
                      .value as HistoryScoreFilter,
                  )
                }
                style={{
                  height: 44,
                  border:
                    "1px solid #DCD9D5",
                  borderRadius: 10,
                  padding:
                    "0 12px",
                  background:
                    "#FFFFFF",
                  color:
                    "#181818",
                  fontSize: 13,
                }}
              >
                <option value="all">
                  Todas as compatibilidades
                </option>

                <option value="high">
                  80% ou mais
                </option>

                <option value="medium">
                  60% a 79%
                </option>

                <option value="low">
                  Abaixo de 60%
                </option>
              </select>
            </div>

            {filteredHistory.length ===
            0 ? (
              <div
                style={{
                  padding: 24,
                  border:
                    "1px solid #E3E1DE",
                  borderRadius: 16,
                  background:
                    "#FFFFFF",
                  color:
                    "#68645F",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                Nenhuma candidatura
                corresponde aos
                filtros atuais.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 14,
                }}
              >
                {filteredHistory.map(
                  (
                    result,
                  ) =>
                    renderResultCard(
                      result,
                    ),
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {selectedResult && (
        <div
          onClick={() =>
            setSelectedResult(
              null,
            )
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background:
              "rgba(20,20,20,.38)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
            style={{
              width:
                "min(760px,100%)",
              maxHeight:
                "86vh",
              overflow: "auto",
              background:
                "#FFFFFF",
              borderRadius: 20,
              border:
                "1px solid #E3E1DE",
            }}
          >
            <div
              style={{
                padding:
                  "20px 24px",
                borderBottom:
                  "1px solid #E7E5E2",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                position: "sticky",
                top: 0,
                background:
                  "#FFFFFF",
                zIndex: 2,
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      "#77736E",
                    fontSize: 11,
                    marginBottom: 4,
                  }}
                >
                  Currículo
                  direcionado
                </div>

                <strong>
                  {
                    selectedResult.title
                  }
                </strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedResult(
                    null,
                  )
                }
                style={
                  secondaryButtonStyle
                }
              >
                Fechar
              </button>
            </div>

            <pre
              style={{
                margin: 0,
                padding:
                  "28px 30px 38px",
                fontFamily:
                  "inherit",
                fontSize: 14,
                lineHeight: 1.7,
                whiteSpace:
                  "pre-wrap",
                wordBreak:
                  "break-word",
              }}
            >
              {buildResumeText(
                selectedResult,
                currentBaseResume,
              )}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  value,
  label,
}: {
  value:
    | string
    | number;
  label: string;
}) {
  return (
    <div
      style={{
        padding:
          "17px 18px",
        background:
          "#FAFAF8",
        border:
          "1px solid #E7E5E2",
        borderRadius: 14,
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 750,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 3,
          fontSize: 12,
          color:
            "#77736E",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        marginBottom: 16,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 18,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin:
            "6px 0 0",
          fontSize: 13,
          lineHeight: 1.55,
          color:
            "#77736E",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function Pill({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span
      style={{
        padding:
          "6px 9px",
        border:
          "1px solid #E1DFDB",
        borderRadius: 999,
        background:
          "#FAFAF8",
        fontSize: 11,
      }}
    >
      {children}
    </span>
  );
}

function EvidencePill({
  evidence,
  children,
}: {
  evidence: string;
  children:
    React.ReactNode;
}) {
  const style =
    evidence === "strong"
      ? {
          background:
            "#EEF7F2",
          color:
            "#247A52",
          borderColor:
            "#D9EBDD",
        }
      : evidence ===
          "partial"
        ? {
            background:
              "#FFF7E8",
            color:
              "#8D6117",
            borderColor:
              "#F1E0BA",
          }
        : {
            background:
              "#FFF0F2",
            color:
              "#B83F55",
            borderColor:
              "#F3D8DE",
          };

  return (
    <span
      style={{
        padding:
          "6px 9px",
        border:
          "1px solid",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children:
    React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border:
          active
            ? "1px solid #181818"
            : "1px solid #DEDBD7",
        background:
          active
            ? "#181818"
            : "#FFFFFF",
        color:
          active
            ? "#FFFFFF"
            : "#494641",
        padding:
          "8px 11px",
        borderRadius: 999,
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function KeywordPanel({
  title,
  subtitle,
  keywords,
  emptyText,
}: {
  title: string;
  subtitle: string;
  keywords: string[];
  emptyText: string;
}) {
  return (
    <div
      style={{
        border:
          "1px solid #E7E5E2",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <strong>
        {title}
      </strong>

      <div
        style={{
          marginTop: 5,
          fontSize: 12,
          lineHeight: 1.5,
          color:
            "#77736E",
        }}
      >
        {subtitle}
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
        }}
      >
        {keywords.length
          ? keywords.map(
              (
                keyword,
                index,
              ) => (
                <span
                  key={`${keyword}-${index}`}
                  style={{
                    padding:
                      "7px 9px",
                    border:
                      "1px solid #E2E0DC",
                    borderRadius: 9,
                    fontSize: 12,
                  }}
                >
                  {keyword}
                </span>
              ),
            )
          : (
              <span
                style={{
                  fontSize: 12,
                  color:
                    "#8A8680",
                }}
              >
                {emptyText}
              </span>
            )}
      </div>
    </div>
  );
}

function CompareBlock({
  label,
  text,
  highlight = false,
}: {
  label: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: 14,
        border:
          highlight
            ? "1px solid #F2D7DF"
            : "1px solid #E7E5E2",
        borderRadius: 12,
        background:
          highlight
            ? "#FFF8FA"
            : "#FAFAF8",
      }}
    >
      <div
        style={{
          marginBottom: 6,
          fontSize: 10,
          fontWeight: 750,
          textTransform:
            "uppercase",
          color:
            highlight
              ? "#D94668"
              : "#8A8680",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        {text}
      </div>
    </div>
  );
}

const secondaryButtonStyle:
  React.CSSProperties = {
  height: 42,
  padding: "0 16px",
  border:
    "1px solid #DCD9D5",
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#181818",
  fontWeight: 700,
  cursor: "pointer",
};

const primaryButtonStyle:
  React.CSSProperties = {
  height: 42,
  padding: "0 18px",
  border: "none",
  borderRadius: 10,
  background: "#181818",
  color: "#FFFFFF",
  fontWeight: 700,
  cursor: "pointer",
};