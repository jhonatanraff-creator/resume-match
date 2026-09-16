"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type JobDraft = {
  id: string;
  title: string;
  company: string;
  description: string;
};

type BaseResume = {
  fileName: string;
  fileSize: number;
  pages: number;
  text: string;
  importedAt: string;
};

type StoredResult = {
  id: string;
  roundId: string;
  title: string;
  company: string;
  description: string;
  compatibility: number;
  status: string;
  createdAt: string;
  resumeText: string;
  sourceResumeFile: string;
};

const stages = [
  "Analisando a descrição da vaga",
  "Comparando com o currículo-base",
  "Selecionando informações relevantes",
  "Preparando versão do currículo",
  "Finalizando resultado",
];

export default function ProcessingPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<JobDraft[]>([]);
  const [baseResume, setBaseResume] = useState<BaseResume | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const savedReview = localStorage.getItem("resume-match-review");
    const savedResume = localStorage.getItem("resume-match-base-resume");

    if (!savedReview || !savedResume) {
      router.replace("/novo/importar");
      return;
    }

    try {
      const parsedReview = JSON.parse(savedReview);
      const parsedResume = JSON.parse(savedResume) as BaseResume;

      const savedJobs = parsedReview.jobs as JobDraft[];

      setJobs(savedJobs);
      setBaseResume(parsedResume);

      const initialProgress: Record<string, number> = {};

      savedJobs.forEach((job) => {
        initialProgress[job.id] = 0;
      });

      setProgress(initialProgress);
    } catch {
      router.replace("/novo/importar");
    }
  }, [router]);

  useEffect(() => {
    if (jobs.length === 0 || !baseResume) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const updated = { ...current };

        const nextJob = jobs.find(
          (job) => (updated[job.id] ?? 0) < 100,
        );

        if (!nextJob) {
          window.clearInterval(interval);
          return current;
        }

        const currentValue = updated[nextJob.id] ?? 0;

        updated[nextJob.id] = Math.min(
          currentValue + Math.floor(Math.random() * 13) + 8,
          100,
        );

        return updated;
      });
    }, 650);

    return () => window.clearInterval(interval);
  }, [jobs, baseResume]);

  const allFinished = useMemo(() => {
    if (jobs.length === 0) {
      return false;
    }

    return jobs.every((job) => (progress[job.id] ?? 0) >= 100);
  }, [jobs, progress]);

  useEffect(() => {
    if (!allFinished || finished || !baseResume) {
      return;
    }

    setFinished(true);

    const createdAt = new Date().toISOString();
    const roundId = `round-${Date.now()}`;

    const newResults: StoredResult[] = jobs.map((job) => ({
      id: `${roundId}-${job.id}`,
      roundId,
      title: job.title || "Vaga sem título",
      company: job.company,
      description: job.description,
      compatibility: Math.floor(Math.random() * 16) + 80,
      status: "ready",
      createdAt,

      // Por enquanto usamos o currículo-base real.
      // Depois a IA substituirá isto pela versão adaptada.
      resumeText: baseResume.text,

      sourceResumeFile: baseResume.fileName,
    }));

    const existingHistory = localStorage.getItem(
      "resume-match-history",
    );

    let history: StoredResult[] = [];

    if (existingHistory) {
      try {
        history = JSON.parse(existingHistory) as StoredResult[];
      } catch {
        history = [];
      }
    }

    const updatedHistory = [...newResults, ...history];

    localStorage.setItem(
      "resume-match-history",
      JSON.stringify(updatedHistory),
    );

    localStorage.setItem(
      "resume-match-current-round",
      JSON.stringify({
        roundId,
        createdAt,
        resultIds: newResults.map((result) => result.id),
      }),
    );

    localStorage.removeItem("resume-match-jobs");
    localStorage.removeItem("resume-match-review");

    window.setTimeout(() => {
      router.push("/resultados");
    }, 1200);
  }, [allFinished, finished, jobs, router, baseResume]);

  function getStage(progressValue: number) {
    if (progressValue >= 100) return 5;
    if (progressValue >= 80) return 4;
    if (progressValue >= 60) return 3;
    if (progressValue >= 35) return 2;
    if (progressValue > 0) return 1;

    return 0;
  }

  const completedJobs = jobs.filter(
    (job) => (progress[job.id] ?? 0) >= 100,
  ).length;

  const totalProgress =
    jobs.length === 0
      ? 0
      : Math.round(
          Object.values(progress).reduce(
            (total, value) => total + value,
            0,
          ) / jobs.length,
        );

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

      <div className="border-b border-[#DEDEDA] bg-white">
        <div className="mx-auto max-w-[1040px] px-6 py-6">
          <ol className="grid grid-cols-4 gap-3">
            <li>
              <div className="h-1 rounded-full bg-[#247A52]" />
              <p className="mt-3 text-sm font-medium text-[#686864]">
                ✓ Currículo
              </p>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#247A52]" />
              <p className="mt-3 text-sm font-medium text-[#686864]">
                ✓ Vagas
              </p>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#247A52]" />
              <p className="mt-3 text-sm font-medium text-[#686864]">
                ✓ Revisão
              </p>
            </li>

            <li>
              <div className="h-1 rounded-full bg-[#E9426B]" />
              <p className="mt-3 text-sm font-semibold">
                Resultados
              </p>
            </li>
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-14 lg:py-20">
        <div className="max-w-[650px]">
          <p className="text-sm font-semibold text-[#E9426B]">
            Preparando currículos
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Trabalhando em cada oportunidade.
          </h1>

          <p className="mt-5 text-base leading-7 text-[#686864]">
            Cada vaga é processada separadamente usando seu currículo-base.
            Os resultados serão adicionados ao histórico.
          </p>
        </div>

        {baseResume && (
          <div className="mt-8 flex items-center gap-4 rounded-xl border border-[#DEDEDA] bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFE4EB] text-xs font-bold text-[#E9426B]">
              PDF
            </div>

            <div>
              <p className="text-xs text-[#777772]">
                Currículo-base
              </p>

              <p className="mt-1 text-sm font-semibold">
                {baseResume.fileName}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-[#DEDEDA] bg-white">
          <div className="flex items-center justify-between border-b border-[#E7E7E3] px-5 py-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold">
                Processamento da rodada
              </p>

              <p className="mt-1 text-xs text-[#777772]">
                {completedJobs} de {jobs.length} concluídas
              </p>
            </div>

            <span className="text-sm font-semibold">
              {totalProgress}%
            </span>
          </div>

          <div>
            {jobs.map((job, index) => {
              const value = progress[job.id] ?? 0;
              const currentStage = getStage(value);

              return (
                <article
                  key={job.id}
                  className={`p-5 sm:p-6 ${
                    index !== jobs.length - 1
                      ? "border-b border-[#E7E7E3]"
                      : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                        value >= 100
                          ? "bg-[#E7F4EC] text-[#247A52]"
                          : "bg-[#F0F0ED] text-[#686864]"
                      }`}
                    >
                      {value >= 100 ? "✓" : index + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <h2 className="font-semibold">
                          {job.title || `Vaga ${index + 1}`}
                        </h2>

                        {job.company && (
                          <span className="text-sm text-[#777772]">
                            {job.company}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#E9E9E5]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            value >= 100
                              ? "bg-[#247A52]"
                              : "bg-[#E9426B]"
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-4">
                        <p className="text-xs text-[#777772]">
                          {value >= 100
                            ? "Currículo preparado"
                            : currentStage === 0
                              ? "Aguardando"
                              : stages[currentStage - 1]}
                        </p>

                        <span className="text-xs font-medium text-[#777772]">
                          {value}%
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[#DEDEDA] bg-white px-5 py-4">
          <p className="text-xs leading-5 text-[#686864]">
            Nesta etapa ainda não estamos reescrevendo o currículo com IA.
            Cada resultado recebe uma cópia real do seu currículo-base para
            validarmos o fluxo completo primeiro.
          </p>
        </div>

        {allFinished && (
          <div className="mt-6 rounded-lg bg-[#EAF5EE] px-5 py-4">
            <p className="text-sm font-semibold text-[#247A52]">
              Todos os currículos estão prontos. Abrindo resultados...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}