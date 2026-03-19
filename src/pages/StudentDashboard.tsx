import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { exportToCSV, exportToExcel, exportToWord } from "@/lib/exportUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { Progress } from "@/components/ui/progress";
import { Wifi, BarChart3, Download, FileText } from "lucide-react";

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
    <DashboardLayout title="Student Dashboard" subtitle={`Welcome back, ${user!.name}`}>
      <div className="space-y-6">
        {/* Active Sessions */}
        <div className="content-card">
          <h2 className="text-base font-display font-bold text-foreground mb-4">Active Sessions</h2>
          {activeSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Wifi className="h-6 w-6" />
              </div>
              <p className="text-sm">No active sessions right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSessions.map((s) => {
                const subName = getSubjectName(s.subject_code);
                const label = subName ? `${s.subject_code} — ${subName}` : s.subject_code;
                return (
                  <div key={s.id} className="rounded-2xl border border-border bg-background p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-foreground font-semibold text-sm">{label}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Ends in {getRemainingTime(s)}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        Live
                      </span>
                    </div>
                    {messages[s.id] && (
                      <p className={`text-xs rounded-lg px-3 py-1.5 ${messages[s.id].error ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                        {messages[s.id].text}
                      </p>
                    )}
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="8-digit code"
                        value={codes[s.id] || ""}
                        onChange={(e) =>
                          setCodes((c) => ({ ...c, [s.id]: e.target.value.replace(/\D/g, "").slice(0, 8) }))
                        }
                        className="input-field flex-1 !py-2.5"
                      />
                      <button
                        onClick={() => handleMark(s.id, codes[s.id] || "")}
                        disabled={(codes[s.id] || "").length !== 8}
                        className="btn-primary !py-2.5 whitespace-nowrap disabled:opacity-40"
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

        {/* Stats */}
        <div className="content-card">
          <h2 className="text-base font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Attendance Stats
          </h2>
          {subjectStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {subjectStats.map((stat) => (
                <div key={stat.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{stat.name} <span className="text-muted-foreground">({stat.code})</span></span>
                    <span className="text-muted-foreground text-xs">
                      {stat.attended}/{stat.totalSessions} —{" "}
                      <span className={stat.percentage >= 75 ? "text-primary font-semibold" : stat.percentage >= 50 ? "text-warning font-semibold" : "text-destructive font-semibold"}>
                        {stat.percentage}%
                      </span>
                    </span>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="content-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Attendance History
            </h2>
            {myAttendance.length > 0 && (
              <div className="flex gap-2">
                <button onClick={() => exportToCSV(myAttendance, "my_attendance")} className="btn-outline text-xs !px-3 !py-1.5">CSV</button>
                <button onClick={() => exportToExcel(myAttendance, "my_attendance")} className="btn-outline text-xs !px-3 !py-1.5">Excel</button>
                <button onClick={() => exportToWord(myAttendance, "my_attendance")} className="btn-outline text-xs !px-3 !py-1.5">Word</button>
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
                    <th className="text-left py-2.5 font-medium text-xs">Date & Time</th>
                    <th className="text-left py-2.5 font-medium text-xs">Subject</th>
                    <th className="text-left py-2.5 font-medium text-xs">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 text-foreground text-sm">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="py-3 text-foreground text-sm">{e.subject_code}</td>
                      <td className="py-3 text-muted-foreground text-sm">{e.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
