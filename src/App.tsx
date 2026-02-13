import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ReadOnlyProvider } from "@/contexts/ReadOnlyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import Auth from "./pages/Auth";
import FoodLog from "./pages/FoodLog";
import WeightLog from "./pages/WeightLog";
import OtherLog from "./pages/OtherLog";
import Trends from "./pages/Trends";
import History from "./pages/History";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Changelog from "./pages/Changelog";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ReadOnlyProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/changelog" element={<Changelog />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<FoodLog />} />
                  <Route path="/weights" element={<WeightLog />} />
                  <Route path="/custom" element={<OtherLog />} />
                  <Route path="/trends" element={<Trends />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/admin" element={<Admin />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ReadOnlyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
