import { redirect } from "next/navigation";

// The apex domain's /blog belongs to the main WordPress site;
// this app's index lives at /blog/projects.
export default function BlogRedirect() {
  redirect("/blog/projects");
}
