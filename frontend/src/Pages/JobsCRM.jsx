import React from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Search,
  ArrowUpRight,
  Activity,
} from "lucide-react";

const sections = [
  {
    to: "/jobs",
    icon: Search,
    title: "Job Search",
    text: "Browse live job listings, filter opportunities and open application details.",
  },
  {
    to: "/companies",
    icon: Building2,
    title: "Companies",
    text: "Store company profiles, previous openings, links and your research notes.",
  },
  {
    to: "/applications",
    icon: ClipboardList,
    title: "Application Tracker",
    text: "Track every application, deadline, status, notes and interview progress.",
  },
  {
    to: "/workspace/activities",
    icon: Activity,
    title: "Activities",
    text: "Keep follow-ups and job-search activity organized in your workspace.",
  },
];

export default function JobsCRM() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            JOB CRM
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Your job search, applications and company research in one place.
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            Start with job discovery, then save company information and track
            what you applied for. CareerHub keeps each part of the workflow
            connected instead of scattering it across notes and spreadsheets.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map(({ to, icon: Icon, title, text }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                  <Icon size={23} />
                </span>
                <ArrowUpRight
                  className="text-slate-400 transition group-hover:text-blue-700"
                  size={19}
                />
              </div>
              <h2 className="mt-6 text-xl font-semibold">{title}</h2>
              <p className="mt-2 leading-6 text-slate-600">{text}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="text-blue-700" />
            <div>
              <h2 className="font-semibold">Recommended workflow</h2>
              <p className="text-sm text-slate-500">
                Discover → research company → apply → track → follow up.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
