"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  id: string;
  roundId: string;
  title: string;
  company: string;
  description: string;
  compatibility: number;
  status: string;
  createdAt: string;
};

export default function ResultsPage() {
  const router = useRouter();

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("resume-match-history");
    const savedRound = localStorage.getItem("resume-match-current-round");

    if (savedHistory) {
      try {
        setResults(JSON.parse(savedHistory) as Result[]);
      } catch {
        setResults([]);
      }
    }

    if (savedRound) {
      try {
        const parsedRound = JSON.parse(savedRound);
        setCurrentRoundId(parsedRound.roundId);
      } catch {
        setCurrentRoundId(null);
      }
    }

    setLoading(false);
  }, []);

  const currentResults = useMemo(
    () =>
      currentRoundId
        ? results.filter((result) => result.roundId === currentRoundId)
        : [],
    [results, currentRoundId],
  );

  const previousResults = useMemo(
    () =>
      currentRoundId
        ? results.filter((result) => result.roundId !== currentRoundId)
        : results,
    [results, currentRoundId],
  );

  function buildResumeText(result: Result) {
    return [
      result.title,
      result.company || "",
      "",
      "Versão direcionada para esta oportunidade",
      "",
      "Descrição da vaga utilizada como referência:",
      result.description,
      "",
      "Esta é uma visualização de teste. A adaptação real será adicionada quando conectarmos o motor de IA.",
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

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function renderResult(result: Result) {
    const expanded = expandedId === result.id;

    return (
      <article
        key={result.id}
        className="overflow-hidden rounded-xl border border-[#DEDEDA] bg-white"
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F0ED] text-sm font-semibold">
              CV
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold tracking-[-0.01em]">
                {result.title}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {result.company && (
                  <span className="text-sm text-[#686864]">
                    {result.company}
                  </span>
                )}

                <span className="text-xs text-[#969691]">
                  {formatDate(result.createdAt)}
                </span>
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

                <span className="text-xs font-medium text-[#247A52]">
                  ✓ Pronto
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E7E7E3] pt-5">
            <button
              type="button"
              onClick={() =>
                setExpandedId(expanded ? null : result.id)
              }
              className="h-10 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-semibold transition hover:bg-[#F2F2EF]"
            >
              {expanded ? "Fechar" : "Ver currículo"}
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
            >
              Baixar PDF
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-[#DEDEDA] bg-[#FAFAF8] p-5 sm:p-6">
            <div className="mx-auto max-w-[680px] rounded-lg border border-[#DEDEDA] bg-white p-6 sm:p-8">
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

              <div className="mt-6 border-t border-[#E7E7E3] pt-6">
                <h5 className="text-sm font-semibold">
                  Descrição da vaga utilizada
                </h5>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#686864]">
                  {result.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </article>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5]">
        <p className="text-sm text-[#686864]">Carregando...</p>
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

          <button className="h-10 rounded-lg border border-[#D6D6D1] px-4 text-sm font-medium">
            Conta
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-8 border-b border-[#DEDEDA] pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#686864]">
              Candidaturas
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Seus currículos.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[#686864]">
              Continue usando seu currículo-base para novas oportunidades.
              Cada candidatura fica salva separadamente.
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
          <div className="mt-10 rounded-xl border border-dashed border-[#CBCBC5] bg-white p-10 text-center">
            <h2 className="font-semibold">
              Nenhuma candidatura ainda
            </h2>

            <button
              onClick={() => router.push("/novo/vaga")}
              className="mt-5 h-10 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white"
            >
              Adicionar vaga
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section>
              {currentResults.length > 0 && (
                <div>
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-[#247A52]">
                      Gerados agora
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      Última rodada
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {currentResults.map(renderResult)}
                  </div>
                </div>
              )}

              {previousResults.length > 0 && (
                <div className={currentResults.length ? "mt-12" : ""}>
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-[#686864]">
                      Histórico
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      Candidaturas anteriores
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {previousResults.map(renderResult)}
                  </div>
                </div>
              )}
            </section>

            <aside className="h-fit space-y-4 lg:sticky lg:top-8">
              <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                <p className="text-sm font-semibold">
                  Seu workspace
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex justify-between border-b border-[#E7E7E3] pb-4">
                    <span className="text-sm text-[#686864]">
                      Candidaturas
                    </span>

                    <strong className="text-sm">
                      {results.length}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-[#686864]">
                      Currículo-base
                    </span>

                    <strong className="text-sm">1</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                <p className="text-sm font-semibold">
                  Próxima oportunidade?
                </p>

                <p className="mt-2 text-sm leading-6 text-[#686864]">
                  Adicione novas vagas sem importar seu currículo novamente.
                </p>

                <button
                  onClick={() => router.push("/novo/vaga")}
                  className="mt-5 h-10 w-full rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white"
                >
                  Adicionar vagas
                </button>

                <button
                  onClick={() => router.push("/novo/importar")}
                  className="mt-2 h-10 w-full rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold"
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