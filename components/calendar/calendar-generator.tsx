"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export function CalendarGenerator() {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const generate = async (days: number) => {
    setLoading(days);
    setError("");
    try {
      const res = await fetch("/api/agents/generate-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horizonDays: days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[7, 14, 30].map((days) => (
        <Button
          key={days}
          variant="outline"
          onClick={() => generate(days)}
          disabled={loading !== null}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {loading === days ? "Generating..." : `${days}-Day Calendar`}
        </Button>
      ))}
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
