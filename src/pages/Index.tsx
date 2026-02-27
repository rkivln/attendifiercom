import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ClipboardCheck, Users, Clock, Download } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl">
          <ClipboardCheck className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Attendifier
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            College Attendance System — Simple, fast, and secure attendance tracking for teachers and students.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Started
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            {[
              { icon: Users, title: "Role-Based Access", desc: "Separate dashboards for teachers and students" },
              { icon: Clock, title: "Live Sessions", desc: "Timed attendance with verification codes" },
              { icon: Download, title: "Export Data", desc: "Download as CSV, Excel, or Word" },
            ].map((f) => (
              <div key={f.title} className="glass-card p-5 text-left">
                <f.icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-display font-semibold text-foreground text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
