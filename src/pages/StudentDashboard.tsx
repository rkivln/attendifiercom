import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { exportToCSV, exportToExcel, exportToWord } from "@/lib/exportUtils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Wifi, KeyRound } from "lucide-react";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { getActiveSessions, markAttendance, getStudentAttendance } = useAttendance();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const activeSessions = getActiveSessions();
  const myAttendance = getStudentAttendance(user!.id);

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const error = markAttendance(code, user!.id, user!.name);
    if (error) {
      setMessage({ text: error, error: true });
    } else {
      setMessage({ text: "Attendance marked successfully!", error: false });
      setCode("");
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-display font-bold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user!.name}.</p>

        {/* Active Sessions */}
        <div className="glass-card p-6 mt-8">
          <h2 className="text-lg font-display font-bold text-foreground mb-4">Live Sessions</h2>
          {activeSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wifi className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-center">No live sessions right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map((s) => {
                const remaining = Math.max(0, Math.ceil((s.startTime + s.duration * 60 * 1000 - Date.now()) / 60000));
                return (
                  <div key={s.id} className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <span className="text-foreground font-semibold">{s.subjectCode}</span>
                      <span className="ml-3 text-xs text-green-400 animate-pulse">● Live</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{remaining} min left</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Verification Code - only when sessions are active */}
        {activeSessions.length > 0 && (
          <div className="glass-card p-6 mt-6">
            <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2 mb-2">
              <KeyRound className="h-5 w-5 text-primary" /> Mark Attendance
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the 8-digit code shared by your teacher to mark attendance.
            </p>
            {message && (
              <p className={`text-sm mb-3 ${message.error ? "text-destructive" : "text-green-400"}`}>{message.text}</p>
            )}
            <form onSubmit={handleMarkAttendance} className="flex gap-3">
              <input
                type="text" placeholder="Enter 8-digit code" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="flex-1 px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button type="submit" disabled={code.length !== 8}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Submit
              </button>
            </form>
          </div>
        )}

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
                      <td className="py-3 text-foreground">{new Date(e.timestamp).toLocaleString()}</td>
                      <td className="py-3 text-foreground">{e.subjectCode}</td>
                      <td className="py-3 text-muted-foreground">{e.ipAddress}</td>
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
