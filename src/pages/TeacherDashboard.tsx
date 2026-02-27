import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { exportToCSV, exportToExcel, exportToWord } from "@/lib/exportUtils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Clock, Wifi, KeyRound, Trash2, FileSpreadsheet } from "lucide-react";

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

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectCode && subjectName) {
      addSubject(subjectCode, subjectName, user!.id);
      setSubjectCode("");
      setSubjectName("");
    }
  };

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubject && verificationCode.length === 8) {
      startSession(selectedSubject, parseInt(duration), verificationCode, user!.id);
      setVerificationCode("");
    }
  };

  const getRemainingTime = (session: { startTime: number; duration: number }) => {
    const end = session.startTime + session.duration * 60 * 1000;
    const remaining = Math.max(0, end - Date.now());
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Teacher Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Create Subject */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Create Subject</h2>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Subject Code</label>
                <input
                  type="text" placeholder="CS101" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Subject Name</label>
                <input
                  type="text" placeholder="Data Structures" value={subjectName} onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                Add Subject
              </button>
            </form>
          </div>

          {/* Live Sessions */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Live Sessions</h2>
            {liveSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-50" />
                <p>No active sessions currently.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2">Subject</th>
                      <th className="text-left py-2">Code</th>
                      <th className="text-left py-2">End Time</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveSessions.map((s) => (
                      <tr key={s.id} className="border-b border-border/30">
                        <td className="py-3 text-foreground">{s.subjectCode}</td>
                        <td className="py-3 text-foreground font-mono">{s.verificationCode}</td>
                        <td className="py-3 text-foreground">{getRemainingTime(s)}</td>
                        <td className="py-3">
                          <button
                            onClick={() => exportToCSV(getSessionAttendance(s.id), s.subjectCode)}
                            className="flex items-center gap-1 px-3 py-1 rounded border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                          >
                            <FileSpreadsheet className="h-3 w-3" /> Export CSV
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Initiate Session */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Initiate Session</h2>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">Please create a subject first.</p>
            ) : (
              <form onSubmit={handleStartSession} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Select Subject</label>
                  <select
                    value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.code}>{s.code} ({s.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Duration (Minutes)</label>
                  <input
                    type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1"
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Verification Code (8 digits)</label>
                  <input
                    type="text" placeholder="e.g. 12345678" value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button type="submit" disabled={!selectedSubject || verificationCode.length !== 8}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Start Timer
                </button>
              </form>
            )}
          </div>

          {/* Your Subjects */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Your Subjects</h2>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No subjects created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.map((s) => (
                  <div key={s.id} className="glass-card p-4">
                    <h3 className="font-display font-bold text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.code}</p>
                    <button
                      onClick={() => deleteSubject(s.id)}
                      className="mt-2 flex items-center gap-1 px-2 py-1 rounded text-xs text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Export All */}
        <div className="glass-card p-6 mt-6">
          <h2 className="text-lg font-display font-bold text-foreground mb-4">Export All Attendance</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => exportToCSV(getSessionAttendance(""), "all_attendance")} className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition-colors">
              This exports per-session. Use the buttons above.
            </button>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {liveSessions.map((s) => (
              <div key={s.id} className="flex gap-2">
                <span className="text-sm text-muted-foreground self-center">{s.subjectCode}:</span>
                <button onClick={() => exportToCSV(getSessionAttendance(s.id), s.subjectCode)} className="px-3 py-1 rounded border border-border text-xs text-foreground hover:bg-secondary transition-colors">CSV</button>
                <button onClick={() => exportToExcel(getSessionAttendance(s.id), s.subjectCode)} className="px-3 py-1 rounded border border-border text-xs text-foreground hover:bg-secondary transition-colors">Excel</button>
                <button onClick={() => exportToWord(getSessionAttendance(s.id), s.subjectCode)} className="px-3 py-1 rounded border border-border text-xs text-foreground hover:bg-secondary transition-colors">Word</button>
              </div>
            ))}
            {liveSessions.length === 0 && <p className="text-sm text-muted-foreground">Start a session to export attendance data.</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherDashboard;
