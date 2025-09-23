import { AppLayout } from "./components/layout/AppLayout";
import { LoadingState } from "./components/ui/LoadingState";
import LoginPage from "./features/auth/LoginPage";
import { useAuth } from "./hooks/useAuth";
import { AppRoutes } from "./routes/AppRoutes";

const App = () => {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingState label="Tikriname prieigą" />;
  }

  if (status !== "authenticated") {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
};

export default App;
