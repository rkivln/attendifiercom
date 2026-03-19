import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { exportToCSV, exportToExcel, exportToWord } from "@/lib/exportUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { Clock, Trash2, FileSpreadsheet, BookOpen, Play, Download } from "lucide-react";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const {
    addSubject, deleteSubject, startSession,
    getTeacherSubjects, getTeacherSessions, getSessionAttendance,
  } = useAttendance();

  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [duration, setDuration] = useState("10");
  const [verificationCode, setVerificationCode] = useState("");
  const [, setTick] = useState(0);

  const subjects = getTeacherSubjects(user!.id);
  const liveSessions = getTeacherSessions(user!.id);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectCode && subjectName) {
      await addSubject(subjectCode, subjectName, user!.id);
      setSubjectCode("");
      setSubjectName("");
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubject && verificationCode.length === 8) {
      await startSession(selectedSubject, parseInt(duration), verificationCode, user!.id);
      setVerificationCode("");
    }
  };

  const getRemainingTime = (session: { start_time: string; duration: number }) => {
    const end = new Date(session.start_time).getTime() + session.duration * 60 * 1000;
    const remaining = Math.max(0, end - Date.now());
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <DashboardLayout title="Teacher Dashboard" subtitle={`Manage your classes`}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Subject */}
          <div className="content-card">
            <h2 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Create Subject
            </h2>
            <form onSubmit={handleAddSubject} className="space-y-3">
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

          {/* Live Sessions */}
          <div className="content-card">
            <h2 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Live Sessions
            </h2>
            {liveSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="text-sm">No active sessions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveSessions.map((s) => (
                  <div key={s.id} className="rounded-2xl border border-border bg-background p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.subject_code}</p>
                      <p className="text-xs text-muted-foreground">Code: <span className="font-mono">{s.verification_code}</span> · {getRemainingTime(s)}</p>
                    </div>
                    <button onClick={() => exportToCSV(getSessionAttendance(s.id), s.subject_code)} className="btn-outline text-xs !px-3 !py-1.5 flex items-center gap-1">
                      <FileSpreadsheet className="h-3 w-3" /> CSV
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Initiate Session */}
          <div className="content-card">
            <h2 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Duration (Minutes)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" className="input-field" />
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

          {/* Your Subjects */}
          <div className="content-card">
            <h2 className="text-base font-display font-bold text-foreground mb-4">Your Subjects</h2>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No subjects created yet.</p>
            ) : (
              <div className="space-y-2">
                {subjects.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.code}</p>
                    </div>
                    <button onClick={() => deleteSubject(s.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Export All */}
        <div className="content-card">
          <h2 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Export Attendance
          </h2>
          <div className="flex flex-wrap gap-3">
            {liveSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{s.subject_code}:</span>
                <button onClick={() => exportToCSV(getSessionAttendance(s.id), s.subject_code)} className="btn-outline text-xs !px-3 !py-1.5">CSV</button>
                <button onClick={() => exportToExcel(getSessionAttendance(s.id), s.subject_code)} className="btn-outline text-xs !px-3 !py-1.5">Excel</button>
                <button onClick={() => exportToWord(getSessionAttendance(s.id), s.subject_code)} className="btn-outline text-xs !px-3 !py-1.5">Word</button>
              </div>
            ))}
            {liveSessions.length === 0 && <p className="text-sm text-muted-foreground">Start a session to export attendance data.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
