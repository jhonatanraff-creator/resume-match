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

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#FFF0F4] px-3 py-1 text-xs font-semibold text-[#C23F61] sm:inline-flex">
              Beta
            </span>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="h-10 rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-medium transition hover:bg-[#F2F2EF]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 py-10 lg:px-10 lg:py-14">
        <div className="flex flex-col gap-6 border-b border-[#DEDEDA] pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#E9426B]">
              Sua conta
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Seu espaço no Resume Match.
            </h1>

            <p className="mt-4 text-base text-[#686864]">
              {email}
            </p>
          </div>

          <button
            type="button"
            onClick={
              newApplication
            }
            className="inline-flex h-12 items-center justify-center rounded-lg bg-[#181818] px-6 text-sm font-semibold text-white transition hover:bg-black"
          >
            + Nova candidatura
          </button>
        </div>

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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="rounded-2xl border border-[#DEDEDA] bg-white">
              <div className="flex items-center justify-between border-b border-[#E7E7E3] px-6 py-5">
                <div>
                  <p className="text-sm font-semibold">
                    Currículo-base
                  </p>

                  <p className="mt-1 text-sm text-[#777772]">
                    Sua trajetória profissional principal.
                  </p>
                </div>

                {resume && (
                  <button
                    type="button"
                    onClick={
                      editResume
                    }
                    className="text-sm font-semibold underline underline-offset-4"
                  >
                    Editar
                  </button>
                )}
              </div>

              {resume ? (
                <div className="p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold">
                        {resume.name}
                      </p>

                      {resume.headline && (
                        <p className="mt-1 text-sm text-[#686864]">
                          {resume.headline}
                        </p>
                      )}

                      <p className="mt-3 text-xs font-medium text-[#999994]">
                        Salvo na sua conta
                      </p>
                    </div>

                    <span className="self-start rounded-full bg-[#F1F7F3] px-3 py-1 text-xs font-semibold text-[#247A52]">
                      {resumeSource ===
                      "manual"
                        ? "Criado manualmente"
                        : "Importado"}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-[#E7E7E3] pt-5 sm:grid-cols-3">
                    <div>
                      <p className="text-2xl font-semibold">
                        {
                          resume
                            .experiences
                            .length
                        }
                      </p>

                      <p className="mt-1 text-xs text-[#777772]">
                        Experiências
                      </p>
                    </div>

                    <div>
                      <p className="text-2xl font-semibold">
                        {
                          resume
                            .education
                            .length
                        }
                      </p>

                      <p className="mt-1 text-xs text-[#777772]">
                        Formações
                      </p>
                    </div>

                    <div>
                      <p className="text-2xl font-semibold">
                        {
                          resume
                            .skills
                            .length
                        }
                      </p>

                      <p className="mt-1 text-xs text-[#777772]">
                        Competências
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      editResume
                    }
                    className="mt-6 h-10 rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                  >
                    Revisar currículo
                  </button>
                </div>
              ) : (
                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                  <h2 className="text-base font-semibold">
                    Você ainda não tem um currículo-base
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#777772]">
                    Importe seu currículo ou preencha suas informações manualmente.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/novo/curriculo",
                      )
                    }
                    className="mt-5 h-10 rounded-lg bg-[#181818] px-4 text-sm font-semibold text-white"
                  >
                    Criar currículo-base
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-[#DEDEDA] bg-white">
              <div className="flex items-center justify-between border-b border-[#E7E7E3] px-6 py-5">
                <div>
                  <p className="text-sm font-semibold">
                    Candidaturas
                  </p>

                  <p className="mt-1 text-sm text-[#777772]">
                    Currículos direcionados que você já criou.
                  </p>
                </div>

                {applications.length >
                  0 && (
                  <a
                    href="/resultados"
                    className="text-sm font-semibold underline underline-offset-4"
                  >
                    Ver todas
                  </a>
                )}
              </div>

              {applications.length >
              0 ? (
                <div>
                  {applications
                    .slice(
                      0,
                      5,
                    )
                    .map(
                      (
                        application,
                      ) => (
                        <div
                          key={
                            application.id
                          }
                          className="flex items-center justify-between gap-5 border-b border-[#EFEFEB] px-6 py-5 last:border-b-0"
                        >
                          <div>
                            <p className="font-semibold">
                              {
                                application.job_title
                              }
                            </p>

                            {application.company && (
                              <p className="mt-1 text-sm text-[#777772]">
                                {
                                  application.company
                                }
                              </p>
                            )}
                          </div>

                          {typeof application.compatibility_score ===
                            "number" && (
                            <span className="shrink-0 rounded-full bg-[#F1F7F3] px-3 py-1 text-sm font-semibold text-[#247A52]">
                              {
                                application.compatibility_score
                              }
                              %
                            </span>
                          )}
                        </div>
                      ),
                    )}
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
                    onClick={
                      newApplication
                    }
                    className="mt-5 h-10 rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold"
                  >
                    Criar candidatura
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside>
            <div className="rounded-2xl border border-[#DEDEDA] bg-white p-6">
              <p className="text-sm font-semibold">
                Sua conta
              </p>

              <div className="mt-5 border-t border-[#E7E7E3] pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#999994]">
                  E-mail
                </p>

                <p className="mt-2 break-all text-sm">
                  {email}
                </p>
              </div>

              <div className="mt-5 border-t border-[#E7E7E3] pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#999994]">
                  Dados
                </p>

                <p className="mt-2 text-sm text-[#247A52]">
                  Salvos no Supabase
                </p>
              </div>

              <div className="mt-5 border-t border-[#E7E7E3] pt-5">
                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="text-sm font-semibold text-[#686864] transition hover:text-[#181818]"
                >
                  Sair da conta
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#DEDEDA] bg-white p-6">
              <p className="text-sm font-semibold">
                Conta sincronizada
              </p>

              <p className="mt-2 text-sm leading-6 text-[#777772]">
                Seu currículo-base e suas candidaturas podem ser associados à sua conta para acesso em outros dispositivos.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}