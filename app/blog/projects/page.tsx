import { redirect } from "next/navigation";

// The index moved to /blog; keep old links working.
export default function ProjectsRedirect() {
  redirect("/blog");
}
