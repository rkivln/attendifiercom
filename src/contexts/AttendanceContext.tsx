import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Subject {
  id: string;
  code: string;
  name: string;
  teacherId: string;
}

export interface Session {
  id: string;
  subjectCode: string;
  verificationCode: string;
  startTime: number;
  duration: number; // minutes
  teacherId: string;
  active: boolean;
}

export interface AttendanceEntry {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  subjectCode: string;
  timestamp: number;
  ipAddress: string;
}

interface AttendanceContextType {
  subjects: Subject[];
  sessions: Session[];
  attendanceEntries: AttendanceEntry[];
  addSubject: (code: string, name: string, teacherId: string) => void;
  deleteSubject: (id: string) => void;
  startSession: (subjectCode: string, duration: number, verificationCode: string, teacherId: string) => void;
  markAttendance: (verificationCode: string, studentId: string, studentName: string) => string | null;
  getTeacherSubjects: (teacherId: string) => Subject[];
  getActiveSessions: () => Session[];
  getTeacherSessions: (teacherId: string) => Session[];
  getStudentAttendance: (studentId: string) => AttendanceEntry[];
  getSessionAttendance: (sessionId: string) => AttendanceEntry[];
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export const useAttendance = () => {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
};

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    JSON.parse(localStorage.getItem("attendifier_subjects") || "[]")
  );
  const [sessions, setSessions] = useState<Session[]>(() =>
    JSON.parse(localStorage.getItem("attendifier_sessions") || "[]")
  );
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>(() =>
    JSON.parse(localStorage.getItem("attendifier_attendance") || "[]")
  );

  // Check expired sessions every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.active && Date.now() > s.startTime + s.duration * 60 * 1000) {
            return { ...s, active: false };
          }
          return s;
        });
        if (JSON.stringify(updated) !== JSON.stringify(prev)) {
          localStorage.setItem("attendifier_sessions", JSON.stringify(updated));
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const persist = (key: string, data: unknown) => localStorage.setItem(key, JSON.stringify(data));

  const addSubject = (code: string, name: string, teacherId: string) => {
    const newSubject: Subject = { id: crypto.randomUUID(), code, name, teacherId };
    const updated = [...subjects, newSubject];
    setSubjects(updated);
    persist("attendifier_subjects", updated);
  };

  const deleteSubject = (id: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);
    persist("attendifier_subjects", updated);
  };

  const startSession = (subjectCode: string, duration: number, verificationCode: string, teacherId: string) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      subjectCode,
      verificationCode,
      startTime: Date.now(),
      duration,
      teacherId,
      active: true,
    };
    const updated = [...sessions, newSession];
    setSessions(updated);
    persist("attendifier_sessions", updated);
  };

  const markAttendance = (verificationCode: string, studentId: string, studentName: string): string | null => {
    const session = sessions.find((s) => s.active && s.verificationCode === verificationCode);
    if (!session) return "Invalid or expired verification code.";

    const alreadyMarked = attendanceEntries.find(
      (e) => e.sessionId === session.id && e.studentId === studentId
    );
    if (alreadyMarked) return "Attendance already marked for this session.";

    const entry: AttendanceEntry = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      studentId,
      studentName,
      subjectCode: session.subjectCode,
      timestamp: Date.now(),
      ipAddress: "127.0.0.1",
    };
    const updated = [...attendanceEntries, entry];
    setAttendanceEntries(updated);
    persist("attendifier_attendance", updated);
    return null;
  };

  const getTeacherSubjects = (teacherId: string) => subjects.filter((s) => s.teacherId === teacherId);
  const getActiveSessions = () => sessions.filter((s) => s.active);
  const getTeacherSessions = (teacherId: string) => sessions.filter((s) => s.teacherId === teacherId && s.active);
  const getStudentAttendance = (studentId: string) => attendanceEntries.filter((e) => e.studentId === studentId);
  const getSessionAttendance = (sessionId: string) => attendanceEntries.filter((e) => e.sessionId === sessionId);

  return (
    <AttendanceContext.Provider
      value={{
        subjects, sessions, attendanceEntries,
        addSubject, deleteSubject, startSession, markAttendance,
        getTeacherSubjects, getActiveSessions, getTeacherSessions,
        getStudentAttendance, getSessionAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};
