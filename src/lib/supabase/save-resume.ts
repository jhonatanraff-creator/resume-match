import {
  supabase,
} from "@/lib/supabase/client";

import type {
  StructuredResume,
} from "@/types/resume";

type SaveResumeOptions = {
  resume: StructuredResume;
  source: "manual" | "pdf";
  fileName?: string | null;
};

type SaveResumeResult = {
  savedLocally: boolean;
  savedToAccount: boolean;
};

export async function saveResume({
  resume,
  source,
  fileName = null,
}: SaveResumeOptions): Promise<SaveResumeResult> {
  localStorage.setItem(
    "resume-match-structured-resume",
    JSON.stringify(resume),
  );

  localStorage.setItem(
    "resume-match-resume-source",
    source,
  );

  if (
    source === "manual"
  ) {
    localStorage.removeItem(
      "resume-match-base-resume",
    );
  }

  const result: SaveResumeResult = {
    savedLocally: true,
    savedToAccount: false,
  };

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
    return result;
  }

  const {
    data:
      existingResumes,
    error:
      searchError,
  } =
    await supabase
      .from(
        "resumes",
      )
      .select(
        "id",
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
    searchError
  ) {
    throw searchError;
  }

  const activeResumeId =
    existingResumes?.[0]
      ?.id;

  if (
    activeResumeId
  ) {
    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          "resumes",
        )
        .update({
          source,
          file_name:
            fileName,
          data:
            resume,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          activeResumeId,
        )
        .eq(
          "user_id",
          user.id,
        );

    if (
      updateError
    ) {
      throw updateError;
    }

    result.savedToAccount =
      true;

    return result;
  }

  const {
    error:
      insertError,
  } =
    await supabase
      .from(
        "resumes",
      )
      .insert({
        user_id:
          user.id,

        source,

        file_name:
          fileName,

        data:
          resume,

        is_active:
          true,
      });

  if (
    insertError
  ) {
    throw insertError;
  }

  result.savedToAccount =
    true;

  return result;
}