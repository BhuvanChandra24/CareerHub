import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  BriefcaseBusiness,
  UsersRound,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "https://careerhub-dqxt.onrender.com"
).replace(/\/$/, "");
const token = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const emptyCompany = {
  name: "",
  website: "",
  industry: "",
  location: "",
  notes: "",
};
const emptyOpening = {
  title: "",
  location: "",
  type: "",
  status: "Open",
  url: "",
  openedAt: "",
  notes: "",
};

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [openingForm, setOpeningForm] = useState(emptyOpening);
  const [editingId, setEditingId] = useState("");
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/companies");
      setCompanies(data.companies || []);
      setSelectedId((current) => current || data.companies?.[0]?._id || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter(
      (company) =>
        !q ||
        `${company.name} ${company.industry} ${company.location}`
          .toLowerCase()
          .includes(q),
    );
  }, [companies, query]);

  const selected =
    companies.find((company) => company._id === selectedId) || null;

  const saveCompany = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = editingId
        ? await api(`/api/companies/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify(companyForm),
          })
        : await api("/api/companies", {
            method: "POST",
            body: JSON.stringify(companyForm),
          });
      setCompanies((old) =>
        editingId
          ? old.map((x) => (x._id === editingId ? data.company : x))
          : [data.company, ...old],
      );
      setSelectedId(data.company._id);
      setCompanyForm(emptyCompany);
      setEditingId("");
      setShowCompanyForm(false);
      setNotice("Company details saved.");
    } catch (e) {
      setError(e.message);
    }
  };

  const editCompany = () => {
    if (!selected) return;
    setCompanyForm({
      name: selected.name || "",
      website: selected.website || "",
      industry: selected.industry || "",
      location: selected.location || "",
      notes: selected.notes || "",
    });
    setEditingId(selected._id);
    setShowCompanyForm(true);
    setNotice("");
  };

  const deleteCompany = async () => {
    if (
      !selected ||
      !window.confirm(`Delete ${selected.name} and its saved openings?`)
    )
      return;
    try {
      await api(`/api/companies/${selected._id}`, { method: "DELETE" });
      const next = companies.filter((x) => x._id !== selected._id);
      setCompanies(next);
      setSelectedId(next[0]?._id || "");
      setNotice("Company removed.");
    } catch (e) {
      setError(e.message);
    }
  };

  const saveOpening = async (event) => {
    event.preventDefault();
    if (!selected) return;
    setError("");
    try {
      const data = await api(`/api/companies/${selected._id}/openings`, {
        method: "POST",
        body: JSON.stringify(openingForm),
      });
      setCompanies((old) =>
        old.map((x) => (x._id === selected._id ? data.company : x)),
      );
      setOpeningForm(emptyOpening);
      setShowOpeningForm(false);
      setNotice("Opening saved to the company history.");
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteOpening = async (openingId) => {
    if (
      !selected ||
      !window.confirm("Remove this opening from company history?")
    )
      return;
    try {
      const data = await api(
        `/api/companies/${selected._id}/openings/${openingId}`,
        { method: "DELETE" },
      );
      setCompanies((old) =>
        old.map((x) => (x._id === selected._id ? data.company : x)),
      );
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Company CRM
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Companies & opening history
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Save company details, previous openings, links, contacts notes and
              application context so your job search stays organized.
            </p>
          </div>
          <button
            onClick={() => {
              setCompanyForm(emptyCompany);
              setEditingId("");
              setShowCompanyForm(true);
              setNotice("");
            }}
            className="rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white"
          >
            <Plus size={16} className="mr-2 inline" />
            Add company
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-green-700">
            {notice}
          </p>
        )}
        {showCompanyForm && (
          <form
            onSubmit={saveCompany}
            className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2"
          >
            <h2 className="md:col-span-2 text-lg font-semibold">
              {editingId ? "Edit company" : "Add company"}
            </h2>
            {[
              ["name", "Company name"],
              ["website", "Website"],
              ["industry", "Industry"],
              ["location", "Location"],
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-medium">
                {label}
                <input
                  required={key === "name"}
                  value={companyForm[key]}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, [key]: e.target.value })
                  }
                  placeholder={key === "website" ? "https://company.com" : ""}
                  className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
                />
              </label>
            ))}
            <label className="text-sm font-medium md:col-span-2">
              Notes
              <textarea
                rows="3"
                value={companyForm.notes}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, notes: e.target.value })
                }
                className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"
              />
            </label>
            <div className="flex gap-2 md:col-span-2">
              <button className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white">
                Save company
              </button>
              <button
                type="button"
                onClick={() => setShowCompanyForm(false)}
                className="rounded-lg border px-4 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className="mt-6 grid gap-5 lg:grid-cols-[330px_1fr]">
          <aside className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Saved companies</h2>
              <span className="text-xs text-slate-500">{filtered.length}</span>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies..."
              className="mt-4 w-full rounded-lg border px-3 py-2.5 text-sm"
            />
            <div className="mt-3 space-y-2">
              {busy ? (
                <p className="p-3 text-sm text-slate-500">Loading...</p>
              ) : filtered.length ? (
                filtered.map((company) => (
                  <button
                    key={company._id}
                    onClick={() => {
                      setSelectedId(company._id);
                      setNotice("");
                    }}
                    className={`w-full rounded-xl border p-3 text-left ${selectedId === company._id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-slate-100 p-2">
                        <Building2 size={17} />
                      </span>
                      <span>
                        <strong className="block text-sm">
                          {company.name}
                        </strong>
                        <span className="text-xs text-slate-500">
                          {company.industry || "Industry not set"}
                        </span>
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="p-3 text-sm text-slate-500">
                  No companies saved yet.
                </p>
              )}
            </div>
          </aside>
          <section className="rounded-2xl border bg-white p-5">
            {!selected ? (
              <div className="grid min-h-80 place-items-center text-center">
                <div>
                  <Building2 className="mx-auto text-slate-300" size={42} />
                  <h2 className="mt-3 text-lg font-semibold">
                    Select a company
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Save a company first, then keep its openings and notes here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                        <Building2 />
                      </span>
                      <div>
                        <h2 className="text-2xl font-bold">{selected.name}</h2>
                        <p className="text-sm text-slate-500">
                          {selected.industry || "Industry not set"}
                          {selected.location ? ` · ${selected.location}` : ""}
                        </p>
                      </div>
                    </div>
                    {selected.website && (
                      <a
                        href={selected.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm text-blue-700"
                      >
                        Company website <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={editCompany}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      <Pencil size={15} className="mr-1 inline" />
                      Edit
                    </button>
                    <button
                      onClick={deleteCompany}
                      className="rounded-lg border px-3 py-2 text-sm text-red-700"
                    >
                      <Trash2 size={15} className="mr-1 inline" />
                      Delete
                    </button>
                  </div>
                </div>
                {selected.notes && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {selected.notes}
                  </div>
                )}
                <div className="mt-7 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Opening history</h3>
                    <p className="text-sm text-slate-500">
                      Keep current and previous openings together.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOpeningForm(emptyOpening);
                      setShowOpeningForm(true);
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                  >
                    <Plus size={15} className="mr-1 inline" />
                    Add opening
                  </button>
                </div>
                {showOpeningForm && (
                  <form
                    onSubmit={saveOpening}
                    className="mt-4 grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-2"
                  >
                    <h4 className="md:col-span-2 font-semibold">
                      Save opening
                    </h4>
                    {[
                      ["title", "Job title"],
                      ["location", "Location"],
                      ["type", "Employment type"],
                      ["url", "Job URL"],
                      ["openedAt", "Opened date"],
                    ].map(([key, label]) => (
                      <label key={key} className="text-sm font-medium">
                        {label}
                        <input
                          required={key === "title"}
                          type={key === "openedAt" ? "date" : "text"}
                          value={openingForm[key]}
                          onChange={(e) =>
                            setOpeningForm({
                              ...openingForm,
                              [key]: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"
                        />
                      </label>
                    ))}
                    <label className="text-sm font-medium">
                      Status
                      <select
                        value={openingForm.status}
                        onChange={(e) =>
                          setOpeningForm({
                            ...openingForm,
                            status: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"
                      >
                        <option>Open</option>
                        <option>Closed</option>
                        <option>Filled</option>
                        <option>Archived</option>
                      </select>
                    </label>
                    <label className="text-sm font-medium md:col-span-2">
                      Notes
                      <textarea
                        rows="2"
                        value={openingForm.notes}
                        onChange={(e) =>
                          setOpeningForm({
                            ...openingForm,
                            notes: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"
                      />
                    </label>
                    <div className="flex gap-2 md:col-span-2">
                      <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
                        Save opening
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOpeningForm(false)}
                        className="rounded-lg border px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                <div className="mt-4 space-y-3">
                  {selected.openings?.length ? (
                    selected.openings
                      .slice()
                      .reverse()
                      .map((opening) => (
                        <article
                          key={opening._id}
                          className="rounded-xl border p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="font-semibold">{opening.title}</h4>
                              <p className="mt-1 text-sm text-slate-600">
                                {opening.location || "Location not specified"}
                                {opening.type
                                  ? ` · ${opening.type}`
                                  : ""} · {opening.status}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteOpening(opening._id)}
                              className="text-sm text-red-700"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          {opening.url && (
                            <a
                              href={opening.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-sm text-blue-700"
                            >
                              Opening link <ExternalLink size={13} />
                            </a>
                          )}
                          {opening.notes && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {opening.notes}
                            </p>
                          )}
                        </article>
                      ))
                  ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
                      No opening history saved yet.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
