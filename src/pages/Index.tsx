import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Users, Clock, Download, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold text-foreground">Attendifier</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="btn-outline">Login</button>
          <button onClick={() => navigate("/register")} className="btn-primary">Register</button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <ClipboardCheck className="h-4 w-4" />
            College Attendance System
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4 leading-tight">
            Manage your<br />attendance
          </h1>
          <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
            Simple, fast, and secure attendance tracking for teachers and students.
          </p>
          <button onClick={() => navigate("/login")} className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
            Get Started <ArrowRight className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">
            {[
              { icon: Users, title: "Role-Based Access", desc: "Separate dashboards for teachers and students" },
              { icon: Clock, title: "Live Sessions", desc: "Timed attendance with verification codes" },
              { icon: Download, title: "Export Data", desc: "Download as CSV, Excel, or Word" },
            ].map((f) => (
              <div key={f.title} className="content-card text-left">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        © 2026 Attendifier — Designed by GOKULAN
      </footer>
    </div>
  );
};

export default Index;
