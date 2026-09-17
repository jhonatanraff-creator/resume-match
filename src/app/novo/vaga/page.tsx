"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  StructuredResume,
} from "@/types/resume";

type JobDraft = {
  id: string;
  title: string;
  company: string;
  description: string;
};

function createEmptyJob(): JobDraft {
  return {
    id:
      `job-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    title: "",
    company: "",
    description: "",
  };
}

export default function JobPage() {
  const router =
    useRouter();

  const [
    jobs,
    setJobs,
  ] =
    useState<JobDraft[]>([
      createEmptyJob(),
    ]);

  const [
    resume,
    setResume,
  ] =
    useState<
      StructuredResume | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    try {
      const resumeRaw =
        localStorage.getItem(
          "resume-match-structured-resume",
        );

      if (!resumeRaw) {
        router.replace(
          "/novo/importar",
        );

        return;
      }

      const parsedResume =
        JSON.parse(
          resumeRaw,
        ) as StructuredResume;

      setResume(
        parsedResume,
      );

      const savedJobsRaw =
        localStorage.getItem(
          "resume-match-jobs",
        );

      if (savedJobsRaw) {
        const parsedJobs =
          JSON.parse(
            savedJobsRaw,
          );

        if (
          Array.isArray(
            parsedJobs,
          ) &&
          parsedJobs.length > 0
        ) {
          setJobs(
            parsedJobs,
          );
        }
      }

      setLoading(false);
    } catch (
      error
    ) {
      console.error(
        "Erro ao carregar currículo:",
        error,
      );

      router.replace(
        "/novo/importar",
      );
    }
  }, [router]);

  useEffect(() => {
    if (loading) {
      return;
    }

    localStorage.setItem(
      "resume-match-jobs",
      JSON.stringify(jobs),
    );
  }, [
    jobs,
    loading,
  ]);

  function updateJob(
    id: string,
    field:
      | "title"
      | "company"
      | "description",
    value: string,
  ) {
    setJobs(
      (current) =>
        current.map(
          (job) =>
            job.id === id
              ? {
                  ...job,
                  [field]:
                    value,
                }
              : job,
        ),
    );
  }

  function addJob() {
    setJobs(
      (current) => [
        ...current,
        createEmptyJob(),
      ],
    );
  }

  function removeJob(
    id: string,
  ) {
    setJobs(
      (current) => {
        if (
          current.length === 1
        ) {
          return current;
        }

        return current.filter(
          (job) =>
            job.id !== id,
        );
      },
    );
  }

  const validJobs =
    jobs.filter(
      (job) =>
        job.title.trim() &&
        job.description
          .trim()
          .length >= 80,
    );

  const canContinue =
    validJobs.length ===
      jobs.length &&
    jobs.length > 0;

  function continueToReview() {
    if (!canContinue) {
      return;
    }

    const cleanedJobs =
      jobs.map(
        (job) => ({
          ...job,
          title:
            job.title.trim(),
          company:
            job.company.trim(),
          description:
            job.description.trim(),
        }),
      );

    localStorage.setItem(
      "resume-match-jobs",
      JSON.stringify(
        cleanedJobs,
      ),
    );

    localStorage.setItem(
      "resume-match-review",
      JSON.stringify({
        jobs:
          cleanedJobs,
      }),
    );

    router.push(
      "/novo/revisao",
    );
  }

  if (loading) {
    return (
      <main
        className="
          min-h-screen
          bg-[#F7F7F5]
        "
      >
        <div
          className="
            mx-auto
            max-w-[960px]
            px-6
            py-20
            text-sm
            text-[#686864]
          "
        >
          Carregando currículo...
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
            justify-between
            gap-6
            px-6
            lg:px-10
          "
        >
          <img
            src="/brand/resume-match-logo-horizontal.svg"
            alt="Resume Match"
            className="h-9 w-auto"
          />

          <button
            type="button"
            onClick={() =>
              router.push(
                "/resultados",
              )
            }
            className="
              text-sm
              font-medium
              text-[#686864]
            "
          >
            Voltar aos resultados
          </button>
        </div>
      </header>

      <div
        className="
          mx-auto
          max-w-[960px]
          px-6
          py-14
          lg:py-18
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
            Novas oportunidades
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
            Adicione as vagas que
            você quer comparar.
          </h1>

          <p
            className="
              mt-5
              text-base
              leading-7
              text-[#686864]
            "
          >
            Você não precisa
            importar o currículo
            novamente. Vamos usar o
            currículo-base já
            revisado e criar uma
            versão separada para cada
            oportunidade.
          </p>
        </div>

        {resume && (
          <div
            className="
              mt-8
              flex
              items-center
              justify-between
              gap-5
              rounded-xl
              border
              border-[#DEDEDA]
              bg-white
              p-5
            "
          >
            <div>
              <p
                className="
                  text-xs
                  text-[#777772]
                "
              >
                Currículo-base ativo
              </p>

              <p
                className="
                  mt-1
                  font-semibold
                "
              >
                {resume.name}
              </p>

              {resume.headline && (
                <p
                  className="
                    mt-1
                    text-sm
                    text-[#686864]
                  "
                >
                  {resume.headline}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/novo/revisar-curriculo",
                )
              }
              className="
                shrink-0
                rounded-lg
                border
                border-[#DCDCD8]
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
              "
            >
              Revisar currículo
            </button>
          </div>
        )}

        <div
          className="
            mt-8
            grid
            gap-5
          "
        >
          {jobs.map(
            (
              job,
              index,
            ) => {
              const descriptionLength =
                job.description
                  .trim()
                  .length;

              const ready =
                Boolean(
                  job.title.trim(),
                ) &&
                descriptionLength >=
                  80;

              return (
                <article
                  key={job.id}
                  className="
                    rounded-xl
                    border
                    border-[#DEDEDA]
                    bg-white
                    p-5
                    sm:p-6
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-5
                    "
                  >
                    <div>
                      <p
                        className="
                          text-xs
                          font-semibold
                          text-[#E9426B]
                        "
                      >
                        Vaga{" "}
                        {index + 1}
                      </p>

                      <h2
                        className="
                          mt-1
                          text-lg
                          font-semibold
                        "
                      >
                        Dados da
                        oportunidade
                      </h2>
                    </div>

                    {jobs.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeJob(
                            job.id,
                          )
                        }
                        className="
                          text-sm
                          font-medium
                          text-[#9A545F]
                        "
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div
                    className="
                      mt-6
                      grid
                      gap-5
                    "
                  >
                    <label
                      className="
                        grid
                        gap-2
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-semibold
                        "
                      >
                        Cargo
                      </span>

                      <input
                        value={
                          job.title
                        }
                        onChange={(
                          event,
                        ) =>
                          updateJob(
                            job.id,
                            "title",
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Ex.: Senior Product Designer"
                        className="
                          h-12
                          rounded-lg
                          border
                          border-[#DCDCD8]
                          bg-white
                          px-4
                          outline-none
                          transition
                          focus:border-[#181818]
                        "
                      />
                    </label>

                    <label
                      className="
                        grid
                        gap-2
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-semibold
                        "
                      >
                        Empresa
                        <span
                          className="
                            ml-1
                            font-normal
                            text-[#8A8A85]
                          "
                        >
                          opcional
                        </span>
                      </span>

                      <input
                        value={
                          job.company
                        }
                        onChange={(
                          event,
                        ) =>
                          updateJob(
                            job.id,
                            "company",
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Ex.: Empresa"
                        className="
                          h-12
                          rounded-lg
                          border
                          border-[#DCDCD8]
                          bg-white
                          px-4
                          outline-none
                          transition
                          focus:border-[#181818]
                        "
                      />
                    </label>

                    <label
                      className="
                        grid
                        gap-2
                      "
                    >
                      <span
                        className="
                          text-sm
                          font-semibold
                        "
                      >
                        Descrição da
                        vaga
                      </span>

                      <textarea
                        value={
                          job.description
                        }
                        onChange={(
                          event,
                        ) =>
                          updateJob(
                            job.id,
                            "description",
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Cole aqui a descrição completa da vaga..."
                        className="
                          min-h-[240px]
                          resize-y
                          rounded-lg
                          border
                          border-[#DCDCD8]
                          bg-white
                          p-4
                          leading-6
                          outline-none
                          transition
                          focus:border-[#181818]
                        "
                      />
                    </label>

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        text-xs
                      "
                    >
                      <span
                        className={
                          ready
                            ? "font-medium text-[#247A52]"
                            : "text-[#777772]"
                        }
                      >
                        {ready
                          ? "✓ Pronta para análise"
                          : "Preencha o cargo e use ao menos 80 caracteres na descrição"}
                      </span>

                      <span
                        className="
                          text-[#8A8A85]
                        "
                      >
                        {
                          descriptionLength
                        }{" "}
                        caracteres
                      </span>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>

        <button
          type="button"
          onClick={
            addJob
          }
          className="
            mt-5
            w-full
            rounded-xl
            border
            border-dashed
            border-[#CFCFCA]
            bg-transparent
            px-5
            py-4
            text-sm
            font-semibold
            text-[#4F4F4B]
            transition
            hover:bg-white
          "
        >
          + Adicionar outra vaga
        </button>

        <div
          className="
            mt-8
            flex
            flex-col
            gap-3
            border-t
            border-[#DEDEDA]
            pt-6
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div
            className="
              text-sm
              text-[#686864]
            "
          >
            {
              validJobs.length
            }{" "}
            de {jobs.length}{" "}
            {jobs.length === 1
              ? "vaga pronta"
              : "vagas prontas"}
          </div>

          <button
            type="button"
            disabled={
              !canContinue
            }
            onClick={
              continueToReview
            }
            className={`
              h-12
              rounded-lg
              px-6
              text-sm
              font-semibold
              text-white
              transition

              ${
                canContinue
                  ? "bg-[#181818] hover:bg-black"
                  : "cursor-not-allowed bg-[#A7A7A2]"
              }
            `}
          >
            Revisar{" "}
            {jobs.length === 1
              ? "vaga"
              : `${jobs.length} vagas`}
          </button>
        </div>
      </div>
    </main>
  );
}