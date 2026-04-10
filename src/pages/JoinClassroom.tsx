import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";

const JoinClassroom = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading } = useAuth();
  const { joinClassroom } = useAttendance();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Redirect to login, but save the invite link
      sessionStorage.setItem("pendingInvite", inviteCode || "");
      navigate("/login");
      return;
    }
    if (user.role !== "student") {
      toast.error("Only students can join classrooms.");
      navigate("/teacher");
      return;
    }
  }, [user, loading, inviteCode, navigate]);

  const handleJoin = async () => {
    if (!inviteCode || !user) return;
    setJoining(true);
    const err = await joinClassroom(inviteCode, user.id);
    setJoining(false);
    if (err) {
      setError(err);
    } else {
      toast.success("Successfully joined the classroom!");
      navigate("/student");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="content-card max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Join Classroom</h1>
          <p className="text-sm text-muted-foreground mt-1">You've been invited to join a classroom.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Invite code: <span className="font-mono text-foreground">{inviteCode}</span>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button onClick={handleJoin} disabled={joining} className="btn-primary w-full disabled:opacity-40">
          {joining ? "Joining..." : "Join Classroom"}
        </button>
      </div>
    </div>
  );
};

export default JoinClassroom;
