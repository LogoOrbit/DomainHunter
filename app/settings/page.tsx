import type { Metadata } from "next";
import { AppShell } from "../components/app-shell";
import { DataWorkspace } from "../components/data-workspace";
export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() { return <AppShell eyebrow="Application preferences" title="Settings center"><DataWorkspace endpoint="/api/settings" /></AppShell>; }
