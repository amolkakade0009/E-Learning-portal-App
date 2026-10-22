import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, FileVideo, Plus, Trash2, AlertTriangle, Loader2, Pencil, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { 
  createChapter, 
  createSubTopic, 
  updateSubTopic,
  getApiErrorMessage, 
  getChapterSubTopics, 
  getCourseChapters, 
  uploadVideo, 
  deleteChapter as deleteChapterApi, 
  deleteSubTopic as deleteSubTopicApi,
  type CourseChapter 
} from "@/api/api";

export const Route = createFileRoute("/admin/courses/$courseId")({ component: AdminEditCourse });

// --- Circular Progress UI Component ---
const CircularProgress = ({ value }: { value: number }) => {
  const radius = 36;
  const dashArray = 2 * Math.PI * radius;
  const dashOffset = dashArray - (dashArray * value) / 100;

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4">
      <div className="relative h-28 w-28">
        <svg className="h-full w-full -rotate-90">
          <circle cx="56" cy="56" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
          <circle
            cx="56" cy="56" r={radius} fill="transparent" stroke="currentColor" strokeWidth="8"
            strokeDasharray={dashArray}
            style={{ strokeDashoffset: dashOffset, transition: "stroke-dashoffset 0.3s linear" }}
            strokeLinecap="round" className="text-primary"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{value}%</span>
        </div>
      </div>
      <p className="font-semibold text-navy text-sm uppercase tracking-wider">Uploading Video Content...</p>
    </div>
  );
};

