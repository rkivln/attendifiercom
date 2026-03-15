import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { exportToCSV, exportToExcel, exportToWord } from "@/lib/exportUtils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Progress } from "@/components/ui/progress";
import { Wifi, BarChart3 } from "lucide-react";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { getActiveSessions, markAttendance, getStudentAttendance, subjects, sessions } = useAttendance();
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, { text: string; error: boolean }>>({});
  const [, setTick] = useState(0);

  const activeSessions = getActiveSessions();
  const myAttendance = getStudentAttendance(user!.id);

  const subjectStats = useMemo(() => {
    const allSubjectCodes = new Set([
      ...sessions.map((s) => s.subject_code),
      ...myAttendance.map((a) => a.subject_code),
    ]);
    return Array.from(allSubjectCodes).map((code) => {
      const totalSessions = sessions.filter((s) => s.subject_code === code).length;
      const attended = myAttendance.filter((a) => a.subject_code === code).length;
      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      const sub = subjects.find((s) => s.code === code);
      return { code, name: sub?.name || code, totalSessions, attended, percentage };
    });
  }, [sessions, myAttendance, subjects]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getSubjectName = (code: string) => {
    const sub = subjects.find((s) => s.code === code);
    return sub ? sub.name : "";
  };

  const handleMark = async (sessionId: string, verificationCode: string) => {
    if (!verificationCode || verificationCode.length !== 8) return;
    const error = await markAttendance(verificationCode, user!.id, user!.name);
    if (error) {
      setMessages((m) => ({ ...m, [sessionId]: { text: error, error: true } }));
    } else {
      setMessages((m) => ({ ...m, [sessionId]: { text: "Marked!", error: false } }));
      setCodes((c) => ({ ...c, [sessionId]: "" }));
    }
  };

  const getRemainingTime = (s: { start_time: string; duration: number }) => {
    const end = new Date(s.start_time).getTime() + s.duration * 60 * 1000;
    const diff = Math.max(0, end - Date.now());
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-display font-bold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user!.name}.</p>

        {/* Active Sessions with inline code entry */}
        <div className="glass-card p-6 mt-8">
          <h2 className="text-lg font-display font-bold text-foreground mb-4">Active Attendance Sessions</h2>
          {activeSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wifi className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-center">No active sessions right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((s) => {
                const subName = getSubjectName(s.subject_code);
                const label = subName ? `${s.subject_code} (${subName})` : s.subject_code;
                return (
                  <div key={s.id} className="glass-card p-5 space-y-3">
                    <div>
                      <span className="text-foreground font-semibold text-base">{label}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">Ends in: {getRemainingTime(s)}</p>
                    </div>
                    {messages[s.id] && (
                      <p className={`text-sm ${messages[s.id].error ? "text-destructive" : "text-green-400"}`}>
                        {messages[s.id].text}
                      </p>
                    )}
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="8-digit code"
                        value={codes[s.id] || ""}
                        onChange={(e) =>
                          setCodes((c) => ({ ...c, [s.id]: e.target.value.replace(/\D/g, "").slice(0, 8) }))
                        }
                        className="flex-1 px-4 py-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                      <button
                        onClick={() => handleMark(s.id, codes[s.id] || "")}
                        disabled={(codes[s.id] || "").length !== 8}
                        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                      >
                        Mark Present
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div className="glass-card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-foreground">Attendance History</h2>
            {myAttendance.length > 0 && (
              <div className="flex gap-2">
                <button onClick={() => exportToCSV(myAttendance, "my_attendance")} className="px-3 py-1 rounded border border-border text-xs text-foreground hover:bg-secondary transition-colors">CSV</button>
                <button onClick={() => exportToExcel(myAttendance, "my_attendance")} className="px-3 py-1 rounded border border-border text-xs text-foreground hover:bg-secondary transition-colors">Excel</button>
                <button onClick={() => exportToWord(myAttendance, "my_attendance")} className="px-3 py-1 rounded border border-border text-xs text-foreground hover:bg-secondary transition-colors">Word</button>
              </div>
            )}
          </div>
          {myAttendance.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendance records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2">Date & Time</th>
                    <th className="text-left py-2">Subject</th>
                    <th className="text-left py-2">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.map((e) => (
                    <tr key={e.id} className="border-b border-border/30">
                      <td className="py-3 text-foreground">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="py-3 text-foreground">{e.subject_code}</td>
                      <td className="py-3 text-muted-foreground">{e.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
