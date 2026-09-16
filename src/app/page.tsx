const steps = [
  {
    number: "01",
    title: "Adicione seu currículo",
    description:
      "Envie o PDF do LinkedIn ou crie um currículo-base preenchendo seus dados.",
  },
  {
    number: "02",
    title: "Adicione a vaga",
    description:
      "Cole a descrição completa para identificar responsabilidades e requisitos.",
  },
  {
    number: "03",
    title: "Revise e exporte",
    description:
      "Confira as sugestões, ajuste o conteúdo e gere a versão final em PDF.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#181818]">
      <header className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 lg:px-10">
          <a href="/" aria-label="Resume Match">
            <img
              src="/brand/resume-match-logo-horizontal.svg"
              alt="Resume Match"
              className="h-9 w-auto"
            />
          </a>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="/" className="font-medium text-[#181818]">
              Início
            </a>

            <a
              href="#curriculos"
              className="text-[#686864] transition hover:text-[#181818]"
            >
              Currículos
            </a>

            <a
              href="#como-funciona"
              className="text-[#686864] transition hover:text-[#181818]"
            >
              Como funciona
            </a>
          </nav>

          <button className="h-10 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-medium transition hover:bg-[#F2F2EF]">
            Entrar
          </button>
        </div>
      </header>

      <section className="border-b border-[#DEDEDA]">
        <div className="mx-auto grid max-w-[1280px] gap-14 px-6 py-16 lg:grid-cols-[1fr_440px] lg:px-10 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-5 text-sm font-semibold text-[#E9426B]">
              Currículo direcionado para cada oportunidade
            </p>

            <h1 className="max-w-[760px] text-[44px] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[56px] lg:text-[68px]">
              Adapte seu currículo para a vaga que você quer.
            </h1>

            <p className="mt-7 max-w-[650px] text-lg leading-8 text-[#686864]">
              Use seu currículo atual e a descrição da vaga para criar uma
              versão mais relevante para a oportunidade. Seu histórico é
              preservado e nenhuma experiência é inventada.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/novo/importar"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#181818] px-6 text-sm font-semibold text-white transition hover:bg-black"
              >
                Criar currículo para uma vaga
              </a>

              <a
                href="#como-funciona"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#D6D6D1] bg-white px-6 text-sm font-semibold transition hover:bg-[#F2F2EF]"
              >
                Ver como funciona
              </a>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#DEDEDA] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-medium text-[#686864]">
                Nova adaptação
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
                Comece pelo seu currículo
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#686864]">
                Escolha como deseja adicionar suas informações profissionais.
              </p>
            </div>

            <a
              href="/novo/importar"
              className="group flex w-full items-center gap-4 rounded-xl border border-[#D6D6D1] p-4 text-left transition hover:border-[#AFAFAA] hover:bg-[#FAFAF8]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FFE4EB] text-lg font-semibold text-[#E9426B]">
                ↑
              </span>

              <span className="flex-1">
                <span className="block text-sm font-semibold">
                  Importar PDF do LinkedIn
                </span>

                <span className="mt-1 block text-sm text-[#777772]">
                  Use o currículo exportado pelo LinkedIn
                </span>
              </span>

              <span
                className="text-[#777772] transition group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </a>

            <button className="group mt-3 flex w-full items-center gap-4 rounded-xl border border-[#D6D6D1] p-4 text-left transition hover:border-[#AFAFAA] hover:bg-[#FAFAF8]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EEEEEB] text-lg font-semibold">
                +
              </span>

              <span className="flex-1">
                <span className="block text-sm font-semibold">
                  Criar currículo-base
                </span>

                <span className="mt-1 block text-sm text-[#777772]">
                  Preencha suas informações manualmente
                </span>
              </span>

              <span
                className="text-[#777772] transition group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </button>

            <div className="mt-7 border-t border-[#E7E7E3] pt-5">
              <p className="text-xs leading-5 text-[#858580]">
                Você poderá revisar suas informações antes de gerar qualquer
                currículo.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section
        id="como-funciona"
        className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20"
      >
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-[#686864]">
            Como funciona
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Um fluxo simples, com você no controle.
          </h2>

          <p className="mt-4 text-base leading-7 text-[#686864]">
            O Resume Match organiza o processo sem esconder o que está sendo
            alterado.
          </p>
        </div>

        <div className="mt-10 grid border-y border-[#DEDEDA] md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.number}
              className={`py-8 md:px-8 ${
                index !== 0
                  ? "border-t border-[#DEDEDA] md:border-l md:border-t-0"
                  : ""
              }`}
            >
              <p className="text-xs font-semibold tracking-[0.12em] text-[#A0A09A]">
                {step.number}
              </p>

              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>

              <p className="mt-3 max-w-sm text-sm leading-6 text-[#686864]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="curriculos"
        className="border-t border-[#DEDEDA] bg-white"
      >
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#686864]">
                Seus currículos
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                Currículo-base
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-[#686864]">
                Guarde sua trajetória profissional uma vez e reutilize essas
                informações em novas candidaturas.
              </p>
            </div>

            <a
              href="/novo/importar"
              className="inline-flex h-10 self-start items-center justify-center rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold transition hover:bg-[#F2F2EF] sm:self-auto"
            >
              Adicionar currículo
            </a>
          </div>

          <div className="mt-8 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#CBCBC5] bg-[#FAFAF8] px-6 text-center">
            <img
              src="/brand/resume-match-icon-monochrome.svg"
              alt=""
              className="h-10 w-10 opacity-25"
            />

            <h3 className="mt-5 text-base font-semibold">
              Você ainda não tem um currículo-base
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#777772]">
              Adicione seu primeiro currículo para começar a criar versões
              direcionadas às vagas.
            </p>

            <a
              href="/novo/importar"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white transition hover:bg-black"
            >
              Adicionar currículo
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-[#DEDEDA]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-14 lg:grid-cols-3 lg:px-10">
          <div>
            <p className="text-sm font-semibold">Sem inventar informações</p>

            <p className="mt-2 text-sm leading-6 text-[#686864]">
              As sugestões usam somente informações presentes no seu histórico
              profissional.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Você revisa tudo</p>

            <p className="mt-2 text-sm leading-6 text-[#686864]">
              Confira as alterações antes de aceitar qualquer sugestão.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Pronto para candidatura</p>

            <p className="mt-2 text-sm leading-6 text-[#686864]">
              Copie o conteúdo ou gere um PDF leve para enviar à empresa.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#DEDEDA] bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 py-8 text-sm text-[#777772] sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <img
            src="/brand/resume-match-logo-horizontal.svg"
            alt="Resume Match"
            className="h-7 w-auto opacity-70"
          />

          <span>Seu currículo direcionado para cada oportunidade.</span>
        </div>
      </footer>
    </main>
  );
}