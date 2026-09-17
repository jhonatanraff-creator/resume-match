import {
  supabase,
} from "@/lib/supabase/client";

import type {
  StructuredResume,
} from "@/types/resume";

type LocalApplication = {
  id?: string;
  title?: string;
  company?: string;
  description?: string;

  compatibility?: {
    score?: number;
  };

  adaptedResume?: unknown;
  baseResumeSnapshot?: StructuredResume;
};

type SyncResult = {
  resumeImported: boolean;
  applicationsImported: number;
};

const LOCAL_OWNER_KEY =
  "resume-match-local-owner";

const ACCOUNT_LOCAL_KEYS = [
  "resume-match-structured-resume",
  "resume-match-base-resume",
  "resume-match-resume-source",
  "resume-match-history",
  "resume-match-current-round",
  "resume-match-jobs",
  "resume-match-review",
];

function clearAccountLocalData() {
  for (const key of ACCOUNT_LOCAL_KEYS) {
    localStorage.removeItem(
      key,
    );
  }
}

export async function syncLocalDataToSupabase(): Promise<SyncResult> {
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
    throw new Error(
      "Usuário não autenticado.",
    );
  }

  /*
    Proteção para computadores compartilhados.

    Se outro usuário já utilizou o Resume Match
    neste navegador, limpamos os dados locais
    vinculados à conta anterior antes de continuar.
  */

  const localOwner =
    localStorage.getItem(
      LOCAL_OWNER_KEY,
    );

  if (
    localOwner &&
    localOwner !== user.id
  ) {
    clearAccountLocalData();
  }

  /*
    A partir daqui, os dados locais pertencem
    ao usuário atualmente autenticado.
  */

  localStorage.setItem(
    LOCAL_OWNER_KEY,
    user.id,
  );

  const result: SyncResult = {
    resumeImported: false,
    applicationsImported: 0,
  };

  /*
    Mantém o perfil básico atualizado.
  */

  const {
    error:
      profileError,
  } =
    await supabase
      .from(
        "profiles",
      )
      .upsert(
        {
          id:
            user.id,

          email:
            user.email ??
            null,

          name:
            user.user_metadata
              ?.name ??
            null,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "id",
        },
      );

  if (
    profileError
  ) {
    throw profileError;
  }

  /*
    Tenta encontrar currículo-base
    existente no navegador.
  */

  let localResume:
    StructuredResume |
    null =
    null;

  const storedResume =
    localStorage.getItem(
      "resume-match-structured-resume",
    );

  if (
    storedResume
  ) {
    try {
      localResume =
        JSON.parse(
          storedResume,
        ) as StructuredResume;
    } catch {
      localResume =
        null;
    }
  }

  /*
    Busca o currículo ativo da conta.
  */

  const {
    data:
      existingResumes,
    error:
      resumeSearchError,
  } =
    await supabase
      .from(
        "resumes",
      )
      .select(
        "id, data, source, file_name",
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
    resumeSearchError
  ) {
    throw resumeSearchError;
  }

  let resumeId:
    string |
    null =
    existingResumes?.[0]
      ?.id ??
    null;

  /*
    Somente importamos o currículo local
    se a conta ainda não possuir um.

    Isso evita que um currículo antigo
    do navegador sobrescreva dados mais
    recentes salvos na nuvem.
  */

  if (
    !resumeId &&
    localResume
  ) {
    const source =
      localStorage.getItem(
        "resume-match-resume-source",
      );

    const storedBaseResume =
      localStorage.getItem(
        "resume-match-base-resume",
      );

    let fileName:
      string |
      null =
      null;

    if (
      storedBaseResume
    ) {
      try {
        const parsed =
          JSON.parse(
            storedBaseResume,
          );

        if (
          typeof parsed?.fileName ===
          "string"
        ) {
          fileName =
            parsed.fileName;
        }
      } catch {
        fileName =
          null;
      }
    }

    const {
      data:
        insertedResume,
      error:
        insertResumeError,
    } =
      await supabase
        .from(
          "resumes",
        )
        .insert({
          user_id:
            user.id,

          source:
            source ===
            "manual"
              ? "manual"
              : "pdf",

          file_name:
            fileName,

          data:
            localResume,

          is_active:
            true,
        })
        .select(
          "id",
        )
        .single();

    if (
      insertResumeError
    ) {
      throw insertResumeError;
    }

    resumeId =
      insertedResume.id;

    result.resumeImported =
      true;
  }

  /*
    Histórico local de candidaturas.
  */

  const storedHistory =
    localStorage.getItem(
      "resume-match-history",
    );

  let localApplications:
    LocalApplication[] =
    [];

  if (
    storedHistory
  ) {
    try {
      const parsed =
        JSON.parse(
          storedHistory,
        );

      if (
        Array.isArray(
          parsed,
        )
      ) {
        localApplications =
          parsed;
      }
    } catch {
      localApplications =
        [];
    }
  }

  /*
    Migra candidaturas antigas para a conta.

    client_id evita duplicar a mesma
    candidatura a cada acesso ao Dashboard.
  */

  for (
    let index = 0;
    index <
    localApplications.length;
    index++
  ) {
    const application =
      localApplications[
        index
      ];

    if (
      !application.adaptedResume ||
      !application.baseResumeSnapshot
    ) {
      continue;
    }

    const clientId =
      application.id ??
      `legacy-${index}-${application.title ?? "vaga"}`;

    const {
      data:
        existingApplication,
      error:
        existingApplicationError,
    } =
      await supabase
        .from(
          "applications",
        )
        .select(
          "id",
        )
        .eq(
          "user_id",
          user.id,
        )
        .eq(
          "client_id",
          clientId,
        )
        .maybeSingle();

    if (
      existingApplicationError
    ) {
      throw existingApplicationError;
    }

    if (
      existingApplication
    ) {
      continue;
    }

    const {
      error:
        insertApplicationError,
    } =
      await supabase
        .from(
          "applications",
        )
        .insert({
          user_id:
            user.id,

          resume_id:
            resumeId,

          client_id:
            clientId,

          job_title:
            application.title ??
            "Candidatura",

          company:
            application.company ??
            null,

          job_description:
            application.description ??
            null,

          compatibility_score:
            typeof application
              .compatibility
              ?.score ===
            "number"
              ? application
                  .compatibility
                  .score
              : null,

          adapted_resume:
            application.adaptedResume,

          base_resume_snapshot:
            application.baseResumeSnapshot,
        });

    if (
      insertApplicationError
    ) {
      throw insertApplicationError;
    }

    result.applicationsImported +=
      1;
  }

  return result;
}