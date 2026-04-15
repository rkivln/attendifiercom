import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Classroom {
  id: string;
  name: string;
  invite_code: string;
  teacher_id: string;
  created_at: string;
}

export interface ClassroomMember {
  id: string;
  classroom_id: string;
  student_id: string;
  joined_at: string;
}

export interface Announcement {
  id: string;
  classroom_id: string;
  teacher_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  teacher_id: string;
  classroom_id: string | null;
}

export interface Session {
  id: string;
  subject_code: string;
  verification_code: string;
  start_time: string;
  duration: number;
  grace_period: number;
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
  is_late: boolean;
}

interface AttendanceContextType {
  subjects: Subject[];
  sessions: Session[];
  attendanceEntries: AttendanceEntry[];
  classrooms: Classroom[];
  classroomMembers: ClassroomMember[];
  announcements: Announcement[];
  addSubject: (code: string, name: string, teacherId: string, classroomId?: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  startSession: (subjectCode: string, duration: number, verificationCode: string, teacherId: string, gracePeriod?: number) => Promise<void>;
  markAttendance: (verificationCode: string, studentId: string, studentName: string) => Promise<string | null>;
  createClassroom: (name: string, teacherId: string) => Promise<Classroom | null>;
  joinClassroom: (inviteCode: string, studentId: string) => Promise<string | null>;
  leaveClassroom: (classroomId: string, studentId: string) => Promise<void>;
  removeStudent: (classroomId: string, studentId: string) => Promise<void>;
  createAnnouncement: (classroomId: string, teacherId: string, title: string, content: string) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  getTeacherSubjects: (teacherId: string) => Subject[];
  getActiveSessions: () => Session[];
  getTeacherSessions: (teacherId: string) => Session[];
  getStudentAttendance: (studentId: string) => AttendanceEntry[];
  getSessionAttendance: (sessionId: string) => AttendanceEntry[];
  getTeacherClassrooms: (teacherId: string) => Classroom[];
  getStudentClassrooms: (studentId: string) => Classroom[];
  getClassroomMembers: (classroomId: string) => ClassroomMember[];
  getClassroomAnnouncements: (classroomId: string) => Announcement[];
  getClassroomSubjects: (classroomId: string) => Subject[];
  getClassroomSessions: (classroomId: string) => Session[];
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
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomMembers, setClassroomMembers] = useState<ClassroomMember[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchAll = useCallback(async () => {
    const [subRes, sesRes, attRes, clsRes, memRes, annRes] = await Promise.all([
      supabase.from("subjects").select("*"),
      supabase.from("sessions").select("*"),
      supabase.from("attendance_entries").select("*"),
      supabase.from("classrooms").select("*"),
      supabase.from("classroom_members").select("*"),
      supabase.from("announcements").select("*"),
    ]);
    if (subRes.data) setSubjects(subRes.data as Subject[]);
    if (sesRes.data) setSessions(sesRes.data as Session[]);
    if (attRes.data) setAttendanceEntries(attRes.data as AttendanceEntry[]);
    if (clsRes.data) setClassrooms(clsRes.data as Classroom[]);
    if (memRes.data) setClassroomMembers(memRes.data as ClassroomMember[]);
    if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("attendance_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_entries" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "classrooms" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_members" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // Check for expired sessions every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const expired = sessions.filter((s) => s.active && !isSessionActive(s));
      for (const s of expired) {
        await supabase.from("sessions").update({ active: false }).eq("id", s.id);
      }
      if (expired.length > 0) fetchAll();
    }, 5000);
    return () => clearInterval(interval);
  }, [sessions, fetchAll]);

  const addSubject = async (code: string, name: string, teacherId: string, classroomId?: string) => {
    await supabase.from("subjects").insert({ code, name, teacher_id: teacherId, classroom_id: classroomId || null });
    await fetchAll();
  };

  const deleteSubject = async (id: string) => {
    await supabase.from("subjects").delete().eq("id", id);
    await fetchAll();
  };

