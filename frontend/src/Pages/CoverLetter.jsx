import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Download, Sparkles } from "lucide-react";
const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const token = () => localStorage.getItem("token") || sessionStorage.getItem("token") || "";
export default function CoverLetter() {
  const [form,setForm]=useState({fullName:"",company:"",jobTitle:"",jobDescription:"",resumeText:"",tone:"Professional"});
  const [result,setResult]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  const update=e=>setForm({...form,[e.target.name]:e.target.value});
  const generate=async e=>{e.preventDefault();setLoading(true);setError("");setResult("");try{
    const r=await fetch(`${API}/api/ai/cover-letter`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`},body:JSON.stringify(form)});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Unable to generate cover letter.");setResult(d.result||"");
  }catch(e){setError(e.message)}finally{setLoading(false)}};
  const download=()=>{const blob=new Blob([result],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${(form.company||"careerhub").replace(/[^a-z0-9]/gi,"_")}_cover_letter.txt`;a.click();URL.revokeObjectURL(url)};
  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link to="/" className="text-xl font-bold">CareerHub</Link><nav className="flex gap-4 text-sm"><Link to="/dashboard">Dashboard</Link><Link to="/applications">Applications</Link><Link to="/ai-tools">AI Toolkit</Link></nav></div></header>
  <section className="mx-auto max-w-4xl px-5 py-8"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">AI writing assistant</p><h1 className="mt-1 text-3xl font-bold">Cover Letter Generator</h1><p className="mt-2 text-slate-600">Generate an editable, job-specific draft grounded in the details you provide.</p>
  <form onSubmit={generate} className="mt-6 grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2">
    {[["fullName","Your full name"],["company","Company"],["jobTitle","Job title"]].map(([name,label])=><label key={name} className="text-sm font-medium">{label}<input name={name} required value={form[name]} onChange={update} className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"/></label>)}
    <label className="text-sm font-medium">Tone<select name="tone" value={form.tone} onChange={update} className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"><option>Professional</option><option>Warm and confident</option><option>Concise</option></select></label>
    <label className="text-sm font-medium md:col-span-2">Resume details / relevant experience<textarea name="resumeText" rows="4" value={form.resumeText} onChange={update} placeholder="Paste relevant skills, projects, education and experience. Avoid including unnecessary sensitive information." className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"/></label>
    <label className="text-sm font-medium md:col-span-2">Job description<textarea name="jobDescription" required rows="5" value={form.jobDescription} onChange={update} className="mt-1 w-full rounded-lg border px-3 py-2.5 font-normal"/></label>
    {error&&<p role="alert" className="md:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={loading} className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50 md:col-span-2"><Sparkles size={16} className="mr-2 inline"/>{loading?"Generating…":"Generate cover letter"}</button>
  </form>
  {result&&<section className="mt-6 rounded-2xl border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Your cover letter draft</h2><div className="flex gap-2"><button onClick={()=>navigator.clipboard.writeText(result)} className="rounded-lg border px-3 py-2 text-sm"><Copy size={15} className="mr-1 inline"/>Copy</button><button onClick={download} className="rounded-lg border px-3 py-2 text-sm"><Download size={15} className="mr-1 inline"/>Download</button></div></div><textarea value={result} onChange={e=>setResult(e.target.value)} rows="18" className="mt-4 w-full rounded-xl border p-4 leading-7"/></section>}
  </section></main>;
}
