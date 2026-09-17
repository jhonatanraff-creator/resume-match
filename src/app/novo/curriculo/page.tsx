"use client";

import {
  useRouter,
} from "next/navigation";

export default function ResumeStartPage() {
  const router =
    useRouter();

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#181818]">
      <header className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center px-6 lg:px-10">
          <img
            src="/brand/resume-match-logo-horizontal.svg"
            alt="Resume Match"
            className="h-9 w-auto"
          />
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-6 py-14 lg:py-20">
        <div className="max-w-[680px]">
          <p className="text-sm font-semibold text-[#E9426B]">
            Currículo-base
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Como você quer começar?
          </h1>

          <p className="mt-5 text-base leading-7 text-[#686864]">
            Você pode importar um currículo existente em PDF ou criar seu currículo-base do zero.
            Depois disso, o Resume Match usa essa versão como fonte para gerar currículos
            direcionados para cada vaga.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/novo/importar",
              )
            }
            className="
              rounded-2xl
              border
              border-[#DEDEDA]
              bg-white
              p-6
              text-left
              transition
              hover:border-[#BDBDB7]
              hover:shadow-sm
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-[#FFE4EB]
                text-sm
                font-bold
                text-[#E9426B]
              "
            >
              PDF
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Importar currículo
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#686864]">
              Envie um PDF existente, como o currículo exportado do LinkedIn.
              O sistema extrai as informações e você revisa tudo antes de usar.
            </p>

            <div className="mt-6 text-sm font-semibold">
              Importar PDF →
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/novo/criar-curriculo",
              )
            }
            className="
              rounded-2xl
              border
              border-[#DEDEDA]
              bg-white
              p-6
              text-left
              transition
              hover:border-[#BDBDB7]
              hover:shadow-sm
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-[#F0F0ED]
                text-lg
                font-semibold
                text-[#181818]
              "
            >
              +
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Criar currículo
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#686864]">
              Monte seu currículo-base manualmente.
              Adicione experiências, formação, cursos, competências e contatos sem precisar de um PDF.
            </p>

            <div className="mt-6 text-sm font-semibold">
              Criar do zero →
            </div>
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-[#DEDEDA] bg-white px-5 py-4">
          <p className="text-xs leading-5 text-[#686864]">
            As duas opções levam ao mesmo formato de currículo-base.
            Você poderá revisar e editar as informações depois.
          </p>
        </div>
      </div>
    </main>
  );
}