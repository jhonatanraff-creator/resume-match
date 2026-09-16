"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type JobDraft = {
  id: string;
  title: string;
  company: string;
  description: string;
};

export default function ReviewPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedJobs = localStorage.getItem("resume-match-jobs");

    if (savedJobs) {
      try {
        const parsedJobs = JSON.parse(savedJobs) as JobDraft[];
        setJobs(parsedJobs);
      } catch {
        setJobs([]);
      }
    }

    setLoading(false);
  }, []);

  function generateResumes() {
    if (jobs.length === 0) {
      return;
    }

    localStorage.setItem(
      "resume-match-review",
      JSON.stringify({
        jobs,
        createdAt: new Date().toISOString(),
      }),
    );

    router.push("/novo/processando");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] text-[#181818]">
        <p className="text-sm text-[#686864]">Carregando revisão...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#181818]">
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

      {/* Stepper */}
      <div className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto max-w-[1040px] px-6 py-6">
          <ol className="grid grid-cols-4 gap-3">
            <li>
              <div className="h-1 rounded-full bg-[#247A52]" />
              <div className="mt-3">
                <span className="text-xs font-semibold text-[#247A52]">
                  ✓
                </span>
                <p className="mt-1 text-sm font-medium text-[#686864]">
                  Currículo
                </p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#247A52]" />
              <div className="mt-3">
                <span className="text-xs font-semibold text-[#247A52]">
                  ✓
                </span>
                <p className="mt-1 text-sm font-medium text-[#686864]">
                  Vagas
                </p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#E9426B]" />
              <div className="mt-3">
                <span className="text-xs font-semibold text-[#E9426B]">
                  03
                </span>
                <p className="mt-1 text-sm font-semibold">Revisão</p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />
              <div className="mt-3">
                <span className="text-xs font-semibold text-[#A0A09A]">
                  04
                </span>
                <p className="mt-1 text-sm text-[#777772]">Resultados</p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <div className="max-w-[720px]">
              <p className="text-sm font-semibold text-[#E9426B]">
                Antes de gerar
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Revise esta rodada.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#686864]">
                Confira as oportunidades antes de iniciar a geração. Cada vaga
                será processada separadamente usando o mesmo currículo-base.
              </p>
            </div>

            {/* Resume */}
            <div className="mt-10 rounded-xl border border-[#DEDEDA] bg-white">
              <div className="border-b border-[#E7E7E3] px-5 py-4 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#777772]">
                  Currículo-base
                </p>
              </div>

              <div className="flex items-center gap-4 p-5 sm:p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFE4EB] text-xs font-bold text-[#E9426B]">
                  PDF
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Currículo importado</p>
                  <p className="mt-1 text-sm text-[#777772]">
                    Usado como fonte para todas as versões
                  </p>
                </div>

                <a
                  href="/novo/importar"
                  className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
                >
                  Trocar
                </a>
              </div>
            </div>

            {/* Jobs */}
            <div className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold">Vagas desta rodada</p>
                  <p className="mt-1 text-sm text-[#777772]">
                    {jobs.length === 1
                      ? "1 currículo será gerado"
                      : `${jobs.length} currículos serão gerados`}
                  </p>
                </div>

                <a
                  href="/novo/vaga"
                  className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
                >
                  Editar vagas
                </a>
              </div>

              {jobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#CBCBC5] bg-white p-8 text-center">
                  <p className="font-semibold">Nenhuma vaga encontrada</p>

                  <p className="mt-2 text-sm text-[#777772]">
                    Volte para adicionar pelo menos uma oportunidade.
                  </p>

                  <a
                    href="/novo/vaga"
                    className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white"
                  >
                    Adicionar vaga
                  </a>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#DEDEDA] bg-white">
                  {jobs.map((job, index) => (
                    <article
                      key={job.id}
                      className={`p-5 sm:p-6 ${
                        index !== jobs.length - 1
                          ? "border-b border-[#E7E7E3]"
                          : ""
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F0ED] text-xs font-semibold text-[#686864]">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                            <h2 className="font-semibold">
                              {job.title || `Vaga ${index + 1}`}
                            </h2>

                            {job.company && (
                              <>
                                <span className="hidden text-[#CBCBC5] sm:inline">
                                  ·
                                </span>

                                <span className="text-sm text-[#686864]">
                                  {job.company}
                                </span>
                              </>
                            )}
                          </div>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#777772]">
                            {job.description}
                          </p>

                          <div className="mt-4 flex items-center gap-2">
                            <span className="text-sm text-[#247A52]">✓</span>

                            <span className="text-xs font-medium text-[#247A52]">
                              Pronta para análise
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[#DEDEDA] pt-6">
              <a
                href="/novo/vaga"
                className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
              >
                Voltar
              </a>

              <button
                type="button"
                disabled={jobs.length === 0}
                onClick={generateResumes}
                className="h-11 rounded-lg bg-[#181818] px-6 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-not-allowed disabled:bg-[#CBCBC5] disabled:text-[#777772]"
              >
                {jobs.length === 0
                  ? "Gerar currículos"
                  : jobs.length === 1
                    ? "Gerar 1 currículo"
                    : `Gerar ${jobs.length} currículos`}
              </button>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="h-fit lg:sticky lg:top-8">
            <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
              <p className="text-sm font-semibold">Resumo da rodada</p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E7E3] pb-4">
                  <span className="text-sm text-[#686864]">
                    Currículo-base
                  </span>

                  <span className="text-sm font-semibold">1</span>
                </div>

                <div className="flex items-center justify-between border-b border-[#E7E7E3] pb-4">
                  <span className="text-sm text-[#686864]">Vagas</span>

                  <span className="text-sm font-semibold">{jobs.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#686864]">
                    PDFs previstos
                  </span>

                  <span className="text-sm font-semibold">{jobs.length}</span>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-[#F7F7F5] p-4">
                <p className="text-xs leading-5 text-[#686864]">
                  A geração de uma vaga não altera as demais. Cada currículo
                  terá seu próprio conteúdo e arquivo final.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#DEDEDA] bg-white p-5">
              <p className="text-sm font-semibold">O que acontece depois?</p>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#686864]">
                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Análise individual de cada vaga
                </li>

                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Adaptação do conteúdo do currículo
                </li>

                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Um PDF independente por oportunidade
                </li>

                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Versões salvas no histórico
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}