  const startSession = async (subjectCode: string, duration: number, verificationCode: string, teacherId: string, gracePeriod = 5) => {
    await supabase.from("sessions").insert({
      subject_code: subjectCode,
      verification_code: verificationCode,
      duration,
      teacher_id: teacherId,
      active: true,
      grace_period: gracePeriod,
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

    // Check if student is in the classroom for this subject
    const subject = subjects.find(s => s.code === session.subject_code);
    if (subject?.classroom_id) {
      const isMember = classroomMembers.some(
        m => m.classroom_id === subject.classroom_id && m.student_id === studentId
      );
      if (!isMember) return "You are not a member of this classroom.";
    }

    // Check if late
    const gracePeriod = session.grace_period || 5;
    const graceEnd = new Date(session.start_time).getTime() + gracePeriod * 60 * 1000;
    const isLate = Date.now() > graceEnd;

    const { error } = await supabase.from("attendance_entries").insert({
      session_id: session.id,
      student_id: studentId,
      student_name: studentName,
      subject_code: session.subject_code,
      is_late: isLate,
    });
    if (error) return error.message;
    await fetchAll();
    return isLate ? "Attendance marked as LATE." : null;
  };

  const createClassroom = async (name: string, teacherId: string): Promise<Classroom | null> => {
    const { data, error } = await supabase.from("classrooms").insert({ name, teacher_id: teacherId }).select().single();
    if (error) {
      console.error("Create classroom error:", error);
      return null;
    }
    await fetchAll();
    return data as Classroom;
  };

  const joinClassroom = async (inviteCode: string, studentId: string): Promise<string | null> => {
    const { data: classroom } = await supabase.from("classrooms").select("*").eq("invite_code", inviteCode).single();
    if (!classroom) return "Invalid invite code.";

    const alreadyJoined = classroomMembers.some(
      m => m.classroom_id === classroom.id && m.student_id === studentId
    );
    if (alreadyJoined) return "You have already joined this classroom.";

    const { error } = await supabase.from("classroom_members").insert({
      classroom_id: classroom.id,
      student_id: studentId,
    });
    if (error) return error.message;
    await fetchAll();
    return null;
  };

  const leaveClassroom = async (classroomId: string, studentId: string) => {
    await supabase.from("classroom_members").delete().eq("classroom_id", classroomId).eq("student_id", studentId);
    await fetchAll();
  };

  const removeStudent = async (classroomId: string, studentId: string) => {
    await supabase.from("classroom_members").delete().eq("classroom_id", classroomId).eq("student_id", studentId);
    await fetchAll();
  };

  const createAnnouncement = async (classroomId: string, teacherId: string, title: string, content: string) => {
    await supabase.from("announcements").insert({ classroom_id: classroomId, teacher_id: teacherId, title, content });
    await fetchAll();
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    await fetchAll();
  };

  const getTeacherSubjects = (teacherId: string) => subjects.filter((s) => s.teacher_id === teacherId);
  const getActiveSessions = () => sessions.filter(isSessionActive);
  const getTeacherSessions = (teacherId: string) => sessions.filter((s) => s.teacher_id === teacherId && isSessionActive(s));
  const getStudentAttendance = (studentId: string) => attendanceEntries.filter((e) => e.student_id === studentId);
  const getSessionAttendance = (sessionId: string) => attendanceEntries.filter((e) => e.session_id === sessionId);
  const getTeacherClassrooms = (teacherId: string) => classrooms.filter((c) => c.teacher_id === teacherId);
  const getStudentClassrooms = (studentId: string) => {
    const myMemberships = classroomMembers.filter(m => m.student_id === studentId);
    return classrooms.filter(c => myMemberships.some(m => m.classroom_id === c.id));
  };
  const getClassroomMembers = (classroomId: string) => classroomMembers.filter(m => m.classroom_id === classroomId);
  const getClassroomAnnouncements = (classroomId: string) => announcements.filter(a => a.classroom_id === classroomId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const getClassroomSubjects = (classroomId: string) => subjects.filter(s => s.classroom_id === classroomId);
  const getClassroomSessions = (classroomId: string) => {
    const subjectCodes = subjects.filter(s => s.classroom_id === classroomId).map(s => s.code);
    return sessions.filter(s => subjectCodes.includes(s.subject_code));
  };

  return (
    <AttendanceContext.Provider
      value={{
        subjects, sessions, attendanceEntries, classrooms, classroomMembers, announcements,
        addSubject, deleteSubject, startSession, markAttendance,
        createClassroom, joinClassroom, leaveClassroom, removeStudent,
        createAnnouncement, deleteAnnouncement,
        getTeacherSubjects, getActiveSessions, getTeacherSessions,
        getStudentAttendance, getSessionAttendance,
        getTeacherClassrooms, getStudentClassrooms,
        getClassroomMembers, getClassroomAnnouncements,
        getClassroomSubjects, getClassroomSessions,
        refreshData: fetchAll,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};
