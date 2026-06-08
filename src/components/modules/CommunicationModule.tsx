import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Megaphone, AlertTriangle } from "lucide-react";
import { AnnouncementsModule } from "./AnnouncementsModule";
import { OccurrencesModule } from "./OccurrencesModule";
import { useUnreadAnnouncements } from "@/hooks/useUnreadAnnouncements";
import { useUnreadOccurrences } from "@/hooks/useUnreadOccurrences";
import { Badge } from "@/components/ui/badge";

export function CommunicationModule() {
  const [tab, setTab] = useState<"announcements" | "occurrences">("announcements");
  const { unreadCount: unreadAnn } = useUnreadAnnouncements();
  const { unreadCount: unreadOcc } = useUnreadOccurrences();

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Comunicados
            {unreadAnn > 0 && tab !== "announcements" && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{unreadAnn}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="occurrences" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Ocorrências
            {unreadOcc > 0 && tab !== "occurrences" && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{unreadOcc}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="announcements" className="mt-6">
          <AnnouncementsModule />
        </TabsContent>
        <TabsContent value="occurrences" className="mt-6">
          <OccurrencesModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}
