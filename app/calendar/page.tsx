import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { CalendarGenerator } from "@/components/calendar/calendar-generator";
import { getCalendarItems } from "@/lib/db/queries";
import { formatDate } from "@/lib/utils";

export default async function CalendarPage() {
  const items = await getCalendarItems();

  return (
    <div className="p-8">
      <PageHeader
        title="Content Calendar"
        description="Schedule and track your Paper to Project Instagram posts."
        action={<CalendarGenerator />}
      />

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-left font-medium">Ep #</th>
              <th className="p-3 text-left font-medium">Title</th>
              <th className="p-3 text-left font-medium">Pillar</th>
              <th className="p-3 text-left font-medium">Audience</th>
              <th className="p-3 text-left font-medium">Recording</th>
              <th className="p-3 text-left font-medium">Demo</th>
              <th className="p-3 text-left font-medium">Caption</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No calendar items. Click Generate Calendar above.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const ep = item.episodes;
                return (
                  <tr key={item.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">{formatDate(item.scheduled_date)}</td>
                    <td className="p-3">{ep?.episode_number}</td>
                    <td className="p-3">
                      {ep && (
                        <Link href={`/episodes/${ep.id}`} className="hover:text-primary">
                          {ep.title}
                        </Link>
                      )}
                    </td>
                    <td className="p-3">
                      {ep?.content_pillars && (
                        <Badge variant="secondary">{ep.content_pillars.code}</Badge>
                      )}
                    </td>
                    <td className="p-3 capitalize">{ep?.target_audience}</td>
                    <td className="p-3">
                      <Badge variant="outline">{item.recording_status}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{item.demo_status}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{item.caption_status}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
