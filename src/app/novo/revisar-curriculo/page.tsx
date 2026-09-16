"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  StructuredResume,
  ResumeExperience,
  ResumeEducation,
  ResumeCourse,
} from "@/types/resume";

type ParsedResume = {
  fileName: string;
  fileSize: number;
  pages: number;
  text: string;
  importedAt: string;
};

export default function ReviewResumePage() {
  const router = useRouter();

  const [baseResume, setBaseResume] =
    useState<ParsedResume | null>(null);

  const [resume, setResume] =
    useState<StructuredResume | null>(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedBaseResume = localStorage.getItem(
      "resume-match-base-resume",
    );

    if (!storedBaseResume) {
      router.replace("/novo/importar");
      return;
    }

    try {
      const parsedBaseResume = JSON.parse(
        storedBaseResume,
      ) as ParsedResume;

      setBaseResume(parsedBaseResume);

      const storedStructuredResume =
        localStorage.getItem(
          "resume-match-structured-resume",
        );

      if (storedStructuredResume) {
        try {
          const parsedStructured =
            JSON.parse(
              storedStructuredResume,
            ) as StructuredResume;

          // Só reaproveita a análise se ela pertencer
          // exatamente ao currículo-base atual.
          if (
            parsedStructured.rawText ===
            parsedBaseResume.text
          ) {
            setResume(parsedStructured);
          }
        } catch {
          localStorage.removeItem(
            "resume-match-structured-resume",
          );
        }
      }
    } catch {
      router.replace("/novo/importar");
      return;
    }

    setLoading(false);
  }, [router]);

  async function analyzeResume() {
    if (!baseResume || analyzing) {
      return;
    }

    setAnalyzing(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch(
        "/api/structure-resume",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            rawText: baseResume.text,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível analisar o currículo.",
        );
      }

      const structuredResume =
        data.resume as StructuredResume;

      setResume(structuredResume);

      localStorage.setItem(
        "resume-match-structured-resume",
        JSON.stringify(structuredResume),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível analisar o currículo.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function persistResume() {
    if (!resume) {
      return;
    }

    setSaving(true);

    localStorage.setItem(
      "resume-match-structured-resume",
      JSON.stringify(resume),
    );

    window.setTimeout(() => {
      setSaving(false);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 1800);
    }, 300);
  }

  function continueFlow() {
    if (!resume) {
      return;
    }

    localStorage.setItem(
      "resume-match-structured-resume",
      JSON.stringify(resume),
    );

    router.push("/novo/vaga");
  }

  function updateExperience(
    id: string,
    updates: Partial<ResumeExperience>,
  ) {
    if (!resume) {
      return;
    }

    setResume({
      ...resume,

      experiences: resume.experiences.map(
        (experience) =>
          experience.id === id
            ? {
                ...experience,
                ...updates,
              }
            : experience,
      ),
    });

    setSaved(false);
  }

  function addExperience() {
    if (!resume) {
      return;
    }

    const experience: ResumeExperience = {
      id: `exp-${Date.now()}`,
      company: "",
      role: "",
      current: false,
      originalText: "",
      bullets: [],
    };

    setResume({
      ...resume,
      experiences: [
        ...resume.experiences,
        experience,
      ],
    });
  }

  function removeExperience(id: string) {
    if (!resume) {
      return;
    }

    setResume({
      ...resume,

      experiences: resume.experiences.filter(
        (experience) => experience.id !== id,
      ),
    });
  }

  function updateEducation(
    id: string,
    updates: Partial<ResumeEducation>,
  ) {
    if (!resume) {
      return;
    }

    setResume({
      ...resume,

      education: resume.education.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    });
  }

  function addEducation() {
    if (!resume) {
      return;
    }

    const education: ResumeEducation = {
      id: `edu-${Date.now()}`,
      institution: "",
      course: "",
    };

    setResume({
      ...resume,
      education: [
        ...resume.education,
        education,
      ],
    });
  }

  function removeEducation(id: string) {
    if (!resume) {
      return;
    }

    setResume({
      ...resume,

      education: resume.education.filter(
        (item) => item.id !== id,
      ),
    });
  }

  function updateCourse(
    id: string,
    updates: Partial<ResumeCourse>,
  ) {
    if (!resume) {
      return;
    }

    setResume({
      ...resume,

      courses: resume.courses.map((course) =>
        course.id === id
          ? {
              ...course,
              ...updates,
            }
          : course,
      ),
    });
  }

  function addCourse() {
    if (!resume) {
      return;
    }

    const course: ResumeCourse = {
      id: `course-${Date.now()}`,
      name: "",
    };

    setResume({
      ...resume,
      courses: [...resume.courses, course],
    });
  }

  function removeCourse(id: string) {
    if (!resume) {
      return;
    }

    setResume({
      ...resume,

      courses: resume.courses.filter(
        (course) => course.id !== id,
      ),
    });
  }

  if (loading || !baseResume) {
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

          <a
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-[#D6D6D1] bg-white px-4 text-sm font-medium transition hover:bg-[#F2F2EF]"
          >
            Sair
          </a>
        </div>
      </header>

      {/* Progress */}

      <div className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto max-w-[1040px] px-6 py-6">
          <ol className="grid grid-cols-4 gap-3">
            <li>
              <div className="h-1 rounded-full bg-[#E9426B]" />

              <p className="mt-3 text-sm font-semibold">
                01 Currículo
              </p>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />

              <p className="mt-3 text-sm text-[#777772]">
                02 Vagas
              </p>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />

              <p className="mt-3 text-sm text-[#777772]">
                03 Revisão
              </p>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#DEDEDA]" />

              <p className="mt-3 text-sm text-[#777772]">
                04 Resultados
              </p>
            </li>
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6 py-12 lg:px-10 lg:py-16">
        {/* Antes da análise */}

        {!resume ? (
          <div className="mx-auto max-w-[760px]">
            <p className="text-sm font-semibold text-[#E9426B]">
              Currículo-base
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Vamos organizar seu currículo.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[#686864]">
              O PDF já foi lido. Agora a inteligência
              artificial vai identificar suas experiências,
              formação, cursos, competências e dados
              profissionais sem alterar o conteúdo original.
            </p>

            <div className="mt-10 rounded-xl border border-[#DEDEDA] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFE4EB] text-xs font-bold text-[#E9426B]">
                  PDF
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {baseResume.fileName}
                  </p>

                  <p className="mt-1 text-sm text-[#777772]">
                    {baseResume.pages}{" "}
                    {baseResume.pages === 1
                      ? "página"
                      : "páginas"}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#E7E7E3] pt-6">
                <p className="text-sm leading-6 text-[#686864]">
                  Essa análise será feita apenas uma vez.
                  Depois, o currículo estruturado será
                  reutilizado em todas as vagas até você
                  substituir o currículo-base.
                </p>
              </div>

              <button
                type="button"
                onClick={analyzeResume}
                disabled={analyzing}
                className="mt-6 h-11 w-full rounded-lg bg-[#181818] px-5 text-sm font-semibold text-white transition enabled:hover:bg-black disabled:cursor-wait disabled:bg-[#777772]"
              >
                {analyzing
                  ? "Analisando currículo..."
                  : "Analisar currículo com IA"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-[#FFF0F0] px-4 py-3">
                <p className="text-sm font-medium text-[#B83A3A]">
                  {error}
                </p>
              </div>
            )}

            {analyzing && (
              <div className="mt-5 rounded-xl border border-[#DEDEDA] bg-white p-5">
                <p className="text-sm font-semibold">
                  Interpretando seu currículo
                </p>

                <p className="mt-2 text-sm leading-6 text-[#686864]">
                  Estamos identificando empresas, cargos,
                  períodos, experiências, formação e
                  competências mantendo o conteúdo original.
                </p>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#E9E9E5]">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-[#E9426B]" />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Editor estruturado */

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section>
              <div className="max-w-[720px]">
                <p className="text-sm font-semibold text-[#247A52]">
                  Análise concluída
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  Confira seu currículo-base.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-[#686864]">
                  Revise as informações identificadas pela IA.
                  Você pode corrigir qualquer campo antes de
                  utilizar este currículo nas candidaturas.
                </p>
              </div>

              {error && (
                <div className="mt-6 rounded-lg bg-[#FFF0F0] px-4 py-3">
                  <p className="text-sm font-medium text-[#B83A3A]">
                    {error}
                  </p>
                </div>
              )}

              {/* Dados pessoais */}

              <div className="mt-10 rounded-xl border border-[#DEDEDA] bg-white">
                <div className="border-b border-[#E7E7E3] px-5 py-4 sm:px-6">
                  <h2 className="font-semibold">
                    Dados profissionais
                  </h2>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Nome
                    </span>

                    <input
                      value={resume.name}
                      onChange={(event) =>
                        setResume({
                          ...resume,
                          name: event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Título profissional
                    </span>

                    <input
                      value={resume.headline ?? ""}
                      onChange={(event) =>
                        setResume({
                          ...resume,
                          headline: event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      E-mail
                    </span>

                    <input
                      value={resume.contact.email ?? ""}
                      onChange={(event) =>
                        setResume({
                          ...resume,
                          contact: {
                            ...resume.contact,
                            email: event.target.value,
                          },
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Telefone
                    </span>

                    <input
                      value={resume.contact.phone ?? ""}
                      onChange={(event) =>
                        setResume({
                          ...resume,
                          contact: {
                            ...resume.contact,
                            phone: event.target.value,
                          },
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Localização
                    </span>

                    <input
                      value={
                        resume.contact.location ?? ""
                      }
                      onChange={(event) =>
                        setResume({
                          ...resume,
                          contact: {
                            ...resume.contact,
                            location:
                              event.target.value,
                          },
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      LinkedIn
                    </span>

                    <input
                      value={
                        resume.contact.linkedin ?? ""
                      }
                      onChange={(event) =>
                        setResume({
                          ...resume,
                          contact: {
                            ...resume.contact,
                            linkedin:
                              event.target.value,
                          },
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm font-medium">
                      Portfólio
                    </span>

                    <input
                      value={
                        resume.contact.portfolio ?? ""
                      }
                      onChange={(event) =>
                        setResume({
                          ...resume,
                          contact: {
                            ...resume.contact,
                            portfolio:
                              event.target.value,
                          },
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                    />
                  </label>
                </div>
              </div>

              {/* Resumo */}

              <div className="mt-6 rounded-xl border border-[#DEDEDA] bg-white">
                <div className="border-b border-[#E7E7E3] px-5 py-4 sm:px-6">
                  <h2 className="font-semibold">
                    Resumo profissional
                  </h2>
                </div>

                <div className="p-5 sm:p-6">
                  <textarea
                    value={resume.summary ?? ""}
                    onChange={(event) =>
                      setResume({
                        ...resume,
                        summary: event.target.value,
                      })
                    }
                    rows={6}
                    placeholder="Nenhum resumo identificado no currículo."
                    className="w-full resize-y rounded-lg border border-[#CBCBC5] px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#181818]"
                  />
                </div>
              </div>

              {/* Experiências */}

              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Experiências
                    </h2>

                    <p className="mt-1 text-sm text-[#777772]">
                      {resume.experiences.length}{" "}
                      {resume.experiences.length === 1
                        ? "experiência"
                        : "experiências"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addExperience}
                    className="h-10 rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold hover:bg-white"
                  >
                    + Adicionar
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.experiences.map(
                    (experience) => (
                      <article
                        key={experience.id}
                        className="rounded-xl border border-[#DEDEDA] bg-white"
                      >
                        <div className="flex items-center justify-between border-b border-[#E7E7E3] px-5 py-4 sm:px-6">
                          <p className="font-semibold">
                            {experience.role ||
                              "Nova experiência"}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              removeExperience(
                                experience.id,
                              )
                            }
                            className="text-xs font-medium text-[#777772] hover:text-[#B83A3A]"
                          >
                            Remover
                          </button>
                        </div>

                        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                          <label>
                            <span className="mb-2 block text-sm font-medium">
                              Cargo
                            </span>

                            <input
                              value={experience.role}
                              onChange={(event) =>
                                updateExperience(
                                  experience.id,
                                  {
                                    role: event.target.value,
                                  },
                                )
                              }
                              className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                            />
                          </label>

                          <label>
                            <span className="mb-2 block text-sm font-medium">
                              Empresa
                            </span>

                            <input
                              value={
                                experience.company
                              }
                              onChange={(event) =>
                                updateExperience(
                                  experience.id,
                                  {
                                    company:
                                      event.target.value,
                                  },
                                )
                              }
                              className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                            />
                          </label>

                          <label>
                            <span className="mb-2 block text-sm font-medium">
                              Início
                            </span>

                            <input
                              value={
                                experience.startDate ??
                                ""
                              }
                              onChange={(event) =>
                                updateExperience(
                                  experience.id,
                                  {
                                    startDate:
                                      event.target.value,
                                  },
                                )
                              }
                              className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none focus:border-[#181818]"
                            />
                          </label>

                          <label>
                            <span className="mb-2 block text-sm font-medium">
                              Fim
                            </span>

                            <input
                              value={
                                experience.current
                                  ? "Atual"
                                  : experience.endDate ??
                                    ""
                              }
                              disabled={
                                experience.current
                              }
                              onChange={(event) =>
                                updateExperience(
                                  experience.id,
                                  {
                                    endDate:
                                      event.target.value,
                                  },
                                )
                              }
                              className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm outline-none disabled:bg-[#F3F3F0]"
                            />
                          </label>

                          <label className="flex items-center gap-3 sm:col-span-2">
                            <input
                              type="checkbox"
                              checked={
                                experience.current ??
                                false
                              }
                              onChange={(event) =>
                                updateExperience(
                                  experience.id,
                                  {
                                    current:
                                      event.target
                                        .checked,

                                    endDate: event
                                      .target.checked
                                      ? undefined
                                      : experience.endDate,
                                  },
                                )
                              }
                            />

                            <span className="text-sm">
                              Trabalho atualmente
                              nesta empresa
                            </span>
                          </label>

                          <label className="sm:col-span-2">
                            <span className="mb-2 block text-sm font-medium">
                              Conteúdo da experiência
                            </span>

                            <textarea
                              value={experience.bullets.join(
                                "\n",
                              )}
                              onChange={(event) =>
                                updateExperience(
                                  experience.id,
                                  {
                                    bullets:
                                      event.target.value
                                        .split("\n")
                                        .map((item) =>
                                          item.trim(),
                                        )
                                        .filter(Boolean),
                                  },
                                )
                              }
                              rows={7}
                              className="w-full resize-y rounded-lg border border-[#CBCBC5] px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#181818]"
                            />

                            <p className="mt-2 text-xs text-[#777772]">
                              Uma informação por linha.
                            </p>
                          </label>

                          {experience.originalText && (
                            <details className="sm:col-span-2">
                              <summary className="cursor-pointer text-xs font-semibold text-[#686864]">
                                Ver texto original
                                extraído
                              </summary>

                              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-[#F7F7F5] p-4 font-sans text-xs leading-5 text-[#686864]">
                                {
                                  experience.originalText
                                }
                              </pre>
                            </details>
                          )}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </div>

              {/* Formação */}

              <div className="mt-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Formação
                  </h2>

                  <button
                    type="button"
                    onClick={addEducation}
                    className="h-10 rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold hover:bg-white"
                  >
                    + Adicionar
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.education.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-[#DEDEDA] bg-white p-5 sm:p-6"
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label>
                          <span className="mb-2 block text-sm font-medium">
                            Instituição
                          </span>

                          <input
                            value={item.institution}
                            onChange={(event) =>
                              updateEducation(item.id, {
                                institution:
                                  event.target.value,
                              })
                            }
                            className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm"
                          />
                        </label>

                        <label>
                          <span className="mb-2 block text-sm font-medium">
                            Curso
                          </span>

                          <input
                            value={item.course}
                            onChange={(event) =>
                              updateEducation(item.id, {
                                course:
                                  event.target.value,
                              })
                            }
                            className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm"
                          />
                        </label>

                        <label>
                          <span className="mb-2 block text-sm font-medium">
                            Grau
                          </span>

                          <input
                            value={item.degree ?? ""}
                            onChange={(event) =>
                              updateEducation(item.id, {
                                degree:
                                  event.target.value,
                              })
                            }
                            className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm"
                          />
                        </label>

                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              removeEducation(
                                item.id,
                              )
                            }
                            className="h-10 text-sm font-medium text-[#777772] hover:text-[#B83A3A]"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Cursos */}

              <div className="mt-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Cursos e certificações
                  </h2>

                  <button
                    type="button"
                    onClick={addCourse}
                    className="h-10 rounded-lg border border-[#D6D6D1] px-4 text-sm font-semibold hover:bg-white"
                  >
                    + Adicionar
                  </button>
                </div>

                <div className="space-y-4">
                  {resume.courses.map((course) => (
                    <article
                      key={course.id}
                      className="rounded-xl border border-[#DEDEDA] bg-white p-5 sm:p-6"
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label>
                          <span className="mb-2 block text-sm font-medium">
                            Curso
                          </span>

                          <input
                            value={course.name}
                            onChange={(event) =>
                              updateCourse(course.id, {
                                name:
                                  event.target.value,
                              })
                            }
                            className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm"
                          />
                        </label>

                        <label>
                          <span className="mb-2 block text-sm font-medium">
                            Instituição
                          </span>

                          <input
                            value={
                              course.institution ?? ""
                            }
                            onChange={(event) =>
                              updateCourse(course.id, {
                                institution:
                                  event.target.value,
                              })
                            }
                            className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm"
                          />
                        </label>

                        <label>
                          <span className="mb-2 block text-sm font-medium">
                            Data
                          </span>

                          <input
                            value={course.date ?? ""}
                            onChange={(event) =>
                              updateCourse(course.id, {
                                date:
                                  event.target.value,
                              })
                            }
                            className="h-11 w-full rounded-lg border border-[#CBCBC5] px-3.5 text-sm"
                          />
                        </label>

                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              removeCourse(course.id)
                            }
                            className="h-10 text-sm font-medium text-[#777772] hover:text-[#B83A3A]"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* Skills */}

              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                  <label className="text-sm font-semibold">
                    Competências
                  </label>

                  <p className="mt-1 text-xs text-[#777772]">
                    Uma por linha.
                  </p>

                  <textarea
                    rows={10}
                    value={resume.skills.join("\n")}
                    onChange={(event) =>
                      setResume({
                        ...resume,

                        skills: event.target.value
                          .split("\n")
                          .map((item) =>
                            item.trim(),
                          )
                          .filter(Boolean),
                      })
                    }
                    className="mt-4 w-full resize-y rounded-lg border border-[#CBCBC5] px-3.5 py-3 text-sm leading-6"
                  />
                </div>

                <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                  <label className="text-sm font-semibold">
                    Idiomas
                  </label>

                  <p className="mt-1 text-xs text-[#777772]">
                    Um por linha.
                  </p>

                  <textarea
                    rows={10}
                    value={resume.languages.join("\n")}
                    onChange={(event) =>
                      setResume({
                        ...resume,

                        languages: event.target.value
                          .split("\n")
                          .map((item) =>
                            item.trim(),
                          )
                          .filter(Boolean),
                      })
                    }
                    className="mt-4 w-full resize-y rounded-lg border border-[#CBCBC5] px-3.5 py-3 text-sm leading-6"
                  />
                </div>
              </div>

              {/* Actions */}

              <div className="mt-10 flex flex-col gap-3 border-t border-[#DEDEDA] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={analyzeResume}
                  disabled={analyzing}
                  className="h-11 rounded-lg border border-[#D6D6D1] bg-white px-5 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                >
                  {analyzing
                    ? "Reanalisando..."
                    : "Reanalisar original"}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={persistResume}
                    className="h-11 rounded-lg border border-[#D6D6D1] bg-white px-5 text-sm font-semibold transition hover:bg-[#F2F2EF]"
                  >
                    {saving
                      ? "Salvando..."
                      : saved
                        ? "Salvo"
                        : "Salvar alterações"}
                  </button>

                  <button
                    type="button"
                    onClick={continueFlow}
                    className="h-11 rounded-lg bg-[#181818] px-6 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    Usar este currículo
                  </button>
                </div>
              </div>
            </section>

            {/* Sidebar */}

            <aside className="h-fit space-y-4 lg:sticky lg:top-8">
              <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                <p className="text-sm font-semibold">
                  Fonte
                </p>

                <p className="mt-3 truncate text-sm font-medium">
                  {baseResume.fileName}
                </p>

                <p className="mt-1 text-xs text-[#777772]">
                  {baseResume.pages}{" "}
                  {baseResume.pages === 1
                    ? "página"
                    : "páginas"}
                </p>
              </div>

              <div className="rounded-xl border border-[#DEDEDA] bg-white p-5">
                <p className="text-sm font-semibold">
                  Estrutura identificada
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#686864]">
                      Experiências
                    </span>

                    <strong className="text-sm">
                      {resume.experiences.length}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-[#686864]">
                      Formações
                    </span>

                    <strong className="text-sm">
                      {resume.education.length}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-[#686864]">
                      Cursos
                    </span>

                    <strong className="text-sm">
                      {resume.courses.length}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-[#686864]">
                      Competências
                    </span>

                    <strong className="text-sm">
                      {resume.skills.length}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#DEDEDA] bg-[#FFF8FA] p-5">
                <p className="text-sm font-semibold">
                  Importante
                </p>

                <p className="mt-3 text-sm leading-6 text-[#686864]">
                  A IA apenas organizou as informações
                  identificadas no seu currículo. Revise
                  qualquer interpretação antes de continuar.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}