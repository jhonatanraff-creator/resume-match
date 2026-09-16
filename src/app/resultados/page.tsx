"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  id: string;
  title: string;
  company: string;
  description: string;
  compatibility: number;
  status: string;
};

export default function ResultsPage() {
  const router = useRouter();

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const savedResults = localStorage.getItem("resume-match-results");

    if (!savedResults) {
      setLoading(false);
      return;
    }

    try {
      const parsedResults = JSON.parse(savedResults) as Result[];
      setResults(parsedResults);
    } catch {
      setResults([]);
    }

    setLoading(false);
  }, []);

  const averageCompatibility = useMemo(() => {
    if (results.length === 0) {
      return 0;
    }

    const total = results.reduce(
      (sum, result) => sum + result.compatibility,
      0,
    );

    return Math.round(total / results.length);
  }, [results]);

  function buildResumeText(result: Result) {
    return [
      result.title,
      result.company ? result.company : "",
      "",
      "Versão direcionada para esta oportunidade",
      "",
      "Descrição da vaga utilizada como referência:",
      result.description,
      "",
      "Esta é uma visualização de teste. A adaptação real do currículo será adicionada quando conectarmos a análise de IA.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function copyResume(result: Result) {
    await navigator.clipboard.writeText(buildResumeText(result));

    setCopiedId(result.id);

    window.setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5]">
        <p className="text-sm text-[#686864]">Carregando resultados...</p>
      </main>
    );
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

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="/"
              className="text-[#686864] transition hover:text-[#181818]"
            >
              Início
            </a>

            <span className="font-medium">Resultados</span>
          </nav>

          <button className="h-10 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-medium transition hover:bg-[#F2F2EF]">
            Conta
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-8 border-b border-[#DEDEDA] pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <p className="text-sm font-semibold text-[#247A52]">
              Rodada concluída
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Seus currículos estão prontos.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[#686864]">
              Cada oportunidade recebeu uma versão independente. Você pode
              revisar os resultados e continuar adicionando novas vagas usando
              o mesmo currículo-base.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/novo/vaga")}
            className="h-11 self-start rounded-lg bg-[#181818] px-5 text-sm font-semibold text-white transition hover:bg-black lg:self-auto"
          >
            + Adicionar novas vagas
          </button>
        </div>

        {results.length === 0 ? (
          <div className="mt-10 flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-[#CBCBC5] bg-white px-6 text-center">
            <img
              src="/brand/resume-match-icon-monochrome.svg"
              alt=""
              className="h-10 w-10 opacity-25"
            />

            <h2 className="mt-5 text-lg font-semibold">
              Nenhum resultado encontrado
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#777772]">
              Adicione uma vaga para criar sua primeira versão direcionada do
              currículo.
            </p>

            <button
              type="button"
              onClick={() => router.push("/novo/vaga")}
              className="mt-6 h-10 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white"
            >
              Adicionar vaga
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            {/* Results */}
            <section>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.02em]">
                    Resultados desta rodada
                  </h2>

                  <p className="mt-1 text-sm text-[#777772]">
                    {results.length === 1
                      ? "1 currículo preparado"
                      : `${results.length} currículos preparados`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {results.map((result, index) => {
                  const expanded = expandedId === result.id;

                  return (
                    <article
                      key={result.id}
                      className="overflow-hidden rounded-xl border border-[#DEDEDA] bg-white"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F0ED] text-xs font-semibold text-[#686864]">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1">
                              <h3 className="text-lg font-semibold tracking-[-0.01em]">
                                {result.title}
                              </h3>

                              {result.company && (
                                <p className="text-sm text-[#686864]">
                                  {result.company}
                                </p>
                              )}
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                              <div className="rounded-lg bg-[#F1F7F3] px-3 py-2">
                                <span className="text-xs text-[#686864]">
                                  Compatibilidade estimada
                                </span>

                                <strong className="ml-2 text-sm text-[#247A52]">
                                  {result.compatibility}%
                                </strong>
                              </div>

                              <span className="text-xs text-[#247A52]">
                                ✓ Currículo preparado
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E7E7E3] pt-5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(
                                expanded ? null : result.id,
                              )
                            }
                            className="h-10 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                          >
                            {expanded
                              ? "Fechar visualização"
                              : "Ver currículo"}
                          </button>

                          <button
                            type="button"
                            onClick={() => copyResume(result)}
                            className="h-10 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                          >
                            {copiedId === result.id
                              ? "Texto copiado"
                              : "Copiar texto"}
                          </button>

                          <button
                            type="button"
                            disabled
                            className="h-10 cursor-not-allowed rounded-lg bg-[#E4E4E0] px-4 text-sm font-semibold text-[#92928D]"
                            title="A geração real de PDF será implementada na próxima etapa."
                          >
                            Baixar PDF
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="border-t border-[#DEDEDA] bg-[#FAFAF8] p-5 sm:p-6">
                          <div className="mx-auto max-w-[680px] rounded-lg border border-[#DEDEDA] bg-white p-6 sm:p-8">
                            <div className="border-b border-[#E7E7E3] pb-5">
                              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#969691]">
                                Visualização de teste
                              </p>

                              <h4 className="mt-3 text-2xl font-semibold">
                                {result.title}
                              </h4>

                              {result.company && (
                                <p className="mt-1 text-sm text-[#686864]">
                                  {result.company}
                                </p>
                              )}
                            </div>

                            <div className="py-6">
                              <h5 className="text-sm font-semibold">
                                Descrição utilizada
                              </h5>

                              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#686864]">
                                {result.description}
                              </p>
                            </div>

                            <div className="border-t border-[#E7E7E3] pt-5">
                              <p className="text-xs leading-5 text-[#858580]">
                                A adaptação real do conteúdo será criada quando
                                conectarmos o motor de inteligência artificial.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Sidebar */}
            <aside className="h-fit space-y-4 lg:sticky lg:top-8">
              <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                <p className="text-sm font-semibold">Resumo</p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7E7E3] pb-4">
                    <span className="text-sm text-[#686864]">
                      Currículos
                    </span>

                    <span className="text-sm font-semibold">
                      {results.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-[#E7E7E3] pb-4">
                    <span className="text-sm text-[#686864]">
                      Compatibilidade média
                    </span>

                    <span className="text-sm font-semibold">
                      {averageCompatibility}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#686864]">
                      Currículo-base
                    </span>

                    <span className="text-sm font-semibold">1</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                <p className="text-sm font-semibold">
                  Continue deste currículo
                </p>

                <p className="mt-2 text-sm leading-6 text-[#686864]">
                  Não é necessário importar seu currículo novamente para novas
                  oportunidades.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/novo/vaga")}
                  className="mt-5 h-10 w-full rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Adicionar vagas
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/novo/importar")}
                  className="mt-2 h-10 w-full rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                >
                  Trocar currículo-base
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}