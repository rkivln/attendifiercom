import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClipboardCheck } from "lucide-react";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await register(name, email, password, role);
    setLoading(false);
    if (err) setError(err);
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-lg bg-primary items-center justify-center mb-4">
            <ClipboardCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join Attendifier today</p>
        </div>
        <div className="content-card">
          {error && <p className="text-destructive text-sm mb-4 text-center bg-destructive/10 rounded-lg py-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" placeholder="name@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "student" | "teacher")} className="input-field">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="text-center mt-5 text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
