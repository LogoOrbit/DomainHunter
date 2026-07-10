import type { Metadata } from "next";
import { AppShell, EmptyState } from "../components/app-shell";
export const metadata: Metadata = { title: "Projects" };
export default function ProjectsPage() { return <AppShell eyebrow="Workspace" title="Projects"><EmptyState label="No projects yet" description="Group domains and buyer research into durable projects without arbitrary application limits." /></AppShell>; }
