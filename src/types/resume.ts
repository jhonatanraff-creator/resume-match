export type ResumeContact = {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
};

export type ResumeExperience = {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;

  originalText: string;

  bullets: string[];
};

export type ResumeEducation = {
  id: string;
  institution: string;
  course: string;
  degree?: string;
  startDate?: string;
  endDate?: string;
};

export type ResumeCourse = {
  id: string;
  institution?: string;
  name: string;
  date?: string;
};

export type StructuredResume = {
  name: string;
  headline?: string;

  contact: ResumeContact;

  summary?: string;

  experiences: ResumeExperience[];

  education: ResumeEducation[];

  courses: ResumeCourse[];

  skills: string[];

  languages: string[];

  rawText: string;
};

export type JobRequirement = {
  id: string;

  requirement: string;

  importance:
    | "essential"
    | "preferred"
    | "contextual";

  evidence:
    | "strong"
    | "partial"
    | "none";

  evidenceSource?: string;

  notes?: string;
};

export type AdaptedExperience = {
  experienceId: string;

  company: string;
  role: string;

  originalBullets: string[];

  adaptedBullets: string[];

  changes: {
    original: string;
    adapted: string;
    reason: string;
  }[];
};

export type AdaptedResume = {
  jobTitle: string;
  company?: string;

  headline?: string;

  summary?: string;

  experiences: AdaptedExperience[];

  education: ResumeEducation[];

  courses: ResumeCourse[];

  skills: string[];

  requirements: JobRequirement[];

  supportedKeywords: string[];

  unsupportedKeywords: string[];

  compatibility: {
    score: number;

    matched: number;

    partial: number;

    missing: number;
  };
};