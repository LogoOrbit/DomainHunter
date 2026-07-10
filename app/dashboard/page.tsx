import type { Metadata } from "next";
import { AppShell } from "../components/app-shell";
import { DashboardClient } from "./dashboard-client";
export const metadata: Metadata = { title: "Dashboard" };
export default function DashboardPage() { return <AppShell eyebrow="Continuous discovery" title="Intelligence dashboard"><DashboardClient /></AppShell>; }
