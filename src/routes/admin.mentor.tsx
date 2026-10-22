import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MoreHorizontal, Edit, Trash2, UserCircle, Briefcase, GraduationCap } from "lucide-react";
import { 
  getApiErrorMessage, 
  getMentors, 
  createMentor, 
  updateMentor, 
  deleteMentor, 
  type Mentor, 
  type CreateMentorPayload 
} from "@/api/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner"; // Assuming you use sonner for alerts

export const Route = createFileRoute("/admin/mentor")({ component: AdminMentors });

function AdminMentors() {
  const [q, setQ] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateMentorPayload>({
    name: "",
    email: "",
    mobileNumber: "",
    profileImageUrl: "",
    bio: "",
    designation: "",
    experienceYears: 0,
    qualification: ""
  });

  const loadMentors = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getMentors();
      setMentors(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load the mentor list."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMentors(); }, []);

  const handleOpenForm = (mentor?: Mentor) => {
    if (mentor) {
      setSelectedMentor(mentor);
      setFormData({ ...mentor });
    } else {
      setSelectedMentor(null);
      setFormData({
        name: "", email: "", mobileNumber: "", profileImageUrl: "",
        bio: "", designation: "", experienceYears: 0, qualification: ""
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedMentor) {
        await updateMentor(selectedMentor.id, formData);
        toast.success("Mentor updated successfully");
      } else {
        await createMentor(formData);
        toast.success("Mentor created successfully");
      }
      setIsFormOpen(false);
      loadMentors();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save mentor"));
    }
  };

  const handleDelete = async () => {
    if (!selectedMentor) return;
    try {
      await deleteMentor(selectedMentor.id);
      toast.success("Mentor deleted successfully");
      setIsDeleteOpen(false);
      loadMentors();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete mentor"));
    }
  };

  const filteredMentors = mentors.filter(m =>
    q === "" || m.name.toLowerCase().includes(q.toLowerCase()) || m.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-10">
      {/* Header section */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-navy">Mentors</h1>
          <p className="text-muted-foreground mt-1">{filteredMentors.length} academic experts</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search mentors..." className="pl-10" />
          </div>
          <Button onClick={() => handleOpenForm()} className="bg-navy hover:bg-navy/90">
            <Plus className="h-4 w-4 mr-2" /> Add Mentor
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead className="w-[300px]">Mentor</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground">Loading mentors...</TableCell></TableRow>}
            {!loading && filteredMentors.map(m => (
              <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-navy/10">
                      <AvatarImage src={m.profileImageUrl} />
                      <AvatarFallback className="bg-navy text-white font-bold">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-navy">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                    <div className="text-sm font-medium">{m.designation}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{m.qualification}</div>
                </TableCell>
                <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                        {m.experienceYears} Years Exp.
                    </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedMentor(m); setIsViewOpen(true); }}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleOpenForm(m)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setSelectedMentor(m); setIsDeleteOpen(true); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMentor ? "Edit Mentor" : "Add New Mentor"}</DialogTitle>
            <DialogDescription>Enter the professional details of the academic mentor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Amit Patil" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="amit@dange.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} placeholder="9876543210" />
              </div>
              <div className="space-y-2">
                <Label>Profile Image URL</Label>
                <Input value={formData.profileImageUrl} onChange={e => setFormData({...formData, profileImageUrl: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="Assistant Professor" />
              </div>
              <div className="space-y-2">
                <Label>Experience (Years)</Label>
                <Input type="number" value={formData.experienceYears} onChange={e => setFormData({...formData, experienceYears: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} placeholder="Ph.D. in CS" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Brief professional background..." className="h-24" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-navy">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedMentor && (
            <>
              <DialogHeader className="items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-navy/10 mb-4">
                  <AvatarImage src={selectedMentor.profileImageUrl} />
                  <AvatarFallback className="text-2xl">{selectedMentor.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl font-bold">{selectedMentor.name}</DialogTitle>
                <span className="px-3 py-1 bg-navy/10 text-navy rounded-full text-xs font-bold uppercase tracking-widest">{selectedMentor.designation}</span>
              </DialogHeader>
              <div className="space-y-4 my-4">
                <div className="flex gap-4 items-center p-3 bg-muted rounded-xl">
                    <GraduationCap className="text-navy h-5 w-5" />
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Qualification</p>
                        <p className="text-sm font-medium">{selectedMentor.qualification}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-center p-3 bg-muted rounded-xl">
                    <Briefcase className="text-navy h-5 w-5" />
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Experience</p>
                        <p className="text-sm font-medium">{selectedMentor.experienceYears} Years in Industry</p>
                    </div>
                </div>
                <div className="px-1">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">"{selectedMentor.bio}"</p>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full" variant="secondary" onClick={() => setIsViewOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <b>{selectedMentor?.name}</b> from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Mentor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}