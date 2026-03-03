export interface CourseCardDto {
  id: string;
  slug: string;
  title: string;
  ar_title: string | null;
  description: string | null;
  ar_description: string | null;
  longDescription: string | null;
  ar_longDescription: string | null;
  thumbnail: string | null;
  image: string | null;
  color: string;
  access: string;
  state: string;
  difficulty: string;
  ar_difficulty: string | null;
  category: string;
  ar_category: string | null;
  contentType: string;
  isNew: boolean;
  isFeatured: boolean;
  totalTopics: number;
  estimatedHours: number;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
  tags: string[];
  skills: string[];
  ar_skills: string[];
  topics: string[];
  ar_topics: string[];
  prerequisites: string[];
  ar_prerequisites: string[];
  sections: { id: string; order: number }[];
  labsCount: number;
  userProgress: { progress: number; isCompleted: boolean } | null;
  instructor?: { id: string; name: string; avatarUrl: string | null };
}

export function toCourseCard(raw: any): CourseCardDto {
  const { _count, enrollments, ...rest } = raw;

  const enrollment =
    Array.isArray(enrollments) && enrollments.length > 0
      ? enrollments[0]
      : null;

  return {
    ...rest,
    image: rest.thumbnail ?? null,
    labsCount: _count?.labs ?? 0,
    userProgress: enrollment
      ? { progress: enrollment.progress, isCompleted: enrollment.isCompleted }
      : null,
  };
}
