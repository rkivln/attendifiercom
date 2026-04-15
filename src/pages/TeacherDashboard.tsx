import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { exportToCSV, exportToExcel, exportToWord } from "@/lib/exportUtils";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Clock, Trash2, FileSpreadsheet, BookOpen, Play, Download,
  Plus, Users, Copy, Megaphone, Link2, ChevronDown, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const {
    addSubject, deleteSubject, startSession,
    getTeacherSubjects, getTeacherSessions, getSessionAttendance,
    createClassroom, getTeacherClassrooms, getClassroomMembers,
    getClassroomSubjects, getClassroomSessions, getClassroomAnnouncements,
    createAnnouncement, deleteAnnouncement, removeStudent,
  } = useAttendance();

  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [selectedClassroomForSubject, setSelectedClassroomForSubject] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [duration, setDuration] = useState("10");
  const [gracePeriod, setGracePeriod] = useState("5");
  const [verificationCode, setVerificationCode] = useState("");
  const [classroomName, setClassroomName] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [selectedClassroomForAnn, setSelectedClassroomForAnn] = useState("");
  const [expandedClassroom, setExpandedClassroom] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const myClassrooms = getTeacherClassrooms(user!.id);
  const subjects = getTeacherSubjects(user!.id);
  const liveSessions = getTeacherSessions(user!.id);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomName.trim()) return;
    const classroom = await createClassroom(classroomName.trim(), user!.id);
    if (classroom) {
      toast.success(`Classroom "${classroom.name}" created!`);
      setClassroomName("");
    } else {
      toast.error("Failed to create classroom. Please try again.");
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const link = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectCode && subjectName) {
      await addSubject(subjectCode, subjectName, user!.id, selectedClassroomForSubject || undefined);
      setSubjectCode("");
      setSubjectName("");
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubject && verificationCode.length === 8) {
      await startSession(selectedSubject, parseInt(duration), verificationCode, user!.id, parseInt(gracePeriod));
      setVerificationCode("");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroomForAnn || !announcementTitle.trim() || !announcementContent.trim()) return;
    await createAnnouncement(selectedClassroomForAnn, user!.id, announcementTitle.trim(), announcementContent.trim());
    setAnnouncementTitle("");
    setAnnouncementContent("");
    toast.success("Announcement posted!");
  };

  const getRemainingTime = (session: { start_time: string; duration: number }) => {
    const end = new Date(session.start_time).getTime() + session.duration * 60 * 1000;
    const remaining = Math.max(0, end - Date.now());
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <DashboardLayout title="Teacher Dashboard" subtitle="Manage your classrooms and sessions">
      <div className="space-y-6">
        {/* Classrooms Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Classroom */}
          <div className="content-card">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
              <Plus className="h-4 w-4 text-primary" />
              Create Classroom
            </h2>
            <form onSubmit={handleCreateClassroom} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Classroom Name</label>
                <input type="text" placeholder="e.g. CS-101 Section A" value={classroomName}
                  onChange={(e) => setClassroomName(e.target.value)} className="input-field" />
              </div>
              <button type="submit" className="btn-primary w-full">Create Classroom</button>
            </form>
          </div>

          {/* My Classrooms */}
          <div className="content-card">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
              <Users className="h-4 w-4 text-primary" />
              My Classrooms
            </h2>
            {myClassrooms.length === 0 ? (
              <p className="text-muted-foreground text-sm">No classrooms yet.</p>
            ) : (
              <div className="space-y-2">
                {myClassrooms.map((c) => {
                  const members = getClassroomMembers(c.id);
                  const isExpanded = expandedClassroom === c.id;
                  return (
                    <div key={c.id} className="rounded-lg border border-border bg-muted/50">
                      <button
                        onClick={() => setExpandedClassroom(isExpanded ? null : c.id)}
                        className="w-full flex items-center justify-between px-4 py-3"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-sm text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{members.length} student{members.length !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyInviteLink(c.invite_code); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Link2 className="h-3 w-3" /> Invite
                          </button>
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
                          <p className="text-xs text-muted-foreground">
                            Invite code: <span className="font-mono text-foreground">{c.invite_code}</span>
                          </p>
                          {members.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No students yet.</p>
                          ) : (
                            <div className="space-y-1">
                              {members.map((m) => (
                                <div key={m.id} className="flex items-center justify-between text-sm">
                                  <span className="text-foreground">{m.student_id.slice(0, 8)}...</span>
                                  <button
                                    onClick={() => removeStudent(c.id, m.student_id)}
                                    className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Subject */}
          <div className="content-card">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
              <BookOpen className="h-4 w-4 text-primary" />
              Create Subject
            </h2>
            <form onSubmit={handleAddSubject} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Classroom</label>
                <select value={selectedClassroomForSubject} onChange={(e) => setSelectedClassroomForSubject(e.target.value)} className="input-field">
                  <option value="">No classroom (global)</option>
                  {myClassrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Subject Code</label>
                <input type="text" placeholder="CS101" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Subject Name</label>
                <input type="text" placeholder="Data Structures" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="input-field" />
              </div>
              <button type="submit" className="btn-primary w-full">Add Subject</button>
            </form>
          </div>

          {/* Start Session */}
          <div className="content-card">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
              <Play className="h-4 w-4 text-primary" />
              Start Session
            </h2>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">Create a subject first.</p>
            ) : (
              <form onSubmit={handleStartSession} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="input-field">
                    <option value="">Select...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.code}>{s.code} ({s.name})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Duration (min)</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Grace Period (min)</label>
                    <input type="number" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} min="0" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Verification Code (8 digits)</label>
                  <input type="text" placeholder="e.g. 12345678" value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 8))} className="input-field" />
                </div>
                <button type="submit" disabled={!selectedSubject || verificationCode.length !== 8} className="btn-primary w-full disabled:opacity-40">
                  Start Timer
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Live Sessions */}
        <div className="content-card">
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
            <Clock className="h-4 w-4 text-primary" />
            Live Sessions
          </h2>
          {liveSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="h-12 w-12 rounded-lg frosted-surface flex items-center justify-center mb-3">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm">No active sessions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveSessions.map((s) => {
                const attendance = getSessionAttendance(s.id);
                const lateCount = attendance.filter(a => a.is_late).length;
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground">{s.subject_code}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full frosted-surface text-primary text-xs font-medium">
                        {getRemainingTime(s)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Code: <span className="font-mono text-foreground">{s.verification_code}</span>
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{attendance.length} present · {lateCount} late</span>
                      <div className="flex gap-1">
                        <button onClick={() => exportToCSV(attendance, s.subject_code)} className="btn-outline text-xs !px-2 !py-1">CSV</button>
                        <button onClick={() => exportToExcel(attendance, s.subject_code)} className="btn-outline text-xs !px-2 !py-1">Excel</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="content-card">
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 tracking-tight">
            <Megaphone className="h-4 w-4 text-primary" />
            Post Announcement
          </h2>
          <form onSubmit={handleCreateAnnouncement} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Classroom</label>
              <select value={selectedClassroomForAnn} onChange={(e) => setSelectedClassroomForAnn(e.target.value)} className="input-field">
                <option value="">Select...</option>
                {myClassrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
              <input type="text" placeholder="Announcement title" value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Content</label>
              <textarea placeholder="Write your announcement..." value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)} className="input-field min-h-[80px]" />
            </div>
            <button type="submit" disabled={!selectedClassroomForAnn || !announcementTitle.trim()}
              className="btn-primary w-full disabled:opacity-40">Post Announcement</button>
          </form>
        </div>

        {/* Your Subjects */}
        <div className="content-card">
          <h2 className="text-base font-bold text-foreground mb-4 tracking-tight">Your Subjects</h2>
          {subjects.length === 0 ? (
            <p className="text-muted-foreground text-sm">No subjects created yet.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map((s) => {
                const cls = myClassrooms.find(c => c.id === s.classroom_id);
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.code} {cls ? `· ${cls.name}` : ""}
                      </p>
                    </div>
                    <button onClick={() => deleteSubject(s.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
