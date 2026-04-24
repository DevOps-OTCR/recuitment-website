import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { RequireAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Leadership from "./pages/Leadership";
import Join from "./pages/Join";
import Apply from "./pages/Apply";
import RecruitmentResources from "./pages/recruitment-resources";
import DevopsLanding from "./pages/devops/DevopsLanding";
import DevopsApply from "./pages/devops/DevopsApply";
import DevopsAssessment from "./pages/devops/DevopsAssessment";
import DevopsManage from "./pages/devops/DevopsManage";
import DevopsAssignments from "./pages/devops/DevopsAssignments";
import DevopsMyInterviews from "./pages/devops/DevopsMyInterviews";
import DevopsStatus from "./pages/devops/DevopsStatus";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RolePlaceholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center shadow-2xl shadow-slate-950/30">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Role Dashboard</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-white/65">
            This placeholder route is live so the post-login redirect works. The full dashboard UI for this role will
            be added in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RedirectDevopsAssessment() {
  const { token } = useParams<{ token: string }>();
  return <Navigate to={token ? `/tech/assessment/${token}` : "/tech"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ScrollToTop />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/leadership" element={<Leadership />} />
        <Route path="/join" element={<Join />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/recruitment-resources" element={<RecruitmentResources />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/applicant" element={<RequireAuth><RolePlaceholder title="Applicant" /></RequireAuth>} />
        <Route path="/consultant" element={<RequireAuth><RolePlaceholder title="Consultant" /></RequireAuth>} />
        <Route path="/lc" element={<RequireAuth><RolePlaceholder title="LC" /></RequireAuth>} />
        <Route path="/pm" element={<RequireAuth><RolePlaceholder title="PM" /></RequireAuth>} />
        <Route path="/partner" element={<RequireAuth><RolePlaceholder title="Partner" /></RequireAuth>} />
        <Route path="/admin" element={<Navigate to="/partner" replace />} />
        <Route path="/tech" element={<DevopsLanding />} />
        <Route path="/tech/sign-in" element={<Navigate to="/sign-in" replace />} />
        <Route path="/tech/apply" element={<DevopsApply />} />
        <Route path="/tech/status" element={<DevopsStatus />} />
        <Route path="/tech/assessment/:token" element={<DevopsAssessment />} />
        <Route path="/tech/interviews" element={<RequireAuth><DevopsMyInterviews /></RequireAuth>} />
        <Route path="/tech/manage" element={<RequireAuth><DevopsManage /></RequireAuth>} />
        <Route path="/tech/assignments" element={<RequireAuth><DevopsAssignments /></RequireAuth>} />
        <Route path="/tech/manage/applicants" element={<RequireAuth><DevopsManage /></RequireAuth>} />
        <Route path="/tech/manage/feedback" element={<RequireAuth><DevopsManage /></RequireAuth>} />
        <Route path="/tech/manage/database" element={<RequireAuth><DevopsManage /></RequireAuth>} />
        {/* Redirect old /devops paths to /tech */}
        <Route path="/devops" element={<Navigate to="/tech" replace />} />
        <Route path="/devops/sign-in" element={<Navigate to="/sign-in" replace />} />
        <Route path="/devops/apply" element={<Navigate to="/tech/apply" replace />} />
        <Route path="/devops/status" element={<Navigate to="/tech/status" replace />} />
        <Route path="/devops/assessment/:token" element={<RedirectDevopsAssessment />} />
        <Route path="/devops/interviews" element={<Navigate to="/tech/interviews" replace />} />
        <Route path="/devops/manage" element={<Navigate to="/tech/manage" replace />} />
        <Route path="/devops/assignments" element={<Navigate to="/tech/assignments" replace />} />
        <Route path="/devops/manage/applicants" element={<Navigate to="/tech/manage/applicants" replace />} />
        <Route path="/devops/manage/feedback" element={<Navigate to="/tech/manage/feedback" replace />} />
        <Route path="/devops/manage/database" element={<Navigate to="/tech/manage/database" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
