import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Subject {
  id: string;
  code: string;
  name: string;
  teacher_id: string;
}

export interface Session {
  id: string;
  subject_code: string;
  verification_code: string;
  start_time: string;
  duration: number;
  teacher_id: string;
  active: boolean;
}

export interface AttendanceEntry {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  subject_code: string;
  created_at: string;
  ip_address: string;
}

interface AttendanceContextType {
  subjects: Subject[];
  sessions: Session[];
  attendanceEntries: AttendanceEntry[];
  addSubject: (code: string, name: string, teacherId: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  startSession: (subjectCode: string, duration: number, verificationCode: string, teacherId: string) => Promise<void>;
  markAttendance: (verificationCode: string, studentId: string, studentName: string) => Promise<string | null>;
  getTeacherSubjects: (teacherId: string) => Subject[];
  getActiveSessions: () => Session[];
  getTeacherSessions: (teacherId: string) => Session[];
  getStudentAttendance: (studentId: string) => AttendanceEntry[];
  getSessionAttendance: (sessionId: string) => AttendanceEntry[];
  refreshData: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export const useAttendance = () => {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
};

const isSessionActive = (session: { start_time: string; duration: number; active: boolean }) => {
  if (!session.active) return false;
  const endTime = new Date(session.start_time).getTime() + session.duration * 60 * 1000;
  return Date.now() < endTime;
};

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);

  const fetchAll = useCallback(async () => {
    const [subRes, sesRes, attRes] = await Promise.all([
      supabase.from("subjects").select("*"),
      supabase.from("sessions").select("*"),
      supabase.from("attendance_entries").select("*"),
    ]);
    if (subRes.data) setSubjects(subRes.data as Subject[]);
    if (sesRes.data) setSessions(sesRes.data as Session[]);
    if (attRes.data) setAttendanceEntries(attRes.data as AttendanceEntry[]);
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("attendance_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_entries" }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // Check for expired sessions every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const expired = sessions.filter(
        (s) => s.active && !isSessionActive(s)
      );
      for (const s of expired) {
        await supabase.from("sessions").update({ active: false }).eq("id", s.id);
      }
      if (expired.length > 0) fetchAll();
    }, 5000);
    return () => clearInterval(interval);
  }, [sessions, fetchAll]);

  const addSubject = async (code: string, name: string, teacherId: string) => {
    await supabase.from("subjects").insert({ code, name, teacher_id: teacherId });
    await fetchAll();
  };

  const deleteSubject = async (id: string) => {
    await supabase.from("subjects").delete().eq("id", id);
    await fetchAll();
  };

  const startSession = async (subjectCode: string, duration: number, verificationCode: string, teacherId: string) => {
    await supabase.from("sessions").insert({
      subject_code: subjectCode,
      verification_code: verificationCode,
      duration,
      teacher_id: teacherId,
      active: true,
    });
    await fetchAll();
  };

  const markAttendance = async (verificationCode: string, studentId: string, studentName: string): Promise<string | null> => {
    const session = sessions.find((s) => isSessionActive(s) && s.verification_code === verificationCode);
    if (!session) return "Invalid or expired verification code.";

    const alreadyMarked = attendanceEntries.find(
      (e) => e.session_id === session.id && e.student_id === studentId
    );
    if (alreadyMarked) return "Attendance already marked for this session.";

    const { error } = await supabase.from("attendance_entries").insert({
      session_id: session.id,
      student_id: studentId,
      student_name: studentName,
      subject_code: session.subject_code,
    });
    if (error) return error.message;
    await fetchAll();
    return null;
  };

  const getTeacherSubjects = (teacherId: string) => subjects.filter((s) => s.teacher_id === teacherId);
  const getActiveSessions = () => sessions.filter(isSessionActive);
  const getTeacherSessions = (teacherId: string) => sessions.filter((s) => s.teacher_id === teacherId && isSessionActive(s));
  const getStudentAttendance = (studentId: string) => attendanceEntries.filter((e) => e.student_id === studentId);
  const getSessionAttendance = (sessionId: string) => attendanceEntries.filter((e) => e.session_id === sessionId);

  return (
    <AttendanceContext.Provider
      value={{
        subjects, sessions, attendanceEntries,
        addSubject, deleteSubject, startSession, markAttendance,
        getTeacherSubjects, getActiveSessions, getTeacherSessions,
        getStudentAttendance, getSessionAttendance, refreshData: fetchAll,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};
