"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  saveResume as saveResumeToStorage,
} from "@/lib/supabase/save-resume";

import type {
  ResumeCourse,
  ResumeEducation,
  ResumeExperience,
  StructuredResume,
} from "@/types/resume";

function createId(
  prefix: string,
) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function emptyExperience(): ResumeExperience {
  return {
    id: createId("exp"),
    company: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    originalText: "",
    bullets: [""],
  };
}

function emptyEducation(): ResumeEducation {
  return {
    id: createId("edu"),
    institution: "",
    course: "",
    degree: "",
    startDate: "",
    endDate: "",
  };
}

function emptyCourse(): ResumeCourse {
  return {
    id: createId("course"),
    institution: "",
    name: "",
    date: "",
  };
}

function createEmptyResume(): StructuredResume {
  return {
    name: "",
    headline: "",

    contact: {
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: "",
    },

    summary: "",

    experiences: [
      emptyExperience(),
    ],

    education: [],
    courses: [],
    skills: [],
    languages: [],
    rawText: "",
  };
}

export default function CreateResumePage() {
  const router =
    useRouter();

  const [
    resume,
    setResume,
  ] =
    useState<StructuredResume>(
      createEmptyResume(),
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    editingExisting,
    setEditingExisting,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /*
    Ao abrir esta página, verificamos
    se já existe um currículo manual.

    Se existir, usamos os dados salvos
    como ponto de partida para edição.
  */

  useEffect(() => {
    try {
      const source =
        localStorage.getItem(
          "resume-match-resume-source",
        );

      const savedResume =
        localStorage.getItem(
          "resume-match-structured-resume",
        );

      if (
        source === "manual" &&
        savedResume
      ) {
        const parsed =
          JSON.parse(
            savedResume,
          ) as StructuredResume;

        setResume({
          ...parsed,

          contact: {
            email:
              parsed.contact?.email ??
              "",

            phone:
              parsed.contact?.phone ??
              "",

            location:
              parsed.contact?.location ??
              "",

            linkedin:
              parsed.contact?.linkedin ??
              "",

            portfolio:
              parsed.contact?.portfolio ??
              "",
          },

          experiences:
            parsed.experiences.length
              ? parsed.experiences.map(
                  (
                    experience,
                  ) => ({
                    ...experience,

                    location:
                      experience.location ??
                      "",

                    startDate:
                      experience.startDate ??
                      "",

                    endDate:
                      experience.endDate ??
                      "",

                    bullets:
                      experience.bullets
                        .length
                        ? experience.bullets
                        : [""],
                  }),
                )
              : [
                  emptyExperience(),
                ],

          education:
            parsed.education ?? [],

          courses:
            parsed.courses ?? [],

          skills:
            parsed.skills ?? [],

          languages:
            parsed.languages ?? [],

          rawText: "",
        });

        setEditingExisting(
          true,
        );
      }
    } catch (
      loadError
    ) {
      console.error(
        "Erro ao carregar currículo manual:",
        loadError,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  function updateExperience(
    id: string,
    updates:
      Partial<ResumeExperience>,
  ) {
    setResume(
      (current) => ({
        ...current,

        experiences:
          current.experiences.map(
            (experience) =>
              experience.id ===
              id
                ? {
                    ...experience,
                    ...updates,
                  }
                : experience,
          ),
      }),
    );
  }

  function removeExperience(
    id: string,
  ) {
    setResume(
      (current) => ({
        ...current,

        experiences:
          current.experiences.filter(
            (experience) =>
              experience.id !==
              id,
          ),
      }),
    );
  }

  function addExperience() {
    setResume(
      (current) => ({
        ...current,

        experiences: [
          ...current.experiences,
          emptyExperience(),
        ],
      }),
    );
  }

  function updateEducation(
    id: string,
    updates:
      Partial<ResumeEducation>,
  ) {
    setResume(
      (current) => ({
        ...current,

        education:
          current.education.map(
            (education) =>
              education.id === id
                ? {
                    ...education,
                    ...updates,
                  }
                : education,
          ),
      }),
    );
  }

  function removeEducation(
    id: string,
  ) {
    setResume(
      (current) => ({
        ...current,

        education:
          current.education.filter(
            (education) =>
              education.id !==
              id,
          ),
      }),
    );
  }

  function addEducation() {
    setResume(
      (current) => ({
        ...current,

        education: [
          ...current.education,
          emptyEducation(),
        ],
      }),
    );
  }

  function updateCourse(
    id: string,
    updates:
      Partial<ResumeCourse>,
  ) {
    setResume(
      (current) => ({
        ...current,

        courses:
          current.courses.map(
            (course) =>
              course.id === id
                ? {
                    ...course,
                    ...updates,
                  }
                : course,
          ),
      }),
    );
  }

  function removeCourse(
    id: string,
  ) {
    setResume(
      (current) => ({
        ...current,

        courses:
          current.courses.filter(
            (course) =>
              course.id !==
              id,
          ),
      }),
    );
  }

  function addCourse() {
    setResume(
      (current) => ({
        ...current,

        courses: [
          ...current.courses,
          emptyCourse(),
        ],
      }),
    );
  }

  async function saveResume() {
    setError("");

    if (
      !resume.name.trim()
    ) {
      setError(
        "Informe seu nome.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (
      !resume.headline?.trim()
    ) {
      setError(
        "Informe seu título profissional.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const validExperiences =
      resume.experiences
        .filter(
          (experience) =>
            experience.company.trim() ||
            experience.role.trim(),
        )
        .map(
          (experience) => ({
            ...experience,

            company:
              experience.company.trim(),

            role:
              experience.role.trim(),

            location:
              experience.location?.trim() ||
              undefined,

            startDate:
              experience.startDate?.trim() ||
              undefined,

            endDate:
              experience.current
                ? undefined
                : experience.endDate?.trim() ||
                  undefined,

            bullets:
              experience.bullets
                .map(
                  (bullet) =>
                    bullet.trim(),
                )
                .filter(Boolean),

            originalText: "",
          }),
        );

    const validEducation =
      resume.education
        .filter(
          (education) =>
            education.course.trim() ||
            education.institution.trim(),
        )
        .map(
          (education) => ({
            ...education,

            course:
              education.course.trim(),

            institution:
              education.institution.trim(),

            degree:
              education.degree?.trim() ||
              undefined,

            startDate:
              education.startDate?.trim() ||
              undefined,

            endDate:
              education.endDate?.trim() ||
              undefined,
          }),
        );

    const validCourses =
      resume.courses
        .filter(
          (course) =>
            course.name.trim(),
        )
        .map(
          (course) => ({
            ...course,

            name:
              course.name.trim(),

            institution:
              course.institution?.trim() ||
              undefined,

            date:
              course.date?.trim() ||
              undefined,
          }),
        );

    const cleanedResume:
      StructuredResume = {
      ...resume,

      name:
        resume.name.trim(),

      headline:
        resume.headline?.trim() ||
        undefined,

      summary:
        resume.summary?.trim() ||
        undefined,

      contact: {
        email:
          resume.contact.email?.trim() ||
          undefined,

        phone:
          resume.contact.phone?.trim() ||
          undefined,

        location:
          resume.contact.location?.trim() ||
          undefined,

        linkedin:
          resume.contact.linkedin?.trim() ||
          undefined,

        portfolio:
          resume.contact.portfolio?.trim() ||
          undefined,
      },

      experiences:
        validExperiences,

      education:
        validEducation,

      courses:
        validCourses,

      skills:
        resume.skills
          .map(
            (skill) =>
              skill.trim(),
          )
          .filter(Boolean),

      languages:
        resume.languages
          .map(
            (language) =>
              language.trim(),
          )
          .filter(Boolean),

      rawText: "",
    };

    setSaving(true);

    try {
      await saveResumeToStorage({
        resume:
          cleanedResume,
        source:
          "manual",
      });

      router.push(
        "/novo/vaga",
      );
    } catch (
      saveError
    ) {
      console.error(
        "Erro ao salvar currículo:",
        saveError,
      );

      setError(
        "Seu currículo foi salvo neste navegador, mas não foi possível sincronizá-lo com sua conta. Tente novamente.",
      );

      setSaving(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  if (loading) {
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
          <img
            src="/brand/resume-match-logo-horizontal.svg"
            alt="Resume Match"
            className="h-9 w-auto"
          />

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="text-sm font-medium text-[#686864]"
          >
            Voltar
          </button>
        </div>
      </header>

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

      <div className="mx-auto max-w-[980px] px-6 py-12 lg:py-16">
        <div className="max-w-[700px]">
          <p className="text-sm font-semibold text-[#E9426B]">
            Currículo-base
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            {editingExisting
              ? "Edite seu currículo."
              : "Conte sua trajetória."}
          </h1>

          <p className="mt-5 text-base leading-7 text-[#686864]">
            {editingExisting
              ? "Atualize as informações do seu currículo-base. As candidaturas já criadas continuarão preservando a versão utilizada naquele momento."
              : "Preencha as informações que realmente fazem parte da sua experiência. Este será o currículo-base usado para criar versões direcionadas para cada vaga."}
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-[#F0C9D1] bg-[#FFF4F6] px-5 py-4">
            <p className="text-sm font-semibold text-[#B83F55]">
              {error}
            </p>
          </div>
        )}

        <FormSection
          title="Dados profissionais"
          description="As informações que aparecem no cabeçalho do currículo."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Nome completo"
              required
            >
              <input
                value={
                  resume.name
                }
                onChange={(
                  event,
                ) =>
                  setResume({
                    ...resume,
                    name:
                      event.target.value,
                  })
                }
                placeholder="Ex.: Jhonatan Rafael"
                className={inputClass}
              />
            </Field>

            <Field
              label="Título profissional"
              required
            >
              <input
                value={
                  resume.headline ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setResume({
                    ...resume,
                    headline:
                      event.target.value,
                  })
                }
                placeholder="Ex.: Product Designer Especialista"
                className={inputClass}
              />
            </Field>

            <Field label="E-mail">
              <input
                type="email"
                value={
                  resume.contact.email ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setResume({
                    ...resume,

                    contact: {
                      ...resume.contact,
                      email:
                        event.target.value,
                    },
                  })
                }
                placeholder="nome@email.com"
                className={inputClass}
              />
            </Field>

            <Field label="Telefone">
              <input
                value={
                  resume.contact.phone ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setResume({
                    ...resume,

                    contact: {
                      ...resume.contact,
                      phone:
                        event.target.value,
                    },
                  })
                }
                placeholder="(43) 99999-9999"
                className={inputClass}
              />
            </Field>

            <Field label="Localização">
              <input
                value={
                  resume.contact.location ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setResume({
                    ...resume,

                    contact: {
                      ...resume.contact,
                      location:
                        event.target.value,
                    },
                  })
                }
                placeholder="Ex.: Londrina, PR"
                className={inputClass}
              />
            </Field>

            <Field label="LinkedIn">
              <input
                value={
                  resume.contact.linkedin ??
                  ""
                }
                onChange={(
                  event,
                ) =>
                  setResume({
                    ...resume,

                    contact: {
                      ...resume.contact,
                      linkedin:
                        event.target.value,
                    },
                  })
                }
                placeholder="linkedin.com/in/seuperfil"
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Portfólio ou site">
                <input
                  value={
                    resume.contact.portfolio ??
                    ""
                  }
                  onChange={(
                    event,
                  ) =>
                    setResume({
                      ...resume,

                      contact: {
                        ...resume.contact,
                        portfolio:
                          event.target.value,
                      },
                    })
                  }
                  placeholder="seusite.com"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Resumo profissional"
          description="Uma apresentação curta da sua experiência e área de atuação."
        >
          <Field label="Resumo">
            <textarea
              value={
                resume.summary ??
                ""
              }
              onChange={(
                event,
              ) =>
                setResume({
                  ...resume,
                  summary:
                    event.target.value,
                })
              }
              placeholder="Ex.: Product Designer com experiência em produtos digitais, discovery, pesquisa e design systems..."
              className={`${textareaClass} min-h-[150px]`}
            />
          </Field>
        </FormSection>

        <FormSection
          title="Experiência profissional"
          description="Adicione suas experiências da mais recente para a mais antiga."
        >
          <div className="grid gap-5">
            {resume.experiences.map(
              (
                experience,
                index,
              ) => (
                <div
                  key={
                    experience.id
                  }
                  className="rounded-xl border border-[#E1E1DD] bg-[#FAFAF8] p-5"
                >
                  <div className="flex items-start justify-between gap-5">
                    <p className="text-xs font-semibold text-[#E9426B]">
                      Experiência{" "}
                      {index + 1}
                    </p>

                    {resume.experiences.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeExperience(
                            experience.id,
                          )
                        }
                        className="text-xs font-semibold text-[#9A545F]"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field label="Cargo">
                      <input
                        value={
                          experience.role
                        }
                        onChange={(
                          event,
                        ) =>
                          updateExperience(
                            experience.id,
                            {
                              role:
                                event.target.value,
                            },
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Empresa">
                      <input
                        value={
                          experience.company
                        }
                        onChange={(
                          event,
                        ) =>
                          updateExperience(
                            experience.id,
                            {
                              company:
                                event.target.value,
                            },
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Localização">
                      <input
                        value={
                          experience.location ??
                          ""
                        }
                        onChange={(
                          event,
                        ) =>
                          updateExperience(
                            experience.id,
                            {
                              location:
                                event.target.value,
                            },
                          )
                        }
                        className={inputClass}
                      />
                    </Field>

                    <div />

                    <Field label="Início">
                      <input
                        value={
                          experience.startDate ??
                          ""
                        }
                        onChange={(
                          event,
                        ) =>
                          updateExperience(
                            experience.id,
                            {
                              startDate:
                                event.target.value,
                            },
                          )
                        }
                        placeholder="Ex.: mai/2024"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Fim">
                      <input
                        value={
                          experience.endDate ??
                          ""
                        }
                        disabled={
                          Boolean(
                            experience.current,
                          )
                        }
                        onChange={(
                          event,
                        ) =>
                          updateExperience(
                            experience.id,
                            {
                              endDate:
                                event.target.value,
                            },
                          )
                        }
                        className={`${inputClass} disabled:bg-[#F0F0ED]`}
                      />
                    </Field>
                  </div>

                  <label className="mt-5 flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        Boolean(
                          experience.current,
                        )
                      }
                      onChange={(
                        event,
                      ) =>
                        updateExperience(
                          experience.id,
                          {
                            current:
                              event.target.checked,

                            endDate:
                              event.target.checked
                                ? ""
                                : experience.endDate,
                          },
                        )
                      }
                    />

                    Trabalho aqui atualmente
                  </label>

                  <div className="mt-5">
                    <Field label="Principais atividades e resultados">
                      <textarea
                        value={
                          experience.bullets.join(
                            "\n",
                          )
                        }
                        onChange={(
                          event,
                        ) =>
                          updateExperience(
                            experience.id,
                            {
                              bullets:
                                event.target.value.split(
                                  "\n",
                                ),
                            },
                          )
                        }
                        placeholder="Uma atividade ou resultado por linha"
                        className={`${textareaClass} min-h-[180px]`}
                      />
                    </Field>

                    <p className="mt-2 text-xs text-[#777772]">
                      Use uma linha para cada item.
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>

          <AddButton
            onClick={
              addExperience
            }
          >
            + Adicionar experiência
          </AddButton>
        </FormSection>

        <FormSection
          title="Formação"
          description="Graduação, pós-graduação e outras formações acadêmicas."
        >
          {resume.education.length ===
          0 ? (
            <EmptyState>
              Nenhuma formação adicionada.
            </EmptyState>
          ) : (
            <div className="grid gap-5">
              {resume.education.map(
                (
                  education,
                  index,
                ) => (
                  <div
                    key={
                      education.id
                    }
                    className="rounded-xl border border-[#E1E1DD] bg-[#FAFAF8] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#777772]">
                        Formação{" "}
                        {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          removeEducation(
                            education.id,
                          )
                        }
                        className="text-xs font-semibold text-[#9A545F]"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <Field label="Curso">
                        <input
                          value={
                            education.course
                          }
                          onChange={(
                            event,
                          ) =>
                            updateEducation(
                              education.id,
                              {
                                course:
                                  event.target.value,
                              },
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Instituição">
                        <input
                          value={
                            education.institution
                          }
                          onChange={(
                            event,
                          ) =>
                            updateEducation(
                              education.id,
                              {
                                institution:
                                  event.target.value,
                              },
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Tipo / grau">
                        <input
                          value={
                            education.degree ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateEducation(
                              education.id,
                              {
                                degree:
                                  event.target.value,
                              },
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <div />

                      <Field label="Início">
                        <input
                          value={
                            education.startDate ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateEducation(
                              education.id,
                              {
                                startDate:
                                  event.target.value,
                              },
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Conclusão">
                        <input
                          value={
                            education.endDate ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateEducation(
                              education.id,
                              {
                                endDate:
                                  event.target.value,
                              },
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          <AddButton
            onClick={
              addEducation
            }
          >
            + Adicionar formação
          </AddButton>
        </FormSection>

        <FormSection
          title="Cursos e certificações"
          description="Formações complementares relevantes."
        >
          {resume.courses.length ===
          0 ? (
            <EmptyState>
              Nenhum curso adicionado.
            </EmptyState>
          ) : (
            <div className="grid gap-5">
              {resume.courses.map(
                (
                  course,
                  index,
                ) => (
                  <div
                    key={
                      course.id
                    }
                    className="rounded-xl border border-[#E1E1DD] bg-[#FAFAF8] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#777772]">
                        Curso{" "}
                        {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          removeCourse(
                            course.id,
                          )
                        }
                        className="text-xs font-semibold text-[#9A545F]"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <Field label="Curso ou certificação">
                        <input
                          value={
                            course.name
                          }
                          onChange={(
                            event,
                          ) =>
                            updateCourse(
                              course.id,
                              {
                                name:
                                  event.target.value,
                              },
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Instituição">
                        <input
                          value={
                            course.institution ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateCourse(
                              course.id,
                              {
                                institution:
                                  event.target.value,
                              },
                            )
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Ano ou período">
                        <input
                          value={
                            course.date ??
                            ""
                          }
                          onChange={(
                            event,
                          ) =>
                            updateCourse(
                              course.id,
                              {
                                date:
                                  event.target.value,
                              },
                            )
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          <AddButton
            onClick={
              addCourse
            }
          >
            + Adicionar curso
          </AddButton>
        </FormSection>

        <FormSection
          title="Competências"
          description="Ferramentas, métodos e áreas de conhecimento."
        >
          <Field label="Competências">
            <textarea
              value={
                resume.skills.join(
                  ", ",
                )
              }
              onChange={(
                event,
              ) =>
                setResume({
                  ...resume,

                  skills:
                    event.target.value.split(
                      ",",
                    ),
                })
              }
              className={`${textareaClass} min-h-[130px]`}
            />
          </Field>

          <p className="mt-2 text-xs text-[#777772]">
            Separe por vírgula.
          </p>
        </FormSection>

        <FormSection
          title="Idiomas"
          description="Idiomas que você deseja apresentar no currículo."
        >
          <Field label="Idiomas">
            <input
              value={
                resume.languages.join(
                  ", ",
                )
              }
              onChange={(
                event,
              ) =>
                setResume({
                  ...resume,

                  languages:
                    event.target.value.split(
                      ",",
                    ),
                })
              }
              className={inputClass}
            />
          </Field>

          <p className="mt-2 text-xs text-[#777772]">
            Separe por vírgula.
          </p>
        </FormSection>

        <div className="mt-8 rounded-2xl border border-[#DEDEDA] bg-white p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {editingExisting
                  ? "Salvar alterações"
                  : "Pronto para usar este currículo?"}
              </h2>

              <p className="mt-2 max-w-[540px] text-sm leading-6 text-[#686864]">
                Suas candidaturas antigas não serão alteradas quando você editar o currículo-base.
              </p>
            </div>

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                saveResume
              }
              className="
                h-12
                shrink-0
                rounded-lg
                bg-[#181818]
                px-6
                text-sm
                font-semibold
                text-white
                enabled:hover:bg-black
                disabled:bg-[#777772]
              "
            >
              {saving
                ? "Salvando..."
                : editingExisting
                  ? "Salvar currículo"
                  : "Usar este currículo"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-[#DEDEDA] bg-white">
      <div className="border-b border-[#E7E7E3] px-5 py-5 sm:px-6">
        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#777772]">
          {description}
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}

        {required && (
          <span className="ml-1 text-[#E9426B]">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        mt-5
        w-full
        rounded-xl
        border
        border-dashed
        border-[#CFCFCA]
        px-5
        py-4
        text-sm
        font-semibold
        text-[#4F4F4B]
        hover:bg-[#F7F7F5]
      "
    >
      {children}
    </button>
  );
}

function EmptyState({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#D8D8D3] bg-[#FAFAF8] px-5 py-6 text-sm text-[#777772]">
      {children}
    </div>
  );
}

const inputClass = `
  h-11
  w-full
  rounded-lg
  border
  border-[#CBCBC5]
  bg-white
  px-3.5
  text-sm
  outline-none
  focus:border-[#181818]
`;

const textareaClass = `
  w-full
  resize-y
  rounded-lg
  border
  border-[#CBCBC5]
  bg-white
  p-3.5
  text-sm
  leading-6
  outline-none
  focus:border-[#181818]
`;