import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react"; // Added useMemo
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Loader2, Video, Eye, Trash2, AlertTriangle, Search } from "lucide-react"; // Added Search icon
import { toast } from "sonner";
import { 
  createCourse, 
  updateCourse, 
  deleteCourse as deleteCourseApi,
  getApiErrorMessage, 
  getCourses, 
  getMentors, 
  uploadVideo, 
  type StudentCourse, 
  type Mentor 
} from "@/api/api";

export const Route = createFileRoute("/admin/courses")({ component: AdminCourses });

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
      <p className="font-semibold text-navy">Uploading Video...</p>
    </div>
  );
};

const CATEGORIES = [
  "STANDARD_1", "STANDARD_2", "STANDARD_3", "STANDARD_4", "STANDARD_5",
  "STANDARD_6", "STANDARD_7", "STANDARD_8", "STANDARD_9", "STANDARD_10",
  "STANDARD_11", "STANDARD_12", "DIPLOMA", "ENGINEERING"
];

function AdminCourses() {
  const location = useLocation();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [selectedCourse, setSelectedCourse] = useState<StudentCourse | null>(null);

  // Deletion States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<StudentCourse | null>(null);

  const [form, setForm] = useState({
    courseName: "", description: "", price: "", originalPrice: "", 
    courseValidity: "12", status: "ACTIVE", introVideo: null as File | null,
    mentorId: "", thumbnail: "", category: "", introVideoUid: ""
  });

  // Filtered Courses logic
  const filteredCourses = useMemo(() => {
    return courses.filter(course => 
      course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const mentorData = await getMentors();
        setMentors(mentorData || []);
        const courseData = await getCourses();
        setCourses(courseData);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load data."));
      } finally {
        setLoading(false);
      }
    };
    void loadInitialData();
  }, []);

  if (location.pathname !== "/admin/courses") return <Outlet />;

  const handleOpenCreate = () => {
    setSelectedCourse(null);
    setForm({ 
        courseName: "", description: "", price: "", originalPrice: "", 
        courseValidity: "12", status: "ACTIVE", introVideo: null,
        mentorId: "", 
        thumbnail: "", category: "", introVideoUid: ""
    });
    setCreateOpen(true);
  };

  const handleOpenUpdate = (course: any) => {
    setSelectedCourse(course);
    setForm({
      courseName: course.courseName,
      description: course.description,
      price: String(course.price),
      originalPrice: String(course.originalPrice || ""),
      courseValidity: String(course.courseValidity),
      status: course.status,
      introVideo: null,
      mentorId: String(course.mentorId || ""),
      thumbnail: course.courseThumbnailUrl || "",
      category: course.category || "",
      introVideoUid: course.introVideoUid
    });
    setCreateOpen(true);
  };

  const submitCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setCreating(true);
      let videoUid = form.introVideoUid;

      if (form.introVideo) {
        setUploadProgress(0);
        videoUid = await uploadVideo(form.introVideo, (p) => setUploadProgress(p));
      }

      const payload = {
        courseName: form.courseName.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        courseValidity: Number(form.courseValidity),
        status: form.status,
        introVideoUid: videoUid,
        mentorId: Number(form.mentorId),
        courseThumbnailUrl: form.thumbnail.trim(),
        category: form.category,
      };

      if (selectedCourse) {
        const updated = await updateCourse(selectedCourse.id, payload);
        setCourses(courses.map(c => c.id === updated.id ? updated : c));
        toast.success("Course updated successfully.");
      } else {
        const created = await createCourse(payload as any);
        setCourses([...courses, created]);
        toast.success("Course created successfully.");
      }
      setCreateOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Operation failed."));
    } finally {
      setCreating(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteRequest = (course: StudentCourse) => {
    if (course.enrolledCount > 0) {
      toast.error(`Cannot delete "${course.courseName}" because it has ${course.enrolledCount} enrolled students.`);
      return;
    }
    setCourseToDelete(course);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!courseToDelete) return;
    try {
      setDeleting(true);
      await deleteCourseApi(courseToDelete.id);
      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      toast.success("Course deleted successfully.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete course."));
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setCourseToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,197,177,0.08),_transparent_35%)] p-6 sm:p-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-[#101827] dark:text-foreground">Courses</h1>
          <p className="mt-1 text-muted-foreground">{courses.length} courses managed</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by course name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleOpenCreate} className="shrink-0 bg-[#20c5b1] text-[#071126] shadow-[0_10px_24px_rgba(32,197,177,0.2)] hover:bg-[#1db7a4]"><Plus className="mr-2 h-4 w-4" /> Create course</Button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={(val) => !creating && setCreateOpen(val)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border-[#dcefeb] bg-background shadow-[0_24px_70px_rgba(15,23,42,0.16)] dark:border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#101827] dark:text-foreground">{selectedCourse ? `Update: ${selectedCourse.courseName}` : "Create new course"}</DialogTitle>
          </DialogHeader>

          {creating && form.introVideo ? (
            <CircularProgress value={uploadProgress} />
          ) : (
            <form onSubmit={submitCourse} className="space-y-5 pt-4">
              {creating && <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin mr-2" /> Saving details...</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Course name</Label><Input required value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Category</Label>
                  <Select onValueChange={(val) => setForm({...form, category: val})} value={form.category}>
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Price (MRP)</Label><Input required type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Discounted Price</Label><Input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Mentor</Label>
                    <Select onValueChange={(val) => setForm({...form, mentorId: val})} value={form.mentorId}>
                        <SelectTrigger><SelectValue placeholder="Select Mentor" /></SelectTrigger>
                        <SelectContent>{mentors.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5"><Label>Validity (months)</Label><Input required type="number" value={form.courseValidity} onChange={(e) => setForm({ ...form, courseValidity: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Thumbnail URL</Label><Input required value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2"><Video className="h-4 w-4" /> Introductory Video {selectedCourse && "(Optional)"}</Label>
                <Input accept="video/*" type="file" onChange={(e) => setForm({ ...form, introVideo: e.target.files?.[0] ?? null })} />
                {selectedCourse && <p className="text-[10px] text-muted-foreground">Keep empty to retain existing video</p>}
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={creating} className="bg-[#20c5b1] text-[#071126] shadow-[0_10px_24px_rgba(32,197,177,0.2)] hover:bg-[#1db7a4]">{selectedCourse ? "Update Course" : "Create Course"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-2xl border border-[#dcefeb] bg-card shadow-[0_12px_35px_rgba(15,23,42,0.05)] dark:border-border">
        <Table>
          <TableHeader><TableRow className="bg-secondary/50"><TableHead>Course</TableHead><TableHead>Category</TableHead><TableHead className="text-center">Enrollments</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Loading...</TableCell></TableRow> : 
              filteredCourses.length === 0 ? <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No courses found matching your search.</TableCell></TableRow> :
              filteredCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell><div className="font-medium">{course.courseName}</div><div className="text-[10px] uppercase text-muted-foreground">{course.status}</div></TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{course.category}</Badge></TableCell>
                <TableCell className="text-center">{course.enrolledCount}</TableCell>
                <TableCell><div className="text-sm font-bold">₹{course.price}</div></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenUpdate(course)} title="Update Details"><Eye className="h-4 w-4 text-blue-600" /></Button>
                    <Link to="/admin/courses/$courseId" params={{ courseId: String(course.id) }}><Button variant="ghost" size="icon" title="Edit Content"><Pencil className="h-4 w-4" /></Button></Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(course)} title="Delete Course" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="py-4">
              Are you sure you want to delete <b>{courseToDelete?.courseName}</b>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete} disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin h-4 w-4" /> : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}