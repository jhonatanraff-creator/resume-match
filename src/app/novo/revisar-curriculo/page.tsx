"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ParsedResume = {
  fileName: string;
  fileSize: number;
  pages: number;
  text: string;
  importedAt: string;
};

export default function ReviewResumePage() {
  const router = useRouter();

  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedResume = localStorage.getItem(
      "resume-match-base-resume",
    );

    if (!storedResume) {
      router.replace("/novo/importar");
      return;
    }

    try {
      const parsed = JSON.parse(storedResume) as ParsedResume;

      setResume(parsed);
      setText(parsed.text);
    } catch {
      router.replace("/novo/importar");
      return;
    }

    setLoading(false);
  }, [router]);

  function formatFileSize(bytes: number) {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  function saveResume() {
    if (!resume) {
      return;
    }

    const updatedResume: ParsedResume = {
      ...resume,
      text: text.trim(),
    };

    localStorage.setItem(
      "resume-match-base-resume",
      JSON.stringify(updatedResume),
    );

    setResume(updatedResume);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1800);
  }

  function continueFlow() {
    if (!resume || !text.trim()) {
      return;
    }

    const updatedResume: ParsedResume = {
      ...resume,
      text: text.trim(),
    };

    localStorage.setItem(
      "resume-match-base-resume",
      JSON.stringify(updatedResume),
    );

    router.push("/novo/vaga");
  }

  if (loading || !resume) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5]">
        <p className="text-sm text-[#686864]">
          Carregando currículo...
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

          <a
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-medium transition hover:bg-[#F2F2EF]"
          >
            Sair
          </a>
        </div>
      </header>

      <div className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto max-w-[1040px] px-6 py-6">
          <ol className="grid grid-cols-4 gap-3">
            <li>
              <div className="h-1 rounded-full bg-[#E9426B]" />

              <div className="mt-3">
                <span className="text-xs font-semibold text-[#E9426B]">
                  01
                </span>

                <p className="mt-1 text-sm font-semibold">
                  Currículo
                </p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />

              <div className="mt-3">
                <span className="text-xs font-semibold text-[#A0A09A]">
                  02
                </span>

                <p className="mt-1 text-sm text-[#777772]">
                  Vagas
                </p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />

              <div className="mt-3">
                <span className="text-xs font-semibold text-[#A0A09A]">
                  03
                </span>

                <p className="mt-1 text-sm text-[#777772]">
                  Revisão
                </p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />

              <div className="mt-3">
                <span className="text-xs font-semibold text-[#A0A09A]">
                  04
                </span>

                <p className="mt-1 text-sm text-[#777772]">
                  Resultados
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <div className="max-w-[720px]">
              <p className="text-sm font-semibold text-[#E9426B]">
                Currículo-base
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Confira o que encontramos.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#686864]">
                Extraímos o conteúdo do seu PDF. Revise antes de
                continuar para garantir que nenhuma informação importante
                foi perdida durante a leitura.
              </p>
            </div>

            <div className="mt-10 rounded-xl border border-[#DEDEDA] bg-white">
              <div className="flex flex-col gap-5 border-b border-[#E7E7E3] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFE4EB] text-xs font-bold text-[#E9426B]">
                    PDF
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {resume.fileName}
                    </p>

                    <p className="mt-1 text-sm text-[#777772]">
                      {formatFileSize(resume.fileSize)}
                      {" · "}
                      {resume.pages}{" "}
                      {resume.pages === 1 ? "página" : "páginas"}
                    </p>
                  </div>
                </div>

                <a
                  href="/novo/importar"
                  className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
                >
                  Trocar arquivo
                </a>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <label
                      htmlFor="resume-text"
                      className="text-sm font-semibold"
                    >
                      Conteúdo extraído
                    </label>

                    <p className="mt-1 text-xs leading-5 text-[#777772]">
                      Você pode corrigir qualquer informação diretamente
                      neste campo.
                    </p>
                  </div>

                  <span className="shrink-0 text-xs text-[#969691]">
                    {text.length.toLocaleString("pt-BR")} caracteres
                  </span>
                </div>

                <textarea
                  id="resume-text"
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    setSaved(false);
                  }}
                  rows={24}
                  className="mt-4 w-full resize-y rounded-lg border border-[#CBCBC5] bg-white px-4 py-4 font-mono text-sm leading-6 outline-none transition focus:border-[#181818] focus:ring-1 focus:ring-[#181818]"
                />

                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-xs leading-5 text-[#777772]">
                    Alterar este texto não modifica seu PDF original.
                  </p>

                  <button
                    type="button"
                    onClick={saveResume}
                    disabled={!text.trim()}
                    className="h-10 shrink-0 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-semibold transition enabled:hover:bg-[#F2F2EF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saved ? "Salvo" : "Salvar alterações"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[#DEDEDA] pt-6">
              <a
                href="/novo/importar"
                className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
              >
                Voltar
              </a>

              <button
                type="button"
                onClick={continueFlow}
                disabled={!text.trim()}
                className="h-11 rounded-lg bg-[#181818] px-6 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-not-allowed disabled:bg-[#CBCBC5] disabled:text-[#777772]"
              >
                Usar este currículo
              </button>
            </div>
          </section>

          <aside className="h-fit space-y-4 lg:sticky lg:top-8">
            <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
              <p className="text-sm font-semibold">
                O que conferir
              </p>

              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#686864]">
                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Nome e informações de contato
                </li>

                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Experiências profissionais
                </li>

                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Cargos e empresas
                </li>

                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Períodos de trabalho
                </li>

                <li className="flex gap-3">
                  <span className="text-[#247A52]">✓</span>
                  Formação e competências
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
              <p className="text-sm font-semibold">
                Por que revisar?
              </p>

              <p className="mt-3 text-sm leading-6 text-[#686864]">
                PDFs não possuem uma estrutura padronizada. Algumas
                quebras de linha ou caracteres podem ser interpretados de
                forma diferente durante a extração.
              </p>

              <p className="mt-4 text-sm leading-6 text-[#686864]">
                Este conteúdo será a fonte usada para todas as versões
                futuras do currículo.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}