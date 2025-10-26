"use client";

import { FormEvent, useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowPathIcon, PlayCircleIcon } from "@heroicons/react/24/outline";

interface AgentStepArtifact {
  label: string;
  value: string;
  url?: string;
}

interface AgentStep {
  key: string;
  label: string;
  status: "pending" | "running" | "succeeded" | "failed" | "skipped";
  logs: string[];
  startedAt?: string;
  finishedAt?: string;
  artifacts?: AgentStepArtifact[];
  error?: string;
}

interface AgentJob {
  id: string;
  topic: string;
  tone: string;
  voice: string;
  status: "pending" | "running" | "succeeded" | "failed";
  createdAt: string;
  updatedAt: string;
  steps: AgentStep[];
  output: {
    script?: string;
    enhancedScript?: string;
    videoUrl?: string;
    youtubeUrl?: string;
  };
  error?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const { data, isLoading, mutate } = useSWR<{ jobs: AgentJob[] }>(
    "/api/agent",
    fetcher,
    {
      refreshInterval: 4000
    }
  );
  const [topic, setTopic] = useState("How to stay productive as a remote developer");
  const [tone, setTone] = useState("Inspiring");
  const [voice, setVoice] = useState("Friendly mentor");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const jobs = data?.jobs ?? [];
  const selectedJob = useMemo(() => {
    if (!jobs.length) return undefined;
    if (selectedJobId) {
      return jobs.find((job) => job.id === selectedJobId) ?? jobs[0];
    }
    return jobs[0];
  }, [jobs, selectedJobId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ topic, tone, voice })
      });
      if (!response.ok) {
        throw new Error("Failed to start agent run");
      }
      const payload = await response.json();
      setSelectedJobId(payload.job.id);
      mutate();
    } catch (error) {
      console.error(error);
      alert("Unable to start agent run. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl ring-1 ring-slate-800/80 backdrop-blur">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Agentic pipeline
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Create, polish, render, and publish fully automated videos
          </h1>
          <p className="text-slate-400">
            Describe your topic and the agent will draft a script, refine it,
            generate a motion-backed video, and upload it to YouTube using your
            API credentials.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Topic</label>
            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="h-28 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="What should the agent create a video about?"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Tone</label>
              <input
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="Inspirational, educational, comedic..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Narration voice</label>
              <input
                value={voice}
                onChange={(event) => setVoice(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="Friendly mentor, dramatic storyteller..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 p-3 text-sm font-semibold tracking-wide text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/40"
          >
            {submitting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Running agent...
              </>
            ) : (
              <>
                <PlayCircleIcon className="h-4 w-4" /> Launch agent
              </>
            )}
          </button>
        </form>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
          <h2 className="text-lg font-semibold text-white">Pipeline overview</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-400">
            <li>
              Draft: Generates a structured narration tailored to your topic,
              tone, and voice.
            </li>
            <li>
              Enhance: Polishes pacing, visuals, and engagement cues for better
              delivery.
            </li>
            <li>
              Render: Calls a generative video service (Replicate) or falls back
              to a placeholder clip.
            </li>
            <li>
              Publish: Uploads directly to YouTube using OAuth credentials.
            </li>
          </ol>
        </article>
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent runs</h2>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Auto-refreshing timeline
            </p>
          </div>
          <button
            onClick={() => mutate()}
            className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:bg-slate-900"
          >
            Refresh
          </button>
        </header>

        <div className="space-y-3">
          {isLoading && !jobs.length ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
              Loading runs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 p-6 text-center text-sm text-slate-500">
              No runs yet. Launch the agent to see progress here.
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedJob?.id === job.id
                      ? "border-indigo-400/60 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-950/40 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-100">
                    {job.topic}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {job.tone} · {job.voice}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedJob && <StepTimeline job={selectedJob} />}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: AgentJob["status"] }) {
  const variant =
    status === "succeeded"
      ? "bg-emerald-500/20 text-emerald-300"
      : status === "failed"
        ? "bg-rose-500/20 text-rose-300"
        : status === "running"
          ? "bg-amber-500/20 text-amber-300"
          : "bg-slate-700/30 text-slate-300";
  return (
    <span className={`rounded-full px-3 py-1 font-semibold ${variant}`}>
      {status.toUpperCase()}
    </span>
  );
}

function StepTimeline({ job }: { job: AgentJob }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Run timeline</h3>
          <p className="text-xs text-slate-500">
            Started {new Date(job.createdAt).toLocaleString()}
          </p>
        </div>
        {job.output.youtubeUrl && (
          <a
            href={job.output.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-rose-400"
          >
            View on YouTube
          </a>
        )}
      </header>

      <ol className="space-y-4">
        {job.steps.map((step, index) => (
          <li key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  step.status === "succeeded"
                    ? "border-emerald-400 text-emerald-300"
                    : step.status === "failed"
                      ? "border-rose-400 text-rose-300"
                      : step.status === "running"
                        ? "border-amber-400 text-amber-300"
                        : step.status === "skipped"
                          ? "border-slate-500 text-slate-400"
                          : "border-slate-600 text-slate-400"
                }`}
              >
                {index + 1}
              </span>
              {index < job.steps.length - 1 && (
                <div className="mt-1 h-full w-px bg-slate-800" />
              )}
            </div>
            <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-sm">
                <h4 className="font-semibold text-slate-100">{step.label}</h4>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {step.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {step.startedAt && <span>Started {formatTime(step.startedAt)}</span>}
                {step.finishedAt && (
                  <span className="ml-2">Finished {formatTime(step.finishedAt)}</span>
                )}
              </div>
              {step.error && (
                <p className="mt-2 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-200">
                  {step.error}
                </p>
              )}
              {step.artifacts && step.artifacts.length > 0 && (
                <div className="mt-3 space-y-2 text-xs">
                  {step.artifacts.map((artifact) => (
                    <div
                      key={`${step.key}-${artifact.label}`}
                      className="rounded-lg border border-slate-800/60 bg-slate-950/60 p-2"
                    >
                      <p className="font-semibold text-slate-200">
                        {artifact.label}
                      </p>
                      {artifact.url ? (
                        <a
                          href={artifact.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-300 underline"
                        >
                          {artifact.value}
                        </a>
                      ) : (
                        <pre className="mt-1 whitespace-pre-wrap text-slate-300">
                          {artifact.value}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {step.logs.length > 0 && (
                <details className="mt-3 text-xs text-slate-400">
                  <summary className="cursor-pointer select-none text-slate-300">
                    View logs
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {step.logs.map((log, idx) => (
                      <li key={idx} className="rounded bg-slate-950/60 p-2">
                        {log}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </li>
        ))}
      </ol>
      {job.error && (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {job.error}
        </p>
      )}
    </div>
  );
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString();
}
