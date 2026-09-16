"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateResumePdf } from "@/lib/generate-resume-pdf";

type Result = {
  id: string;
  roundId?: string;
  title: string;
  company: string;
  description: string;
  compatibility: number;
  status: string;
  createdAt: string;
  resumeText?: string;
  sourceResumeFile?: string;
};

export default function ResultsPage() {
  const router = useRouter();

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(
    null,
  );

  const [copiedId, setCopiedId] = useState<string | null>(
    null,
  );

  const [downloadingId, setDownloadingId] = useState<
    string | null
  >(null);

  const [downloadedId, setDownloadedId] = useState<
    string | null
  >(null);

  const [downloadErrorId, setDownloadErrorId] = useState<
    string | null
  >(null);

  const [currentRoundId, setCurrentRoundId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem(
      "resume-match-history",
    );

    const savedRound = localStorage.getItem(
      "resume-match-current-round",
    );

    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as Result[];
        setResults(parsed);
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

  const currentResults = useMemo(() => {
    if (!currentRoundId) {
      return [];
    }

    return results.filter(
      (result) => result.roundId === currentRoundId,
    );
  }, [results, currentRoundId]);

  const previousResults = useMemo(() => {
    if (!currentRoundId) {
      return results;
    }

    return results.filter(
      (result) => result.roundId !== currentRoundId,
    );
  }, [results, currentRoundId]);

  function getResumeText(result: Result) {
    if (result.resumeText?.trim()) {
      return result.resumeText.trim();
    }

    return [
      "Este resultado foi criado antes da leitura real do currículo-base.",
      "",
      "Descrição da vaga:",
      result.description,
    ].join("\n");
  }

  async function copyResume(result: Result) {
    try {
      await navigator.clipboard.writeText(
        getResumeText(result),
      );

      setCopiedId(result.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    } catch {
      setCopiedId(null);
    }
  }

  async function downloadPdf(result: Result) {
    if (!result.resumeText?.trim()) {
      setDownloadErrorId(result.id);

      window.setTimeout(() => {
        setDownloadErrorId(null);
      }, 2500);

      return;
    }

    setDownloadingId(result.id);
    setDownloadedId(null);
    setDownloadErrorId(null);

    try {
      const generated = await generateResumePdf({
        resumeText: result.resumeText,
        jobTitle: result.title,
        company: result.company,
      });

      console.log(
        `PDF gerado: ${generated.fileName} (${generated.size} bytes)`,
      );

      setDownloadedId(result.id);

      window.setTimeout(() => {
        setDownloadedId(null);
      }, 2200);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);

      setDownloadErrorId(result.id);

      window.setTimeout(() => {
        setDownloadErrorId(null);
      }, 2500);
    } finally {
      setDownloadingId(null);
    }
  }

  function formatDate(date: string) {
    if (!date) {
      return "";
    }

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

    const hasRealResume = Boolean(
      result.resumeText?.trim(),
    );

    const isDownloading =
      downloadingId === result.id;

    const wasDownloaded =
      downloadedId === result.id;

    const hasDownloadError =
      downloadErrorId === result.id;

    return (
      <article
        key={result.id}
        className="overflow-hidden rounded-xl border border-[#DEDEDA] bg-white"
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F0ED] text-xs font-semibold text-[#686864]">
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

                {result.createdAt && (
                  <span className="text-xs text-[#969691]">
                    {formatDate(result.createdAt)}
                  </span>
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

                <span className="text-xs font-medium text-[#247A52]">
                  ✓ Pronto
                </span>
              </div>

              {result.sourceResumeFile && (
                <div className="mt-4 flex items-center gap-2 text-xs text-[#777772]">
                  <span>Fonte:</span>

                  <span className="font-medium text-[#4F4F4B]">
                    {result.sourceResumeFile}
                  </span>
                </div>
              )}
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
                ? "Fechar currículo"
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
              onClick={() => downloadPdf(result)}
              disabled={
                !hasRealResume || isDownloading
              }
              className="h-10 min-w-[120px] rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-not-allowed disabled:bg-[#D9D9D5] disabled:text-[#8D8D88]"
            >
              {isDownloading
                ? "Gerando..."
                : wasDownloaded
                  ? "PDF baixado"
                  : "Baixar PDF"}
            </button>
          </div>

          {hasDownloadError && (
            <div className="mt-4 rounded-lg bg-[#FFF0F0] px-4 py-3">
              <p className="text-xs font-medium leading-5 text-[#B83A3A]">
                Não foi possível gerar este PDF. Tente
                novamente.
              </p>
            </div>
          )}

          {!hasRealResume && (
            <div className="mt-4 rounded-lg bg-[#FFF7E8] px-4 py-3">
              <p className="text-xs leading-5 text-[#92651C]">
                Esta candidatura foi criada antes da
                importação real do currículo. Gere uma nova
                candidatura para habilitar o PDF.
              </p>
            </div>
          )}
        </div>

        {expanded && (
          <div className="border-t border-[#DEDEDA] bg-[#F3F3F0] p-4 sm:p-6">
            <div className="mx-auto max-w-[760px] overflow-hidden rounded-xl border border-[#DADAD5] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
              <div className="border-b border-[#E7E7E3] px-6 py-5 sm:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#969691]">
                      Currículo
                    </p>

                    <h4 className="mt-2 text-xl font-semibold">
                      {result.title}
                    </h4>

                    {result.company && (
                      <p className="mt-1 text-sm text-[#686864]">
                        Versão para {result.company}
                      </p>
                    )}
                  </div>

                  {hasRealResume && (
                    <span className="self-start rounded-md bg-[#EAF5EE] px-2.5 py-1.5 text-xs font-medium text-[#247A52]">
                      Base real
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 py-7 sm:px-8 sm:py-9">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#353532]">
                  {getResumeText(result)}
                </pre>
              </div>

              <div className="border-t border-[#E7E7E3] bg-[#FAFAF8] px-6 py-4 sm:px-8">
                {hasRealResume ? (
                  <p className="text-xs leading-5 text-[#777772]">
                    Esta versão ainda reproduz seu
                    currículo-base. Na próxima etapa, o
                    conteúdo será adaptado especificamente
                    para esta oportunidade.
                  </p>
                ) : (
                  <p className="text-xs leading-5 text-[#B06A20]">
                    Este item foi criado antes da leitura
                    real do currículo-base.
                  </p>
                )}
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
        <p className="text-sm text-[#686864]">
          Carregando candidaturas...
        </p>
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

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a
              href="/"
              className="text-[#686864] transition hover:text-[#181818]"
            >
              Início
            </a>

            <span className="font-medium">
              Candidaturas
            </span>
          </nav>

          <button
            type="button"
            className="h-10 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-medium transition hover:bg-[#F2F2EF]"
          >
            Conta
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-8 border-b border-[#DEDEDA] pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <p className="text-sm font-semibold text-[#686864]">
              Candidaturas
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Seus currículos.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[#686864]">
              Cada vaga possui sua própria versão. Continue
              usando seu currículo-base para novas
              oportunidades.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/novo/vaga")
            }
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
              Nenhuma candidatura ainda
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#777772]">
              Adicione uma vaga para gerar sua primeira
              versão do currículo.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/novo/vaga")
              }
              className="mt-6 h-10 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white"
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

                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                      Última rodada
                    </h2>

                    <p className="mt-1 text-sm text-[#777772]">
                      {currentResults.length === 1
                        ? "1 currículo"
                        : `${currentResults.length} currículos`}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {currentResults.map(
                      renderResult,
                    )}
                  </div>
                </div>
              )}

              {previousResults.length > 0 && (
                <div
                  className={
                    currentResults.length > 0
                      ? "mt-14"
                      : ""
                  }
                >
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-[#686864]">
                      Histórico
                    </p>

                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                      Candidaturas anteriores
                    </h2>

                    <p className="mt-1 text-sm text-[#777772]">
                      {previousResults.length === 1
                        ? "1 candidatura salva"
                        : `${previousResults.length} candidaturas salvas`}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {previousResults.map(
                      renderResult,
                    )}
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
                  <div className="flex items-center justify-between border-b border-[#E7E7E3] pb-4">
                    <span className="text-sm text-[#686864]">
                      Candidaturas
                    </span>

                    <strong className="text-sm">
                      {results.length}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#686864]">
                      Currículo-base
                    </span>

                    <strong className="text-sm">
                      1
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                <p className="text-sm font-semibold">
                  Próxima oportunidade?
                </p>

                <p className="mt-2 text-sm leading-6 text-[#686864]">
                  Adicione novas vagas sem importar seu
                  currículo novamente.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/novo/vaga")
                  }
                  className="mt-5 h-10 w-full rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Adicionar vagas
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/novo/revisar-curriculo",
                    )
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                >
                  Ver currículo-base
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/novo/importar")
                  }
                  className="mt-2 h-10 w-full rounded-lg px-4 text-sm font-medium text-[#686864] transition hover:bg-[#F2F2EF] hover:text-[#181818]"
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