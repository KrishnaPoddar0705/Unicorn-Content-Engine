import { redirect } from "next/navigation";

// Bare /blog/project (no slug) → the index.
export default function ProjectIndexRedirect() {
  redirect("/blog");
}
