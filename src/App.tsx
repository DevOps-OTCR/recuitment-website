import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
        <Route path="/tech" element={<DevopsLanding />} />
        <Route path="/tech/apply" element={<DevopsApply />} />
        <Route path="/tech/status" element={<DevopsStatus />} />
        <Route path="/tech/assessment/:token" element={<DevopsAssessment />} />
        <Route path="/tech/interviews" element={<DevopsMyInterviews />} />
        <Route path="/tech/manage" element={<DevopsManage />} />
        <Route path="/tech/assignments" element={<DevopsAssignments />} />
        <Route path="/tech/manage/applicants" element={<DevopsManage />} />
        <Route path="/tech/manage/feedback" element={<DevopsManage />} />
        <Route path="/tech/manage/database" element={<DevopsManage />} />
        {/* Redirect old /devops paths to /tech */}
        <Route path="/devops" element={<Navigate to="/tech" replace />} />
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
