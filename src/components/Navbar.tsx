import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClipboardCheck } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header>
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <ClipboardCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Attendifier</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.name} ({user.role === "teacher" ? "Teacher" : "Student"})
              </span>
              <button onClick={handleLogout} className="btn-outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
