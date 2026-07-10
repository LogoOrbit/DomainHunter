import type { Metadata } from "next";
import { AppShell } from "../../components/app-shell";
import { CompanyProfileClient } from "./profile-client";
export const metadata: Metadata = { title: "Company profile" };
export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) { return <AppShell eyebrow="Public buyer candidate" title="Company profile"><CompanyProfileClient id={(await params).id} /></AppShell>; }
