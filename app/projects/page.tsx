import type { Metadata } from "next";
import { AppShell } from "../components/app-shell";
import { DataWorkspace } from "../components/data-workspace";
export const metadata: Metadata = { title: "Projects" };
export default function ProjectsPage() { return <AppShell eyebrow="Research workspace" title="Projects"><DataWorkspace endpoint="/api/projects" /></AppShell>; }