function AdminEditCourse() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<CourseChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [subTopicChapterId, setSubTopicChapterId] = useState<number | null>(null);
  const [editingSubTopic, setEditingSubTopic] = useState<{ id: number; parentChapterId: number; videoUid: string } | null>(null);
  const [savingChapter, setSavingChapter] = useState(false);
  const [savingSubTopic, setSavingSubTopic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Progress State
  
  // States for Deletion
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'chapter' | 'subtopic'; parentChapterId?: number } | null>(null);

  const [chapterForm, setChapterForm] = useState({ chapterName: "", description: "", chapterOrder: "" });
  const [subTopicForm, setSubTopicForm] = useState({ topicName: "", content: "", topicOrder: "", video: null as File | null });

  const loadContent = async () => {
    try {
      setLoading(true);
      const chapterList = await getCourseChapters(courseId);
      const chaptersWithSubTopics = await Promise.all(chapterList.map(async (chapter) => ({
        ...chapter,
        subTopics: await getChapterSubTopics(chapter.id),
      })));
      setChapters(chaptersWithSubTopics.sort((a, b) => a.chapterOrder - b.chapterOrder));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load course content."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadContent(); }, [courseId]);

  const saveChapter = async () => {
    if (!chapterForm.chapterName.trim() || !chapterForm.chapterOrder) {
      toast.error("Chapter name and order are required.");
      return;
    }
    try {
      setSavingChapter(true);
      const chapter = await createChapter(courseId, { ...chapterForm, chapterOrder: Number(chapterForm.chapterOrder) });
      setChapters((current) => [...current, { ...chapter, subTopics: [] }].sort((a, b) => a.chapterOrder - b.chapterOrder));
      setChapterForm({ chapterName: "", description: "", chapterOrder: "" });
      setChapterOpen(false);
      toast.success("Chapter created successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create the chapter."));
    } finally {
      setSavingChapter(false);
    }
  };

  const saveSubTopic = async () => {
    if (subTopicChapterId === null || !subTopicForm.topicName.trim() || !subTopicForm.topicOrder || !subTopicForm.video) {
      toast.error("Subtopic name, order, and video are required.");
      return;
    }
    try {
      setSavingSubTopic(true);
      setUploadProgress(0); // Reset progress

      if(!localStorage.getItem("video_uid"))
      {
        // Pass the progress callback to uploadVideo
        const videoUid = await uploadVideo(subTopicForm.video, (p) => setUploadProgress(p));
        localStorage.setItem("video_uid", videoUid);
        
        const subTopic = await createSubTopic(subTopicChapterId, {
          topicName: subTopicForm.topicName.trim(),
          content: subTopicForm.content.trim(),
          topicOrder: Number(subTopicForm.topicOrder),
          videoUid,
        });
        
        setChapters((current) => current.map((chapter) => chapter.id === subTopicChapterId
          ? { ...chapter, subTopics: [...chapter.subTopics, subTopic].sort((a, b) => a.topicOrder - b.topicOrder) }
          : chapter));
        setSubTopicForm({ topicName: "", content: "", topicOrder: "", video: null });
        setSubTopicChapterId(null);
        localStorage.removeItem("video_uid");
        toast.success("Subtopic created successfully.");
      } else {
        const subTopic = await createSubTopic(subTopicChapterId, {
          topicName: subTopicForm.topicName.trim(),
          content: subTopicForm.content.trim(),
          topicOrder: Number(subTopicForm.topicOrder),
          videoUid:localStorage.getItem("video_uid") ?? " ",
        });
        setChapters((current) => current.map((chapter) => chapter.id === subTopicChapterId
          ? { ...chapter, subTopics: [...chapter.subTopics, subTopic].sort((a, b) => a.topicOrder - b.topicOrder) }
          : chapter));
        setSubTopicForm({ topicName: "", content: "", topicOrder: "", video: null });
        setSubTopicChapterId(null);
        localStorage.removeItem("video_uid");
        toast.success("Subtopic created successfully.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create the subtopic."));
    } finally {
      setSavingSubTopic(false);
      setUploadProgress(0);
    }
  };

  const openEditSubTopic = (topic: CourseChapter["subTopics"][number], parentChapterId: number) => {
    setEditingSubTopic({ id: topic.id, parentChapterId, videoUid: topic.videoUid });
    setSubTopicForm({
      topicName: topic.topicName,
      content: topic.content || "",
      topicOrder: String(topic.topicOrder),
      video: null,
    });
  };

  const updateSubTopicDetails = async () => {
    if (!editingSubTopic || !subTopicForm.topicName.trim() || !subTopicForm.topicOrder) {
      toast.error("Subtopic name and order are required.");
      return;
    }

    try {
      setSavingSubTopic(true);
      const updated = await updateSubTopic(editingSubTopic.id, {
        topicName: subTopicForm.topicName.trim(),
        content: subTopicForm.content.trim(),
        topicOrder: Number(subTopicForm.topicOrder),
        videoUid: editingSubTopic.videoUid,
      });
      setChapters((current) => current.map((chapter) => chapter.id === editingSubTopic.parentChapterId
        ? { ...chapter, subTopics: chapter.subTopics.map((topic) => topic.id === updated.id ? updated : topic).sort((a, b) => a.topicOrder - b.topicOrder) }
        : chapter));
      setEditingSubTopic(null);
      setSubTopicForm({ topicName: "", content: "", topicOrder: "", video: null });
      toast.success("Subtopic details updated successfully. Existing video retained.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the subtopic."));
    } finally {
      setSavingSubTopic(false);
    }
  };

  const handleDeleteRequest = (id: number, type: 'chapter' | 'subtopic', parentChapterId?: number) => {
    setItemToDelete({ id, type, parentChapterId });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      if (itemToDelete.type === 'chapter') {
        await deleteChapterApi(itemToDelete.id);
        setChapters((current) => current.filter(c => c.id !== itemToDelete.id));
        toast.success("Chapter deleted successfully.");
      } else {
        await deleteSubTopicApi(itemToDelete.id);
        setChapters((current) => current.map(chapter => 
          chapter.id === itemToDelete.parentChapterId 
            ? { ...chapter, subTopics: chapter.subTopics.filter(st => st.id !== itemToDelete.id) }
            : chapter
        ));
        toast.success("Subtopic deleted successfully.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Unable to delete ${itemToDelete.type}.`));
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="min-h-screen max-w-5xl bg-[radial-gradient(circle_at_top,_rgba(32,197,177,0.08),_transparent_35%)] p-6 sm:p-10">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/courses" })} aria-label="Back to courses"><ChevronLeft className="h-5 w-5" /></Button>
        <div className="flex-1"><h1 className="font-display text-3xl font-black tracking-tight text-[#101827] dark:text-foreground">Course content</h1><p className="text-sm text-muted-foreground">Create chapters and nested subtopics for this course.</p></div>
        <Dialog open={chapterOpen} onOpenChange={setChapterOpen}>
          <DialogTrigger asChild><Button className="bg-[#20c5b1] text-[#071126] shadow-[0_10px_24px_rgba(32,197,177,0.2)] hover:bg-[#1db7a4]"><Plus className="mr-2 h-4 w-4" /> Add chapter</Button></DialogTrigger>
          <DialogContent className="rounded-2xl border-[#dcefeb] bg-background shadow-[0_24px_70px_rgba(15,23,42,0.16)] dark:border-border">
            <DialogHeader><DialogTitle className="text-xl font-black">Create chapter</DialogTitle><DialogDescription>Add a structured chapter to this course.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Chapter number</Label><Input min="1" type="number" value={chapterForm.chapterOrder} onChange={(event) => setChapterForm({ ...chapterForm, chapterOrder: event.target.value })} className="mt-1.5" /></div>
              <div><Label>Chapter title</Label><Input value={chapterForm.chapterName} onChange={(event) => setChapterForm({ ...chapterForm, chapterName: event.target.value })} className="mt-1.5" /></div>
              <div><Label>Description</Label><Textarea value={chapterForm.description} onChange={(event) => setChapterForm({ ...chapterForm, description: event.target.value })} className="mt-1.5" /></div>
            </div>
            <DialogFooter><Button disabled={savingChapter} onClick={saveChapter} className="bg-[#20c5b1] text-[#071126] shadow-[0_10px_24px_rgba(32,197,177,0.2)] hover:bg-[#1db7a4]">{savingChapter ? "Creating..." : "Create chapter"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="rounded-2xl border border-border p-10 text-center text-muted-foreground">Loading course content...</div> : chapters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No chapters yet. Add the first chapter to start building this course.</div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {chapters.map((chapter) => (
            <AccordionItem key={chapter.id} value={String(chapter.id)} className="rounded-2xl border border-[#dcefeb] bg-card px-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:border-border">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-semibold">{chapter.chapterOrder}. {chapter.chapterName}</span>
                <span className="ml-2 text-xs text-muted-foreground">({chapter.subTopics.length} subtopics)</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <p className="text-sm text-muted-foreground">{chapter.description}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDeleteRequest(chapter.id, 'chapter')}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Chapter
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {chapter.subTopics.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/35 p-3 transition-colors hover:bg-[#f0fbf9] dark:hover:bg-[#0d2f2a]">
                      <div className="flex items-center gap-3">
                        <FileVideo className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{topic.topicOrder}. {topic.topicName}</div>
                          <div className="text-xs text-muted-foreground">{topic.content || "No description"} · {topic.durationInSeconds}s</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#0a9d8d] hover:bg-[#eafffa] hover:text-[#087d70] dark:hover:bg-[#0d2f2a]"
                          onClick={() => openEditSubTopic(topic, chapter.id)}
                          title="Update subtopic"
                          aria-label="Update subtopic"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteRequest(topic.id, 'subtopic', chapter.id)}
                          title="Delete subtopic"
                          aria-label="Delete subtopic"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Dialog open={subTopicChapterId === chapter.id} onOpenChange={(open) => !savingSubTopic && setSubTopicChapterId(open ? chapter.id : null)}>
                  <DialogTrigger asChild><Button variant="outline" size="sm" className="mt-3 w-full"><Plus className="mr-2 h-3 w-3" /> Add subtopic</Button></DialogTrigger>
                  <DialogContent className="rounded-2xl border-[#dcefeb] bg-background shadow-[0_24px_70px_rgba(15,23,42,0.16)] dark:border-border">
                    <DialogHeader><DialogTitle className="text-xl font-black">Add subtopic</DialogTitle><DialogDescription>Add a lesson to {chapter.chapterName}.</DialogDescription></DialogHeader>
                    
                    {savingSubTopic && subTopicForm.video ? (
                      <CircularProgress value={uploadProgress} />
                    ) : (
                      <>
                        <div className="space-y-4 py-2">
                          <div><Label>Subtopic name</Label><Input value={subTopicForm.topicName} onChange={(event) => setSubTopicForm({ ...subTopicForm, topicName: event.target.value })} className="mt-1.5" /></div>
                          <div><Label>Description</Label><Textarea value={subTopicForm.content} onChange={(event) => setSubTopicForm({ ...subTopicForm, content: event.target.value })} className="mt-1.5" /></div>
                          <div><Label>Order number</Label><Input min="1" type="number" value={subTopicForm.topicOrder} onChange={(event) => setSubTopicForm({ ...subTopicForm, topicOrder: event.target.value })} className="mt-1.5" /></div>
                          <div><Label>Video</Label><Input accept="video/*" type="file" onChange={(event) => setSubTopicForm({ ...subTopicForm, video: event.target.files?.[0] ?? null })} className="mt-1.5" /></div>
                        </div>
                        <DialogFooter className="mt-4">
                          {savingSubTopic && <div className="flex items-center text-xs text-muted-foreground mr-auto"><Loader2 className="animate-spin mr-2 h-3 w-3" /> Finalizing details...</div>}
                          <Button disabled={savingSubTopic} onClick={saveSubTopic} className="bg-[#20c5b1] text-[#071126] shadow-[0_10px_24px_rgba(32,197,177,0.2)] hover:bg-[#1db7a4]">
                            {savingSubTopic ? "Processing..." : "Create subtopic"}
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={editingSubTopic !== null} onOpenChange={(open) => !savingSubTopic && !open && setEditingSubTopic(null)}>
        <DialogContent className="max-w-lg rounded-2xl border-border bg-background shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Update subtopic</DialogTitle>
            <DialogDescription>Edit the learning details without changing the existing video.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Subtopic name</Label>
              <Input value={subTopicForm.topicName} onChange={(event) => setSubTopicForm({ ...subTopicForm, topicName: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={subTopicForm.content} onChange={(event) => setSubTopicForm({ ...subTopicForm, content: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Order number</Label>
              <Input min="1" type="number" value={subTopicForm.topicOrder} onChange={(event) => setSubTopicForm({ ...subTopicForm, topicOrder: event.target.value })} />
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[#b9eee4] bg-[#effdfa] p-3 text-sm text-[#087d70] dark:border-[#20554d] dark:bg-[#0d2f2a] dark:text-[#9bf5e2]" role="alert">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Video update is disabled. The current video will be retained.</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingSubTopic(null)} disabled={savingSubTopic}>Cancel</Button>
            <Button type="button" onClick={updateSubTopicDetails} disabled={savingSubTopic} className="bg-[#20c5b1] text-[#071126] shadow-[0_10px_24px_rgba(32,197,177,0.2)] hover:bg-[#1db7a4]">
              {savingSubTopic ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update subtopic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Deletion Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> 
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="py-3">
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone and will remove all associated content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}