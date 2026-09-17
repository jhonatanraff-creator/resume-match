"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase/client";

import {
  syncLocalDataToSupabase,
} from "@/lib/supabase/sync-local-data";

import type {
  StructuredResume,
} from "@/types/resume";

type ApplicationRow = {
  id: string;
  job_title: string;
  company: string | null;
  compatibility_score: number | null;
  created_at: string;
};

type ResumeRow = {
  id: string;
  source: string;
  file_name: string | null;
  data: StructuredResume;
};

export default function DashboardPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    syncing,
    setSyncing,
  ] =
    useState(false);

  const [
    syncMessage,
    setSyncMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    resume,
    setResume,
  ] =
    useState<StructuredResume | null>(
      null,
    );

  const [
    resumeSource,
    setResumeSource,
  ] =
    useState("");

  const [
    applications,
    setApplications,
  ] =
    useState<ApplicationRow[]>(
      [],
    );

  useEffect(() => {
    let active =
      true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          router.replace(
            "/entrar",
          );

          return;
        }

        if (!active) {
          return;
        }

        setEmail(
          user.email ?? "",
        );

        /*
          Primeiro sincronizamos os dados
          que já existiam neste navegador.
        */

        setSyncing(true);

        try {
          const result =
            await syncLocalDataToSupabase();

          if (!active) {
            return;
          }

          if (
            result.resumeImported ||
            result.applicationsImported >
              0
          ) {
            const messages:
              string[] =
              [];

            if (
              result.resumeImported
            ) {
              messages.push(
                "currículo-base salvo",
              );
            }

            if (
              result.applicationsImported >
              0
            ) {
              messages.push(
                `${result.applicationsImported} ${
                  result.applicationsImported ===
                  1
                    ? "candidatura salva"
                    : "candidaturas salvas"
                }`,
              );
            }

            setSyncMessage(
              `Dados sincronizados: ${messages.join(
                " e ",
              )}.`,
            );
          }
        } catch (
          syncError
        ) {
          console.error(
            "Erro ao sincronizar dados:",
            syncError,
          );

          /*
            A sincronização local falhar
            não impede o usuário de entrar.
            Ainda tentamos carregar o que
            já existe no banco.
          */

          setSyncMessage(
            "Sua conta foi carregada, mas alguns dados locais ainda não foram sincronizados.",
          );
        } finally {
          if (active) {
            setSyncing(false);
          }
        }

        /*
          CURRÍCULO ATIVO
        */

        const {
          data:
            resumeRows,
          error:
            resumeError,
        } =
          await supabase
            .from(
              "resumes",
            )
            .select(
              "id, source, file_name, data",
            )
            .eq(
              "user_id",
              user.id,
            )
            .eq(
              "is_active",
              true,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(
              1,
            );

        if (
          resumeError
        ) {
          throw resumeError;
        }

        if (!active) {
          return;
        }

        const activeResume =
          resumeRows?.[0] as
            | ResumeRow
            | undefined;

        if (
          activeResume
        ) {
          setResume(
            activeResume.data,
          );

          setResumeSource(
            activeResume.source,
          );

          /*
            Mantemos localStorage atualizado
            porque o fluxo existente ainda
            usa esse dado em algumas telas.
          */

          localStorage.setItem(
            "resume-match-structured-resume",
            JSON.stringify(
              activeResume.data,
            ),
          );

          localStorage.setItem(
            "resume-match-resume-source",
            activeResume.source,
          );
        } else {
          setResume(
            null,
          );
        }

        /*
          CANDIDATURAS
        */

        const {
          data:
            applicationRows,
          error:
            applicationsError,
        } =
          await supabase
            .from(
              "applications",
            )
            .select(
              "id, job_title, company, compatibility_score, created_at",
            )
            .eq(
              "user_id",
              user.id,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            );

        if (
          applicationsError
        ) {
          throw applicationsError;
        }

        if (!active) {
          return;
        }

        setApplications(
          (applicationRows ??
            []) as ApplicationRow[],
        );
      } catch (
        loadError
      ) {
        console.error(
          "Erro ao carregar dashboard:",
          loadError,
        );

        if (active) {
          setError(
            "Não foi possível carregar sua conta. Tente atualizar a página.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active =
        false;
    };
  }, [
    router,
  ]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push(
      "/entrar",
    );
  }

  function editResume() {
    if (
      resumeSource ===
      "manual"
    ) {
      router.push(
        "/novo/criar-curriculo",
      );

      return;
    }

    router.push(
      "/novo/revisar-curriculo",
    );
  }

  function newApplication() {
    if (
      !resume
    ) {
      router.push(
        "/novo/curriculo",
      );

      return;
    }

    localStorage.removeItem(
      "resume-match-jobs",
    );

    localStorage.removeItem(
      "resume-match-review",
    );

    router.push(
      "/novo/vaga",
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5]">
        <div className="text-center">
          <p className="text-sm font-semibold text-[#181818]">
            Carregando sua conta...
          </p>

          {syncing && (
            <p className="mt-2 text-sm text-[#777772]">
              Sincronizando seus dados.
            </p>
          )}
        </div>
      </main>
    );
  }

  const firstName =
    resume?.name
      ?.trim()
      .split(/\s+/)[0] || "";

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#181818]">
      <header className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1280px] items-center justify-between gap-5 px-6 py-3 lg:px-10">
          <a
            href="/"
            className="shrink-0"
            aria-label="Ir para o início"
          >
            <img
              src="/brand/resume-match-logo-horizontal.svg"
              alt="Resume Match"
              className="h-9 w-auto"
            />
          </a>

          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#686864] transition hover:bg-[#F2F2EF] hover:text-[#181818] sm:px-4"
            >
              Início
            </a>

            <span className="hidden rounded-full bg-[#FFF0F4] px-3 py-1 text-xs font-semibold text-[#C23F61] sm:inline-flex">
              Beta
            </span>

            <span className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D6D6D1] bg-[#F7F7F5] px-3 text-sm font-semibold sm:px-4">
              Minha conta
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 py-10 lg:px-10 lg:py-14">
        <section className="flex flex-col gap-7 border-b border-[#DEDEDA] pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#E9426B]">
              MINHA CONTA
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {firstName
                ? `Olá, ${firstName}.`
                : "Seu espaço no Resume Match."}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#686864]">
              Gerencie seu currículo-base e acompanhe os currículos que você já direcionou para suas candidaturas.
            </p>
          </div>

          <button
            type="button"
            onClick={newApplication}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-[#181818] px-6 text-sm font-semibold text-white transition hover:bg-black"
          >
            + Nova candidatura
          </button>
        </section>

        {error && (
          <div className="mt-8 rounded-xl border border-[#F0C4C4] bg-[#FFF4F4] px-5 py-4">
            <p className="text-sm font-semibold text-[#B83A3A]">
              {error}
            </p>
          </div>
        )}

        {syncMessage && (
          <div className="mt-8 rounded-xl border border-[#CFE3D8] bg-[#F4FAF6] px-5 py-4">
            <p className="text-sm font-semibold text-[#247A52]">
              {syncMessage}
            </p>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-[#F0C8D2] bg-[#FFF8FA] px-5 py-4">
          <div className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 shrink-0 items-center rounded-md bg-[#FFE4EB] px-2 text-[11px] font-bold text-[#C23F61]">
              BETA
            </span>

            <div>
              <p className="text-sm font-semibold">
                Resume Match está em período de testes
              </p>

              <p className="mt-1 text-sm leading-6 text-[#777772]">
                Durante o beta, o uso do produto é gratuito e você não será cobrado.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-[#DEDEDA] bg-white">
              <div className="flex flex-col gap-4 border-b border-[#E7E7E3] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    Meu currículo
                  </p>

                  <p className="mt-1 text-sm text-[#777772]">
                    Este é o currículo-base usado para criar versões direcionadas.
                  </p>
                </div>

                {resume && (
                  <button
                    type="button"
                    onClick={editResume}
                    className="self-start text-sm font-semibold underline underline-offset-4 sm:self-auto"
                  >
                    Editar currículo
                  </button>
                )}
              </div>

              {resume ? (
                <div className="p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xl font-semibold">
                        {resume.name}
                      </p>

                      {resume.headline && (
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#686864]">
                          {resume.headline}
                        </p>
                      )}

                      <p className="mt-3 text-xs font-medium text-[#247A52]">
                        ✓ Salvo na sua conta
                      </p>
                    </div>

                    <span className="self-start rounded-full bg-[#F1F7F3] px-3 py-1 text-xs font-semibold text-[#247A52]">
                      {resumeSource === "manual"
                        ? "Criado manualmente"
                        : "Importado"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-[#E7E7E3] pt-5 sm:grid-cols-3">
                    <div className="rounded-xl bg-[#F7F7F5] p-4">
                      <p className="text-2xl font-semibold">
                        {resume.experiences.length}
                      </p>

                      <p className="mt-1 text-xs text-[#777772]">
                        Experiências
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F7F7F5] p-4">
                      <p className="text-2xl font-semibold">
                        {resume.education.length}
                      </p>

                      <p className="mt-1 text-xs text-[#777772]">
                        Formações
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F7F7F5] p-4">
                      <p className="text-2xl font-semibold">
                        {resume.skills.length}
                      </p>

                      <p className="mt-1 text-xs text-[#777772]">
                        Competências
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={editResume}
                      className="h-10 rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                    >
                      Revisar currículo
                    </button>

                    <button
                      type="button"
                      onClick={newApplication}
                      className="h-10 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white transition hover:bg-black"
                    >
                      Usar em uma nova vaga
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                  <h2 className="text-base font-semibold">
                    Você ainda não tem um currículo-base
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#777772]">
                    Importe seu currículo ou preencha suas informações manualmente para começar.
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push("/novo/curriculo")}
                    className="mt-5 h-10 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white"
                  >
                    Criar currículo-base
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[#DEDEDA] bg-white">
              <div className="flex flex-col gap-3 border-b border-[#E7E7E3] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    Candidaturas recentes
                  </p>

                  <p className="mt-1 text-sm text-[#777772]">
                    {applications.length > 0
                      ? `${applications.length} ${applications.length === 1 ? "currículo direcionado" : "currículos direcionados"} na sua conta.`
                      : "Os currículos direcionados que você criar aparecerão aqui."}
                  </p>
                </div>

                {applications.length > 0 && (
                  <a
                    href="/resultados"
                    className="self-start text-sm font-semibold underline underline-offset-4 sm:self-auto"
                  >
                    Ver todos os resultados
                  </a>
                )}
              </div>

              {applications.length > 0 ? (
                <div>
                  {applications
                    .slice(0, 5)
                    .map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between gap-5 border-b border-[#EFEFEB] px-6 py-5 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {application.job_title}
                          </p>

                          {application.company && (
                            <p className="mt-1 truncate text-sm text-[#777772]">
                              {application.company}
                            </p>
                          )}
                        </div>

                        {typeof application.compatibility_score === "number" && (
                          <span className="shrink-0 rounded-full bg-[#F1F7F3] px-3 py-1 text-sm font-semibold text-[#247A52]">
                            {application.compatibility_score}%
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm font-semibold">
                    Nenhuma candidatura ainda
                  </p>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#777772]">
                    Adicione uma vaga e gere sua primeira versão direcionada.
                  </p>

                  <button
                    type="button"
                    onClick={newApplication}
                    className="mt-5 h-10 rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                  >
                    Criar candidatura
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="min-w-0">
            <div className="rounded-2xl border border-[#DEDEDA] bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-semibold">
                  Sua conta
                </p>

                <span className="rounded-full bg-[#F1F7F3] px-3 py-1 text-xs font-semibold text-[#247A52]">
                  Ativa
                </span>
              </div>

              <div className="mt-5 border-t border-[#E7E7E3] pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#999994]">
                  E-mail
                </p>

                <p className="mt-2 break-all text-sm leading-6">
                  {email}
                </p>
              </div>

              <div className="mt-5 border-t border-[#E7E7E3] pt-5">
                <p className="text-sm font-semibold">
                  Seus dados ficam sincronizados
                </p>

                <p className="mt-2 text-sm leading-6 text-[#777772]">
                  Seu currículo-base e suas candidaturas ficam associados a esta conta para você continuar de onde parou.
                </p>
              </div>

              <div className="mt-5 border-t border-[#E7E7E3] pt-5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
                >
                  Sair da conta
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#DEDEDA] bg-[#181818] p-6 text-white">
              <p className="text-sm font-semibold text-[#FFB7C9]">
                Próximo passo
              </p>

              <p className="mt-2 text-lg font-semibold">
                Encontrou uma vaga interessante?
              </p>

              <p className="mt-2 text-sm leading-6 text-[#D5D5D0]">
                Use seu currículo-base para gerar uma nova versão direcionada sem precisar começar de novo.
              </p>

              <button
                type="button"
                onClick={newApplication}
                className="mt-5 h-10 rounded-lg bg-white px-4 text-sm font-semibold text-[#181818] transition hover:bg-[#F2F2EF]"
              >
                + Nova candidatura
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
