"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type IngestResult = {
  ingestion?: {
    title?: string;
    possible_instagram_hook?: string;
    citation_status?: string;
  };
  saved?: boolean;
  paper?: { id: string };
  episode?: { id: string };
  webapp?: { url: string; title: string };
};

export function PaperForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState("");

  const redirectToEpisode = (episodeId: string) => {
    setTimeout(() => router.push(`/episodes/${episodeId}`), 2000);
  };

  const runJsonIngest = async (body: Record<string, string>) => {
    setLoading(true);
    setError("");
    setStatus("Extracting paper and building full package (2–5 min)...");
    try {
      const res = await fetch("/api/agents/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStatus("Done — episode, script, demo spec, and interactive webpage created.");
      if (data.episode?.id) redirectToEpisode(data.episode.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const runPdfUpload = async () => {
    if (!pdfFile) {
      setError("Please choose a PDF file");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Parsing PDF and building full package (2–5 min)...");

    try {
      const form = new FormData();
      form.append("pdf", pdfFile);
      if (sourceUrl.trim()) form.append("sourceUrl", sourceUrl.trim());

      const res = await fetch("/api/agents/ingest", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setStatus("Done — episode, script, demo spec, and interactive webpage created.");
      if (data.episode?.id) redirectToEpisode(data.episode.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const ingestFromText = () => runJsonIngest({ text, sourceUrl });
  const ingestFromLink = () => runJsonIngest({ pdfUrl: sourceUrl });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Tabs defaultValue="paste">
        <TabsList>
          <TabsTrigger value="paste">Paste Text</TabsTrigger>
          <TabsTrigger value="link">PDF Link</TabsTrigger>
          <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste paper text — the engine will ingest it, generate the full episode package, and
            deploy an interactive webpage.
          </p>
          <div>
            <Label htmlFor="text">Paper text or abstract</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the paper abstract, introduction, or full text..."
              className="mt-2 min-h-[300px]"
            />
          </div>
          <div>
            <Label htmlFor="url">Source URL (optional)</Label>
            <Input
              id="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://arxiv.org/abs/..."
              className="mt-2"
            />
          </div>
          <Button onClick={ingestFromText} disabled={loading || text.length < 50}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Building...
              </>
            ) : (
              "Ingest & Build Package"
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </TabsContent>

        <TabsContent value="link" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste a direct PDF link (e.g. arXiv PDF). The engine downloads it, extracts text, and
            builds the full package plus interactive webpage.
          </p>
          <div>
            <Label htmlFor="link-url">PDF URL</Label>
            <Input
              id="link-url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://arxiv.org/pdf/1706.03762.pdf"
              className="mt-2"
            />
          </div>
          <Button
            onClick={ingestFromLink}
            disabled={loading || !sourceUrl.trim().startsWith("http")}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading & building...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Ingest from PDF Link
              </>
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </TabsContent>

        <TabsContent value="pdf" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a PDF file. Text is extracted server-side, then the full episode package and
            interactive webpage are generated automatically.
          </p>
          <div>
            <Label htmlFor="pdf-file">PDF file</Label>
            <Input
              id="pdf-file"
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="mt-2"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            {pdfFile && (
              <p className="mt-2 text-xs text-muted-foreground">
                Selected: {pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="pdf-url">Source URL (optional)</Label>
            <Input
              id="pdf-url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://arxiv.org/pdf/..."
              className="mt-2"
            />
          </div>
          <Button onClick={runPdfUpload} disabled={loading || !pdfFile}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing & building...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload & Build Package
              </>
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </TabsContent>
      </Tabs>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Package Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Title:</strong> {result.ingestion?.title}
            </p>
            <p>
              <strong>Hook:</strong> {result.ingestion?.possible_instagram_hook}
            </p>
            <Badge>{result.ingestion?.citation_status}</Badge>
            {result.webapp?.title && (
              <p>
                <strong>Webapp:</strong> {result.webapp.title}
              </p>
            )}
            {result.saved && (
              <p className="text-emerald-600">
                Full package saved. Redirecting to episode...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
