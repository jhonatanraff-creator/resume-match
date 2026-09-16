"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type JobDraft = {
  id: string;
  title: string;
  company: string;
  description: string;
};

const initialJob: JobDraft = {
  id: "job-1",
  title: "",
  company: "",
  description: "",
};

export default function JobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobDraft[]>([initialJob]);

  const readyJobs = useMemo(
    () =>
      jobs.filter((job) => job.description.trim().length >= 80),
    [jobs],
  );

  function updateJob(
    id: string,
    field: keyof Omit<JobDraft, "id">,
    value: string,
  ) {
    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === id ? { ...job, [field]: value } : job,
      ),
    );
  }

  function addJob() {
    setJobs((currentJobs) => [
      ...currentJobs,
      {
        id: `job-${Date.now()}`,
        title: "",
        company: "",
        description: "",
      },
    ]);
  }

  function removeJob(id: string) {
    setJobs((currentJobs) => {
      if (currentJobs.length === 1) {
        return currentJobs;
      }

      return currentJobs.filter((job) => job.id !== id);
    });
  }

  function continueFlow() {
    if (readyJobs.length === 0) {
      return;
    }

    localStorage.setItem(
      "resume-match-jobs",
      JSON.stringify(readyJobs),
    );

    router.push("/novo/revisao");
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#181818]">
      {/* Header */}
      <header className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 lg:px-10">
          <a href="/">
            <img
              src="/brand/resume-match-logo-horizontal.svg"
              alt="Resume Match"
              className="h-9 w-auto"
            />
          </a>

          <a
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-medium transition hover:bg-[#F2F2EF]"
          >
            Sair
          </a>
        </div>
      </header>

      {/* Resume context */}
      <div className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFE4EB] text-xs font-bold text-[#E9426B]">
              PDF
            </div>

            <div>
              <p className="text-xs font-medium text-[#777772]">
                Currículo-base
              </p>

              <p className="mt-1 text-sm font-semibold">
                Currículo importado
              </p>
            </div>
          </div>

          <a
            href="/novo/importar"
            className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
          >
            Trocar currículo-base
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main content */}
          <section>
            <div className="max-w-[720px]">
              <p className="text-sm font-semibold text-[#E9426B]">
                Candidaturas
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Adicione as vagas que quer trabalhar.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#686864]">
                Você pode adicionar várias oportunidades de uma vez. Cada vaga
                será analisada separadamente e receberá sua própria versão do
                currículo.
              </p>
            </div>

            {/* Jobs */}
            <div className="mt-10 space-y-5">
              {jobs.map((job, index) => {
                const isReady =
                  job.description.trim().length >= 80;

                return (
                  <article
                    key={job.id}
                    className="rounded-xl border border-[#DEDEDA] bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-[#E7E7E3] px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F0F0ED] text-xs font-semibold text-[#686864]">
                          {index + 1}
                        </span>

                        <p className="text-sm font-semibold">
                          {job.title.trim()
                            ? job.title
                            : `Vaga ${index + 1}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`text-xs font-medium ${
                            isReady
                              ? "text-[#247A52]"
                              : "text-[#969691]"
                          }`}
                        >
                          {isReady ? "Pronta" : "Em preenchimento"}
                        </span>

                        {jobs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeJob(job.id)}
                            className="text-xs font-medium text-[#777772] transition hover:text-[#B83A3A]"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium">
                            Cargo
                          </span>

                          <input
                            type="text"
                            value={job.title}
                            onChange={(event) =>
                              updateJob(
                                job.id,
                                "title",
                                event.target.value,
                              )
                            }
                            placeholder="Ex.: Product Designer Especialista"
                            className="h-11 w-full rounded-lg border border-[#CBCBC5] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#A0A09A] focus:border-[#181818] focus:ring-1 focus:ring-[#181818]"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium">
                            Empresa
                            <span className="ml-1 font-normal text-[#969691]">
                              opcional
                            </span>
                          </span>

                          <input
                            type="text"
                            value={job.company}
                            onChange={(event) =>
                              updateJob(
                                job.id,
                                "company",
                                event.target.value,
                              )
                            }
                            placeholder="Ex.: Empresa"
                            className="h-11 w-full rounded-lg border border-[#CBCBC5] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#A0A09A] focus:border-[#181818] focus:ring-1 focus:ring-[#181818]"
                          />
                        </label>
                      </div>

                      <label className="mt-5 block">
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <span className="text-sm font-medium">
                            Descrição da vaga
                          </span>

                          <span className="text-xs text-[#969691]">
                            {job.description.length.toLocaleString("pt-BR")}
                            {" / "}
                            15.000
                          </span>
                        </div>

                        <textarea
                          value={job.description}
                          maxLength={15000}
                          rows={9}
                          onChange={(event) =>
                            updateJob(
                              job.id,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Cole aqui a descrição completa da vaga, incluindo responsabilidades, requisitos e informações relevantes."
                          className="w-full resize-y rounded-lg border border-[#CBCBC5] bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-[#A0A09A] focus:border-[#181818] focus:ring-1 focus:ring-[#181818]"
                        />
                      </label>

                      <div className="mt-3 flex items-start gap-2">
                        <span
                          className={`mt-[2px] text-sm ${
                            isReady
                              ? "text-[#247A52]"
                              : "text-[#969691]"
                          }`}
                        >
                          {isReady ? "✓" : "○"}
                        </span>

                        <p className="text-xs leading-5 text-[#777772]">
                          {isReady
                            ? "Descrição suficiente para analisar esta oportunidade."
                            : "Cole a descrição completa da vaga para continuar."}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addJob}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#BCBCB6] bg-transparent px-5 py-4 text-sm font-semibold text-[#686864] transition hover:border-[#777772] hover:bg-white hover:text-[#181818]"
            >
              <span className="text-lg font-normal">+</span>
              Adicionar outra vaga
            </button>
          </section>

          {/* Sidebar */}
          <aside className="h-fit lg:sticky lg:top-8">
            <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
              <p className="text-sm font-semibold">
                Esta rodada
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E7E3] pb-4">
                  <span className="text-sm text-[#686864]">
                    Vagas adicionadas
                  </span>

                  <span className="text-sm font-semibold">
                    {jobs.length}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#E7E7E3] pb-4">
                  <span className="text-sm text-[#686864]">
                    Prontas para análise
                  </span>

                  <span className="text-sm font-semibold">
                    {readyJobs.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#686864]">
                    PDFs ao final
                  </span>

                  <span className="text-sm font-semibold">
                    {readyJobs.length}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-[#F7F7F5] p-4">
                <p className="text-xs leading-5 text-[#686864]">
                  Cada vaga gera uma versão independente do currículo. Seu
                  currículo-base continua disponível para futuras
                  candidaturas.
                </p>
              </div>

              <button
                type="button"
                disabled={readyJobs.length === 0}
                onClick={continueFlow}
                className="mt-5 h-11 w-full rounded-lg bg-[#181818] px-5 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-not-allowed disabled:bg-[#CBCBC5] disabled:text-[#777772]"
              >
                {readyJobs.length === 0
                  ? "Adicione uma vaga"
                  : readyJobs.length === 1
                    ? "Revisar 1 vaga"
                    : `Revisar ${readyJobs.length} vagas`}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-[#969691]">
                Você ainda poderá editar tudo antes de gerar os currículos.
              </p>
            </div>

            <a
              href="/novo/importar"
              className="mt-5 block text-center text-sm font-medium text-[#686864] transition hover:text-[#181818]"
            >
              Voltar ao currículo-base
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}