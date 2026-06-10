"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BuildWebappButton({
  episodeId,
  webappUrl,
}: {
  episodeId: string;
  webappUrl?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState(webappUrl || "");

  const build = async () => {
    setLoading(true);
    setError("");
    setUrl("");
    try {
      const res = await fetch("/api/agents/build-webapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUrl(data.url);
      router.refresh();
      window.open(data.url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Build failed");
    } finally {
      setLoading(false);
    }
  };

  const deployed = Boolean(url);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {deployed && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-md border border-green-200 bg-green-50 px-3 text-sm font-medium text-green-800"
        >
          Interactive webpage deployed
        </a>
      )}
      <Button onClick={build} disabled={loading} variant={deployed ? "outline" : "default"}>
        <Smartphone className="mr-2 h-4 w-4" />
        {loading
          ? "Building web app (2–5 min)..."
          : deployed
            ? "Redeploy Webpage"
            : "Deploy Interactive Webpage"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
