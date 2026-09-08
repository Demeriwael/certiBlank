export type Platform = {
  id: string;
  name: string;
  slug: string;
  certifications: { id: string; title: string; slug: string; _count?: { questions: number } }[];
};

