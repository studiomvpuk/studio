import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectDetail from "../../../components/ProjectDetail";
import { projects, projectBySlug } from "../../projects";

// Pre-render every case study at build time.
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) return { title: "Work — StudioMVP" };
  return {
    title: `${p.name} — StudioMVP`,
    description: p.intro,
    openGraph: { title: `${p.name} — StudioMVP`, description: p.intro, images: [p.hero] },
  };
}

export default async function ProjectPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
