"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ImportResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function validateFile(selectedFile: File) {
    setError("");

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFile(null);
      setError("Envie um arquivo em formato PDF.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("O arquivo precisa ter no máximo 5 MB.");
      return;
    }

    setFile(selectedFile);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      validateFile(selectedFile);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      validateFile(droppedFile);
    }
  }

  function removeFile() {
    setFile(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function formatFileSize(bytes: number) {
    const mb = bytes / 1024 / 1024;

    return `${mb.toFixed(2)} MB`;
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

          <button
            type="button"
            className="h-10 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-medium transition hover:bg-[#F2F2EF]"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto max-w-[1040px] px-6 py-6">
          <ol className="grid grid-cols-4 gap-2">
            <li>
              <div className="h-1 rounded-full bg-[#E9426B]" />
              <div className="mt-3">
                <span className="text-xs font-semibold text-[#E9426B]">
                  01
                </span>
                <p className="mt-1 text-sm font-semibold">Currículo</p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />
              <div className="mt-3">
                <span className="text-xs font-semibold text-[#A0A09A]">
                  02
                </span>
                <p className="mt-1 text-sm text-[#777772]">Vaga</p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />
              <div className="mt-3">
                <span className="text-xs font-semibold text-[#A0A09A]">
                  03
                </span>
                <p className="mt-1 text-sm text-[#777772]">Revisão</p>
              </div>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />
              <div className="mt-3">
                <span className="text-xs font-semibold text-[#A0A09A]">
                  04
                </span>
                <p className="mt-1 text-sm text-[#777772]">Resultado</p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1040px] px-6 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <div className="max-w-[650px]">
              <p className="text-sm font-semibold text-[#E9426B]">
                Etapa 1 de 4
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Adicione seu currículo
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-[#686864]">
                Envie o currículo exportado pelo LinkedIn. Vamos usar essas
                informações como base para criar versões direcionadas às vagas.
              </p>
            </div>

            {/* Upload */}
            <div className="mt-10">
              {!file ? (
                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={handleDrop}
                  className={`flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
                    isDragging
                      ? "border-[#E9426B] bg-[#FFF4F7]"
                      : "border-[#CBCBC5] bg-white"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFE4EB] text-xl font-semibold text-[#E9426B]">
                    ↑
                  </div>

                  <h2 className="mt-6 text-lg font-semibold">
                    Arraste seu PDF para cá
                  </h2>

                  <p className="mt-2 text-sm text-[#777772]">
                    ou escolha um arquivo no seu computador
                  </p>

                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-6 h-11 rounded-lg border border-[#D6D6D1] bg-white px-5 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                  >
                    Escolher PDF
                  </button>

                  <p className="mt-5 text-xs text-[#969691]">
                    PDF • máximo de 5 MB
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#D6D6D1] bg-white p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFE4EB] text-xs font-bold text-[#E9426B]">
                      PDF
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{file.name}</p>
                      <p className="mt-1 text-sm text-[#777772]">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-[#686864] transition hover:bg-[#F2F2EF] hover:text-[#181818]"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="mt-6 flex items-center gap-2 rounded-lg bg-[#F1F7F3] px-4 py-3">
                    <span className="text-[#247A52]">✓</span>
                    <p className="text-sm font-medium text-[#247A52]">
                      Arquivo pronto para continuar
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-3 rounded-lg bg-[#FFF0F0] px-4 py-3">
                  <p className="text-sm font-medium text-[#B83A3A]">{error}</p>
                </div>
              )}

              {/* Footer actions */}
              <div className="mt-8 flex items-center justify-between border-t border-[#DEDEDA] pt-6">
                <a
                  href="/"
                  className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
                >
                  Voltar
                </a>

                <button
                  type="button"
                  disabled={!file}
                  className="h-11 rounded-lg bg-[#181818] px-6 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-not-allowed disabled:bg-[#CBCBC5] disabled:text-[#777772]"
                >
                  Continuar
                </button>
              </div>
            </div>
          </section>

          {/* Help */}
          <aside className="h-fit rounded-xl border border-[#DEDEDA] bg-white p-5">
            <p className="text-sm font-semibold">Como exportar do LinkedIn</p>

            <ol className="mt-4 space-y-4 text-sm leading-6 text-[#686864]">
              <li className="flex gap-3">
                <span className="font-semibold text-[#181818]">1.</span>
                Abra seu perfil no LinkedIn.
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-[#181818]">2.</span>
                Acesse as opções do perfil.
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-[#181818]">3.</span>
                Escolha salvar ou exportar como PDF.
              </li>

              <li className="flex gap-3">
                <span className="font-semibold text-[#181818]">4.</span>
                Envie o arquivo nesta página.
              </li>
            </ol>

            <div className="mt-6 border-t border-[#E7E7E3] pt-5">
              <p className="text-xs leading-5 text-[#858580]">
                Você poderá revisar as informações importadas antes de
                utilizá-las.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}