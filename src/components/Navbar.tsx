import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ClipboardCheck } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header>
      <nav className="flex items-center justify-between px-6 py-4 bg-card/60 backdrop-blur-lg border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-primary" />
          <span className="text-xl font-display font-bold text-foreground">Attendifier</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                🟢 {user.name} ({user.role === "teacher" ? "Staff (Teacher)" : "Student"})
              </span>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
      <div className="gradient-line" />
    </header>
  );
};

export default Navbar;
