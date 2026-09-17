"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase/client";

import type {
  AdaptedResume,
  StructuredResume,
} from "@/types/resume";

type JobDraft = {
  id: string;
  title: string;
  company: string;
  description: string;
};

type BaseResumeFile = {
  fileName?: string;
  fileSize?: number;
  pages?: number;
  text?: string;
  importedAt?: string;
};

type ReviewData = {
  jobs?: JobDraft[];
};

type ProcessingStatus =
  | "waiting"
  | "processing"
  | "ready"
  | "error";

type JobState = {
  status: ProcessingStatus;
  error?: string;
  compatibility?: number;
  matched?: number;
  partial?: number;
  missing?: number;
};

type StoredResult = {
  id: string;
  roundId: string;
  title: string;
  company?: string;
  description: string;
  compatibility: number;
  status: "ready";
  createdAt: string;
  resumeText: string;
  sourceResumeFile?: string;
  adaptedResume: AdaptedResume;

  /*
    NOVO:
    currículo-base congelado
    no momento da candidatura.
  */
  baseResumeSnapshot: StructuredResume;
};

function buildResumeText(
  baseResume: StructuredResume,
  adaptedResume: AdaptedResume,
) {
  const lines: string[] = [];

  lines.push(
    baseResume.name,
  );

  const headline =
    adaptedResume.headline ||
    baseResume.headline;

  if (headline) {
    lines.push(headline);
  }

  const contactParts =
    [
      baseResume.contact.email,
      baseResume.contact.phone,
      baseResume.contact.location,
      baseResume.contact.linkedin,
      baseResume.contact.portfolio,
    ].filter(Boolean) as string[];

  if (contactParts.length) {
    lines.push(
      contactParts.join(" | "),
    );
  }

  lines.push("");

  const summary =
    adaptedResume.summary ||
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
        adaptedResume.experiences.find(
          (item) =>
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
        lines.push(details);
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
    adaptedResume.skills.length
      ? adaptedResume.skills
      : baseResume.skills;

  if (skills.length) {
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

export default function ProcessingPage() {
  const router =
    useRouter();

  const startedRef =
    useRef(false);

  const [
    jobs,
    setJobs,
  ] =
    useState<JobDraft[]>([]);

  const [
    structuredResume,
    setStructuredResume,
  ] =
    useState<
      StructuredResume | null
    >(null);

  const [
    baseResumeFile,
    setBaseResumeFile,
  ] =
    useState<
      BaseResumeFile | null
    >(null);

  const [
    states,
    setStates,
  ] =
    useState<
      Record<string, JobState>
    >({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    finished,
    setFinished,
  ] =
    useState(false);

  const [
    cloudSyncWarning,
    setCloudSyncWarning,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const reviewRaw =
        localStorage.getItem(
          "resume-match-review",
        );

      const structuredRaw =
        localStorage.getItem(
          "resume-match-structured-resume",
        );

      const baseRaw =
        localStorage.getItem(
          "resume-match-base-resume",
        );

      if (
        !reviewRaw ||
        !structuredRaw
      ) {
        router.replace(
          "/novo/vaga",
        );

        return;
      }

      const review =
        JSON.parse(
          reviewRaw,
        ) as ReviewData;

      const resume =
        JSON.parse(
          structuredRaw,
        ) as StructuredResume;

      const reviewJobs =
        Array.isArray(
          review.jobs,
        )
          ? review.jobs
          : [];

      if (
        reviewJobs.length === 0
      ) {
        router.replace(
          "/novo/vaga",
        );

        return;
      }

      setJobs(
        reviewJobs,
      );

      setStructuredResume(
        resume,
      );

      if (baseRaw) {
        setBaseResumeFile(
          JSON.parse(
            baseRaw,
          ) as BaseResumeFile,
        );
      }

      const initialStates:
        Record<
          string,
          JobState
        > = {};

      for (
        const job
        of reviewJobs
      ) {
        initialStates[
          job.id
        ] = {
          status:
            "waiting",
        };
      }

      setStates(
        initialStates,
      );

      setLoading(false);
    } catch (error) {
      console.error(
        "Erro ao preparar processamento:",
        error,
      );

      router.replace(
        "/novo/vaga",
      );
    }
  }, [router]);

  useEffect(() => {
    if (
      loading ||
      !structuredResume ||
      jobs.length === 0 ||
      startedRef.current
    ) {
      return;
    }

    startedRef.current =
      true;

    processAllJobs(
      jobs,
      structuredResume,
    );
  }, [
    loading,
    jobs,
    structuredResume,
  ]);

  async function processAllJobs(
    jobsToProcess: JobDraft[],
    resume: StructuredResume,
  ) {
    const roundId =
      `round-${Date.now()}`;

    const successfulResults:
      StoredResult[] = [];

    let failures = 0;

    /*
      Se houver usuário logado, buscamos uma vez
      o currículo-base ativo da conta.

      O fluxo continua funcionando normalmente
      sem login: nesse caso os resultados ficam
      apenas no navegador até a pessoa criar
      ou entrar em uma conta.
    */

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    let activeResumeId:
      string |
      null =
      null;

    if (user) {
      const {
        data:
          activeResumeRows,
        error:
          activeResumeError,
      } =
        await supabase
          .from(
            "resumes",
          )
          .select(
            "id",
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
        activeResumeError
      ) {
        console.error(
          "Erro ao localizar currículo ativo no Supabase:",
          activeResumeError,
        );

        setCloudSyncWarning(
          true,
        );
      } else {
        activeResumeId =
          activeResumeRows?.[0]
            ?.id ??
          null;
      }
    }

    for (
      const job
      of jobsToProcess
    ) {
      setStates(
        (current) => ({
          ...current,

          [job.id]: {
            status:
              "processing",
          },
        }),
      );

      try {
        const response =
          await fetch(
            "/api/adapt-resume",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  {
                    resume,

                    job: {
                      title:
                        job.title,

                      company:
                        job.company,

                      description:
                        job.description,
                    },
                  },
                ),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              data.error ||
              "Não foi possível adaptar esta vaga.",
          );
        }

        const adaptedResume:
          AdaptedResume =
          data.adaptedResume;

        if (
          !adaptedResume
        ) {
          throw new Error(
            "A análise foi concluída sem um currículo adaptado.",
          );
        }

        const createdAt =
          new Date()
            .toISOString();

        const result:
          StoredResult = {
          id:
            `${roundId}-${job.id}`,

          roundId,

          title:
            job.title ||
            "Vaga sem título",

          company:
            job.company ||
            undefined,

          description:
            job.description,

          compatibility:
            adaptedResume
              .compatibility
              .score,

          status:
            "ready",

          createdAt,

          resumeText:
            buildResumeText(
              resume,
              adaptedResume,
            ),

          sourceResumeFile:
            baseResumeFile
              ?.fileName,

          adaptedResume,

          /*
            AQUI está a mudança principal.

            Cada resultado recebe uma
            cópia completa do currículo
            estruturado usado nesta rodada.
          */

          baseResumeSnapshot:
            structuredClone(
              resume,
            ),
        };

        successfulResults.push(
          result,
        );

        /*
          Salva a candidatura diretamente na conta.

          Se o Supabase falhar, o resultado continua
          preservado no localStorage. O Dashboard
          ainda consegue sincronizá-lo depois.
        */

        if (user) {
          try {
            const {
              data:
                existingApplication,
              error:
                existingApplicationError,
            } =
              await supabase
                .from(
                  "applications",
                )
                .select(
                  "id",
                )
                .eq(
                  "user_id",
                  user.id,
                )
                .eq(
                  "client_id",
                  result.id,
                )
                .maybeSingle();

            if (
              existingApplicationError
            ) {
              throw existingApplicationError;
            }

            if (
              !existingApplication
            ) {
              const {
                error:
                  insertApplicationError,
              } =
                await supabase
                  .from(
                    "applications",
                  )
                  .insert({
                    user_id:
                      user.id,

                    resume_id:
                      activeResumeId,

                    client_id:
                      result.id,

                    job_title:
                      result.title,

                    company:
                      result.company ??
                      null,

                    job_description:
                      result.description,

                    compatibility_score:
                      result.compatibility,

                    adapted_resume:
                      result.adaptedResume,

                    base_resume_snapshot:
                      result.baseResumeSnapshot,
                  });

              if (
                insertApplicationError
              ) {
                throw insertApplicationError;
              }
            }
          } catch (
            cloudSaveError
          ) {
            console.error(
              `Erro ao salvar candidatura ${result.title} no Supabase:`,
              cloudSaveError,
            );

            setCloudSyncWarning(
              true,
            );
          }
        }

        setStates(
          (current) => ({
            ...current,

            [job.id]: {
              status:
                "ready",

              compatibility:
                adaptedResume
                  .compatibility
                  .score,

              matched:
                adaptedResume
                  .compatibility
                  .matched,

              partial:
                adaptedResume
                  .compatibility
                  .partial,

              missing:
                adaptedResume
                  .compatibility
                  .missing,
            },
          }),
        );
      } catch (error) {
        failures += 1;

        const message =
          error instanceof Error
            ? error.message
            : "Erro desconhecido.";

        console.error(
          `Erro ao processar vaga ${job.title}:`,
          error,
        );

        setStates(
          (current) => ({
            ...current,

            [job.id]: {
              status:
                "error",

              error:
                message,
            },
          }),
        );
      }
    }

    if (
      successfulResults.length >
      0
    ) {
      let history:
        StoredResult[] = [];

      const historyRaw =
        localStorage.getItem(
          "resume-match-history",
        );

      if (historyRaw) {
        try {
          const parsed =
            JSON.parse(
              historyRaw,
            );

          if (
            Array.isArray(
              parsed,
            )
          ) {
            history =
              parsed;
          }
        } catch {
          history = [];
        }
      }

      /*
        Os novos resultados entram no
        início do histórico.

        Cada um já contém
        baseResumeSnapshot.
      */

      const updatedHistory =
        [
          ...successfulResults,
          ...history,
        ];

      localStorage.setItem(
        "resume-match-history",
        JSON.stringify(
          updatedHistory,
        ),
      );

      /*
        A rodada atual continua sendo
        um array completo de resultados,
        como a página /resultados espera.
      */

      localStorage.setItem(
        "resume-match-current-round",
        JSON.stringify(
          successfulResults,
        ),
      );
    }

    setFinished(true);

    if (
      failures === 0 &&
      successfulResults.length >
        0
    ) {
      localStorage.removeItem(
        "resume-match-jobs",
      );

      localStorage.removeItem(
        "resume-match-review",
      );

      window.setTimeout(
        () => {
          router.push(
            "/resultados",
          );
        },
        800,
      );
    }
  }

  const completed =
    jobs.filter(
      (job) =>
        states[job.id]
          ?.status ===
        "ready",
    ).length;

  const failed =
    jobs.filter(
      (job) =>
        states[job.id]
          ?.status ===
        "error",
    ).length;

  if (loading) {
    return (
      <main
        className="
          min-h-screen
          bg-[#F7F7F5]
          text-[#181818]
        "
      >
        <div
          className="
            mx-auto
            max-w-[900px]
            px-6
            py-20
          "
        >
          <p className="text-sm text-[#686864]">
            Preparando análise...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="
        min-h-screen
        bg-[#F7F7F5]
        text-[#181818]
      "
    >
      <header
        className="
          border-b
          border-[#DEDEDA]
          bg-white
        "
      >
        <div
          className="
            mx-auto
            flex
            h-20
            max-w-[1280px]
            items-center
            px-6
            lg:px-10
          "
        >
          <img
            src="/brand/resume-match-logo-horizontal.svg"
            alt="Resume Match"
            className="h-9 w-auto"
          />
        </div>
      </header>

      <div
        className="
          mx-auto
          max-w-[900px]
          px-6
          py-14
          lg:py-20
        "
      >
        <div
          className="
            max-w-[680px]
          "
        >
          <p
            className="
              text-sm
              font-semibold
              text-[#E9426B]
            "
          >
            Preparando currículos
          </p>

          <h1
            className="
              mt-3
              text-4xl
              font-semibold
              tracking-[-0.035em]
              sm:text-5xl
            "
          >
            Analisando cada
            oportunidade.
          </h1>

          <p
            className="
              mt-5
              text-base
              leading-7
              text-[#686864]
            "
          >
            Cada oportunidade é
            analisada separadamente.
            O sistema identifica os
            requisitos da vaga,
            procura evidências reais
            no seu currículo e
            direciona a linguagem sem
            criar novas experiências.
          </p>
        </div>

        {baseResumeFile && (
          <div
            className="
              mt-8
              flex
              items-center
              gap-4
              rounded-xl
              border
              border-[#DEDEDA]
              bg-white
              p-4
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                bg-[#FFE4EB]
                text-xs
                font-bold
                text-[#E9426B]
              "
            >
              PDF
            </div>

            <div>
              <p
                className="
                  text-xs
                  text-[#777772]
                "
              >
                Currículo-base
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                "
              >
                {
                  baseResumeFile.fileName
                }
              </p>
            </div>
          </div>
        )}

        <div
          className="
            mt-6
            overflow-hidden
            rounded-xl
            border
            border-[#DEDEDA]
            bg-white
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-[#E7E7E3]
              px-5
              py-4
              sm:px-6
            "
          >
            <div>
              <p
                className="
                  text-sm
                  font-semibold
                "
              >
                Processando
                candidaturas
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-[#777772]
                "
              >
                {completed} de{" "}
                {jobs.length}{" "}
                concluídas
              </p>
            </div>

            <span
              className="
                text-xs
                text-[#686864]
              "
            >
              {failed > 0
                ? `${failed} com erro`
                : "Análise individual"}
            </span>
          </div>

          {jobs.map(
            (
              job,
              index,
            ) => {
              const state =
                states[job.id] ?? {
                  status:
                    "waiting",
                };

              return (
                <article
                  key={job.id}
                  className={`
                    p-5
                    sm:p-6
                    ${
                      index !==
                      jobs.length -
                        1
                        ? "border-b border-[#E7E7E3]"
                        : ""
                    }
                  `}
                >
                  <div
                    className="
                      flex
                      gap-4
                    "
                  >
                    <div
                      className={`
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        text-xs
                        font-semibold

                        ${
                          state.status ===
                          "ready"
                            ? "bg-[#E7F4EC] text-[#247A52]"
                            : state.status ===
                                "error"
                              ? "bg-[#FFF0F2] text-[#B83F55]"
                              : "bg-[#FFE4EB] text-[#E9426B]"
                        }
                      `}
                    >
                      {state.status ===
                      "ready"
                        ? "✓"
                        : state.status ===
                            "error"
                          ? "!"
                          : index +
                            1}
                    </div>

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <div
                        className="
                          flex
                          flex-col
                          gap-1
                          sm:flex-row
                          sm:items-center
                          sm:gap-3
                        "
                      >
                        <h2
                          className="
                            font-semibold
                          "
                        >
                          {job.title ||
                            `Vaga ${index + 1}`}
                        </h2>

                        {job.company && (
                          <span
                            className="
                              text-sm
                              text-[#777772]
                            "
                          >
                            {
                              job.company
                            }
                          </span>
                        )}
                      </div>

                      {state.status ===
                        "waiting" && (
                        <p
                          className="
                            mt-3
                            text-xs
                            text-[#777772]
                          "
                        >
                          Aguardando
                          processamento
                        </p>
                      )}

                      {state.status ===
                        "processing" && (
                        <div
                          className="
                            mt-3
                            flex
                            items-center
                            gap-2
                            text-xs
                            text-[#777772]
                          "
                        >
                          <span
                            className="
                              h-2
                              w-2
                              animate-pulse
                              rounded-full
                              bg-[#E9426B]
                            "
                          />

                          Analisando
                          requisitos e
                          evidências
                        </div>
                      )}

                      {state.status ===
                        "ready" && (
                        <div
                          className="
                            mt-3
                            flex
                            flex-wrap
                            items-center
                            gap-x-4
                            gap-y-2
                            text-xs
                          "
                        >
                          <span
                            className="
                              font-semibold
                              text-[#247A52]
                            "
                          >
                            Currículo
                            direcionado
                            pronto
                          </span>

                          <span>
                            {
                              state.compatibility
                            }
                            %
                          </span>

                          <span
                            className="
                              text-[#777772]
                            "
                          >
                            {
                              state.matched
                            }{" "}
                            atendidos
                          </span>

                          <span
                            className="
                              text-[#777772]
                            "
                          >
                            {
                              state.partial
                            }{" "}
                            parciais
                          </span>

                          <span
                            className="
                              text-[#777772]
                            "
                          >
                            {
                              state.missing
                            }{" "}
                            não
                            identificados
                          </span>
                        </div>
                      )}

                      {state.status ===
                        "error" && (
                        <div
                          className="
                            mt-3
                          "
                        >
                          <p
                            className="
                              text-xs
                              font-medium
                              text-[#B83F55]
                            "
                          >
                            Não foi
                            possível
                            concluir
                          </p>

                          {state.error && (
                            <div
                              className="
                                mt-3
                                rounded-lg
                                bg-[#FFF0F2]
                                px-3
                                py-3
                                text-xs
                                leading-5
                                text-[#B83F55]
                              "
                            >
                              {
                                state.error
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>

        <div
          className="
            mt-6
            rounded-lg
            border
            border-[#DEDEDA]
            bg-white
            px-5
            py-4
          "
        >
          <p
            className="
              text-xs
              leading-5
              text-[#686864]
            "
          >
            A compatibilidade é
            calculada a partir dos
            requisitos encontrados
            na vaga e das evidências
            existentes no currículo.
            Cada resultado também
            preserva uma cópia do
            currículo-base usado
            naquela candidatura.
          </p>
        </div>

        {cloudSyncWarning && (
          <div
            className="
              mt-6
              rounded-xl
              border
              border-[#E9D8A6]
              bg-[#FFFBEF]
              p-5
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-[#765F1D]
              "
            >
              Alguns dados ainda não foram sincronizados com sua conta.
            </p>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-[#786C4B]
              "
            >
              Os resultados continuam salvos neste navegador e o Resume Match tentará sincronizá-los novamente quando você acessar o Dashboard.
            </p>
          </div>
        )}

        {finished &&
          failed > 0 && (
          <div
            className="
              mt-6
              rounded-xl
              border
              border-[#F0C9D1]
              bg-[#FFF5F6]
              p-5
            "
          >
            <p
              className="
                font-semibold
                text-[#B83F55]
              "
            >
              Algumas vagas não
              puderam ser
              processadas.
            </p>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-[#77535A]
              "
            >
              Os resultados
              concluídos foram
              salvos. Verifique os
              erros antes de tentar
              novamente.
            </p>

            {completed > 0 && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/resultados",
                  )
                }
                className="
                  mt-4
                  h-11
                  rounded-lg
                  bg-[#181818]
                  px-5
                  text-sm
                  font-semibold
                  text-white
                "
              >
                Ver resultados
                concluídos
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}