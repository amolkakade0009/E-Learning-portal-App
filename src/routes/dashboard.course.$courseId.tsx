import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { 
  ChevronLeft, PlayCircle, Loader2, MonitorPlay, CheckCircle2, Menu, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiErrorMessage, sendStudentQuery } from "@/api/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/dashboard/course/$courseId")({
  component: CoursePlayer,
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://dange-academy.onrender.com/";

function CoursePlayer() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<any>(null);

  // --- State ---
  const [course, setCourse] = useState<any>(null);
  const [activeTopic, setActiveTopic] = useState<any>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [courseProgressPercentage, setCourseProgressPercentage] = useState<number>(0);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<number>>(new Set());
  const [contentsOpen, setContentsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSendingQuery, setIsSendingQuery] = useState(false);
  const [queryDialog, setQueryDialog] = useState({ open: false, title: "", message: "" });

  // --- Refs (Crucial for blocking spam) ---
  const activeTopicRef = useRef<any>(null);
  const currentVideoTimeRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);
  const initialSeekRef = useRef<number>(0);
  
  // NEW: Ref to track if we already sent the 90% completion request for THIS lesson
  const hasSyncedCompletionRef = useRef<boolean>(false);

  useEffect(() => {
    activeTopicRef.current = activeTopic;
  }, [activeTopic]);

  const getAuthHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("dange_academy_auth_token")}`,
  }), []);

  const fetchCourseProgressSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}api/progress/course/${String(courseId).replace(/\.$/, "")}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCourseProgressPercentage(data.progressPercentage || 0);
        setCompletedTopicIds(new Set(data.completedSubTopicIds || []));
      }
    } catch (err) { console.error("Summary error", err); }
  }, [courseId, getAuthHeaders]);

  // --- The New Optimized Sync Logic ---
  const syncProgress = useCallback(async (subTopicId: number, videoSeconds: number, isCompletion: boolean = false) => {
    if (!subTopicId || isSyncingRef.current) return;

    // If we are calling a completion sync, and we already sent one, skip it.
    if (isCompletion && hasSyncedCompletionRef.current) return;

    isSyncingRef.current = true;
    if (isCompletion) hasSyncedCompletionRef.current = true;

    console.log(`[SYNC] Sending request: Topic ${subTopicId} at ${Math.floor(videoSeconds)}s (Completion: ${isCompletion})`);

    try {
      const response = await fetch(`${API_BASE_URL}api/progress/sync`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          subTopicId: subTopicId,
          currentPositionSeconds: Math.floor(videoSeconds)
        }),
        keepalive: true
      });

      if (response.ok) {
        const result = await response.json();
        if (result.completed) {
          fetchCourseProgressSummary();
        }
      }
    } catch (error) {
      console.error("[SYNC] Failed", error);
      if (isCompletion) hasSyncedCompletionRef.current = false; // allow retry if failed
    } finally {
      isSyncingRef.current = false;
    }
  }, [getAuthHeaders, fetchCourseProgressSummary]);

  // --- Lesson Switch Logic ---
  useEffect(() => {
    if (!activeTopic?.id) return;

    const loadLesson = async () => {
      // Sync the LAST known position of the previous lesson before switching
      if (activeTopicRef.current && currentVideoTimeRef.current > 0) {
        syncProgress(activeTopicRef.current.id, currentVideoTimeRef.current);
      }

      setIsLoadingVideo(true);
      setPlaybackUrl(null);
      currentVideoTimeRef.current = 0;
      hasSyncedCompletionRef.current = false; // RESET for new lesson

      try {
        const pRes = await fetch(`${API_BASE_URL}api/progress/subtopic/${activeTopic.id}`, { headers: getAuthHeaders() });
        const pData = await pRes.json();
        initialSeekRef.current = pData.lastPositionInSeconds || 0;

        const vRes = await fetch(`${API_BASE_URL}student/course/${activeTopic.videoUid}/playback-url`, { headers: getAuthHeaders() });
        let url = await vRes.text();
        try { const j = JSON.parse(url); url = j.playbackUrl || url; } catch(e) {}

        const finalUrl = new URL(url);
        finalUrl.searchParams.set("api", "true");
        finalUrl.searchParams.set("autoplay", "true");
        setPlaybackUrl(finalUrl.toString());
      } catch (e) { console.error(e); } finally { setIsLoadingVideo(false); }
    };

    loadLesson();
  }, [activeTopic?.id]);

  // --- Cloudflare SDK Event Listeners ---
  useEffect(() => {
    if (!playbackUrl || !iframeRef.current) return;

    const script = document.createElement("script");
    script.src = "https://embed.cloudflarestream.com/embed/sdk.latest.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const player = (window as any).Stream(iframeRef.current);
      playerRef.current = player;

      player.addEventListener("ready", () => {
        if (initialSeekRef.current > 0) player.currentTime = initialSeekRef.current;
      });

      player.addEventListener("timeupdate", () => {
        const time = player.currentTime;
        const duration = player.duration;
        currentVideoTimeRef.current = time;

        // ONLY SYNC if user has crossed the 90% threshold
        if (duration > 0) {
          const progressPercent = time / duration;
          if (progressPercent >= 0.9 && !hasSyncedCompletionRef.current) {
            console.log("[PLAYER] 90% Threshold reached");
            syncProgress(activeTopicRef.current?.id, time, true);
          }
        }
      });

      player.addEventListener("pause", () => {
        // Only sync on pause to save resume position (prevents 10s spam)
        console.log("[PLAYER] Paused - saving resume position");
        syncProgress(activeTopicRef.current?.id, currentVideoTimeRef.current);
      });

      player.addEventListener("ended", () => {
        console.log("[PLAYER] Ended");
        syncProgress(activeTopicRef.current?.id, player.duration, true);
      });
    };

    return () => {
      if (playerRef.current) playerRef.current.removeEventListener();
      script.remove();
    };
  }, [playbackUrl, syncProgress]);

  // --- Visibility Sync (Backup) ---
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && activeTopicRef.current?.id) {
        syncProgress(activeTopicRef.current.id, currentVideoTimeRef.current);
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    return () => window.removeEventListener("visibilitychange", handleVisibility);
  }, [syncProgress]);

  // --- Initial Course Load ---
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}student/course/${String(courseId).replace(/\.$/, "")}`, { headers: getAuthHeaders() });
        const data = await res.json();
        setCourse(data);
        fetchCourseProgressSummary();
        if (data.chapters?.[0]?.subTopics?.[0]) setActiveTopic(data.chapters[0].subTopics[0]);
      } catch (e) { console.error(e); } finally { setIsLoadingCourse(false); }
    };
    fetchCourse();
  }, [courseId, getAuthHeaders, fetchCourseProgressSummary]);

  if (isLoadingCourse) return <div className="h-screen flex flex-col items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const courseContents = (
    <ScrollArea className="h-full">
      <Accordion type="multiple" defaultValue={[`chapter-${course?.chapters?.[0]?.id}`]}>
        {course?.chapters?.map((chapter: any) => (
          <AccordionItem key={chapter.id} value={`chapter-${chapter.id}`}>
            <AccordionTrigger className="px-5 py-4 text-left hover:no-underline">
              <div>
                <p className="mb-0.5 text-[9px] font-bold uppercase text-primary">Chapter {chapter.chapterOrder}</p>
                <p className="line-clamp-2 text-sm font-bold">{chapter.chapterName}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-0">
              {chapter.subTopics?.map((topic: any) => {
                const isActive = activeTopic?.id === topic.id;
                const isCompleted = completedTopicIds.has(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => { setActiveTopic(topic); setContentsOpen(false); }}
                    className={`flex min-h-14 w-full items-start gap-3 border-l-4 px-5 py-3 text-left transition-all ${isActive ? "border-primary bg-primary/5 font-bold text-primary" : "border-transparent text-muted-foreground hover:bg-muted"}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <PlayCircle className={`h-4 w-4 ${isActive ? "text-primary" : "opacity-30"}`} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="wrap-break-word text-xs font-medium">{topic.topicName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase opacity-50">
                        {Math.floor((topic.durationInSeconds || 0) / 60)}m {(topic.durationInSeconds || 0) % 60}s
                        {isCompleted && <span className="text-emerald-500">Completed</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );

  const handleQuerySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = query.trim();
    if (!message || isSendingQuery) return;

    setIsSendingQuery(true);
    try {
      const response = await sendStudentQuery({ massage: message });
      setQuery("");
      setQueryDialog({
        open: true,
        title: "Query sent successfully",
        message: typeof response === "string" && response.trim() ? response : "Your query was sent successfully.",
      });
    } catch (error) {
      setQueryDialog({
        open: true,
        title: "Unable to send query",
        message: getApiErrorMessage(error, "Please try again shortly."),
      });
    } finally {
      setIsSendingQuery(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-3 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard" })}><ChevronLeft className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span><span className="sm:hidden">Back</span></Button>
          <h1 className="max-w-[48vw] truncate text-sm font-bold sm:max-w-100 sm:text-base">{course?.courseName}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Progress ({Math.round(courseProgressPercentage)}%)</span>
            <Progress value={courseProgressPercentage} className="h-1.5 w-24 sm:w-32" />
          </div>
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setContentsOpen(true)} aria-label="Open course contents">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Player */}
        <main className="flex-1 overflow-y-auto bg-black flex flex-col relative">
          <div className="aspect-video w-full bg-black relative shadow-2xl">
            {playbackUrl ? (
              <iframe
                key={playbackUrl} 
                ref={iframeRef}
                src={playbackUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/20 flex-col gap-4">
                {isLoadingVideo ? <Loader2 className="h-10 w-10 animate-spin" /> : <MonitorPlay className="h-16 w-16" />}
                <p className="text-sm uppercase tracking-widest">{isLoadingVideo ? "Loading Lesson..." : "Choose a topic"}</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-card flex-1">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black mb-4 tracking-tight">{activeTopic?.topicName}</h2>
              <div className="h-1 w-12 bg-primary mb-6" />
              <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-wrap">{activeTopic?.content}</p>
              <form onSubmit={handleQuerySubmit} className="mt-10 rounded-xl border bg-background p-5 shadow-sm">
                <h3 className="text-lg font-bold">Have a question about this topic?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Send your question to the academy team.</p>
                <Textarea
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Type your question here..."
                  rows={4}
                  maxLength={1000}
                  disabled={isSendingQuery}
                  aria-label="Question about this topic"
                  className="mt-4"
                />
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">{query.length}/1000</span>
                  <Button type="submit" disabled={!query.trim() || isSendingQuery}>
                    {isSendingQuery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isSendingQuery ? "Sending..." : "Send query"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="hidden w-96 shrink-0 flex-col border-l bg-card md:flex">
          <div className="p-5 border-b font-bold text-xs uppercase tracking-widest text-muted-foreground">Course Contents</div>
          <div className="flex-1">{courseContents}</div>
        </aside>
      </div>
      <Dialog open={queryDialog.open} onOpenChange={(open) => setQueryDialog((current) => ({ ...current, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{queryDialog.title}</DialogTitle>
            <DialogDescription>{queryDialog.message}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CoursePlayer;