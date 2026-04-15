import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, TrendingUp, Users, Clock, BookOpen } from "lucide-react";
import { exportToCSV, exportToExcel, exportToWord } from "@/lib/exportUtils";

const COLORS = ["#0099ff", "#00cc88", "#ff6b6b", "#ffa726", "#ab47bc"];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const {
    getTeacherClassrooms, getClassroomSubjects, getClassroomSessions,
    getSessionAttendance, getClassroomMembers, sessions, attendanceEntries, subjects,
  } = useAttendance();

  const [selectedClassroom, setSelectedClassroom] = useState<string>("all");

  const teacherClassrooms = useMemo(() => user ? getTeacherClassrooms(user.id) : [], [user, getTeacherClassrooms]);

  const filteredSubjects = useMemo(() => {
    if (!user) return [];
    if (selectedClassroom === "all") return subjects.filter(s => s.teacher_id === user.id);
    return getClassroomSubjects(selectedClassroom);
  }, [user, selectedClassroom, subjects, getClassroomSubjects]);

  const filteredSessions = useMemo(() => {
    if (!user) return [];
    if (selectedClassroom === "all") return sessions.filter(s => s.teacher_id === user.id);
    return getClassroomSessions(selectedClassroom);
  }, [user, selectedClassroom, sessions, getClassroomSessions]);

  const filteredEntries = useMemo(() => {
    const sessionIds = new Set(filteredSessions.map(s => s.id));
    return attendanceEntries.filter(e => sessionIds.has(e.session_id));
  }, [filteredSessions, attendanceEntries]);

  // Per-subject attendance rate
  const subjectBreakdown = useMemo(() => {
    return filteredSubjects.map(sub => {
      const subSessions = filteredSessions.filter(s => s.subject_code === sub.code);
      const subEntries = filteredEntries.filter(e => e.subject_code === sub.code);
      const totalStudents = selectedClassroom !== "all"
        ? getClassroomMembers(selectedClassroom).length
        : Math.max(1, new Set(subEntries.map(e => e.student_id)).size);
      const expectedTotal = subSessions.length * Math.max(totalStudents, 1);
      const rate = expectedTotal > 0 ? Math.round((subEntries.length / expectedTotal) * 100) : 0;
      const lateCount = subEntries.filter(e => e.is_late).length;
      return {
        name: sub.name,
        code: sub.code,
        sessions: subSessions.length,
        attendance: subEntries.length,
        rate: Math.min(rate, 100),
        late: lateCount,
        onTime: subEntries.length - lateCount,
      };
    });
  }, [filteredSubjects, filteredSessions, filteredEntries, selectedClassroom, getClassroomMembers]);

  // Daily attendance trend (last 30 days)
  const trendData = useMemo(() => {
    const days: Record<string, { date: string; count: number; late: number }> = {};
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: 0, late: 0 };
    }
    filteredEntries.forEach(e => {
      const key = new Date(e.created_at).toISOString().slice(0, 10);
      if (days[key]) {
        days[key].count++;
        if (e.is_late) days[key].late++;
      }
    });
    return Object.values(days);
  }, [filteredEntries]);

  // On-time vs Late pie
  const punctualityData = useMemo(() => {
    const late = filteredEntries.filter(e => e.is_late).length;
    const onTime = filteredEntries.length - late;
    return [
      { name: "On Time", value: onTime },
      { name: "Late", value: late },
    ];
  }, [filteredEntries]);

  // Summary stats
  const stats = useMemo(() => ({
    totalSessions: filteredSessions.length,
    totalEntries: filteredEntries.length,
    avgRate: subjectBreakdown.length > 0
      ? Math.round(subjectBreakdown.reduce((a, b) => a + b.rate, 0) / subjectBreakdown.length)
      : 0,
    latePercent: filteredEntries.length > 0
      ? Math.round((filteredEntries.filter(e => e.is_late).length / filteredEntries.length) * 100)
      : 0,
  }), [filteredSessions, filteredEntries, subjectBreakdown]);

  const handleExport = (format: "csv" | "excel" | "word") => {
    const classroomName = selectedClassroom === "all" ? "All_Classrooms" : teacherClassrooms.find(c => c.id === selectedClassroom)?.name || "Report";
    const filename = `Attendance_Report_${classroomName}`;
    if (format === "csv") exportToCSV(filteredEntries, filename);
    else if (format === "excel") exportToExcel(filteredEntries, filename);
    else exportToWord(filteredEntries, filename);
  };

  return (
    <DashboardLayout title="Analytics" subtitle="Attendance trends and reports">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select classroom" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classrooms</SelectItem>
            {teacherClassrooms.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("word")}>
            <Download className="h-4 w-4 mr-1" /> Word
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
              <p className="text-xs text-muted-foreground">Total Sessions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalEntries}</p>
              <p className="text-xs text-muted-foreground">Total Entries</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgRate}%</p>
              <p className="text-xs text-muted-foreground">Avg Attendance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.latePercent}%</p>
              <p className="text-xs text-muted-foreground">Late Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Attendance Trend */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Attendance Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" name="Total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="late" name="Late" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Per-Subject Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Rate by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={subjectBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="rate" name="Attendance %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Punctuality Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Punctuality Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={punctualityData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--destructive))" />
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-Subject Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject-wise Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Subject</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Sessions</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">On Time</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Late</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {subjectBreakdown.map(sub => (
                  <tr key={sub.code} className="border-b last:border-0">
                    <td className="py-2.5 px-3 font-medium">{sub.name} <span className="text-muted-foreground">({sub.code})</span></td>
                    <td className="py-2.5 px-3 text-center">{sub.sessions}</td>
                    <td className="py-2.5 px-3 text-center text-primary">{sub.onTime}</td>
                    <td className="py-2.5 px-3 text-center text-destructive">{sub.late}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${sub.rate >= 75 ? "bg-primary/10 text-primary" : sub.rate >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-destructive/10 text-destructive"}`}>
                        {sub.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {subjectBreakdown.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
