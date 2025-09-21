import { AppLayout } from "./components/layout/AppLayout";
import { AppRoutes } from "./routes/AppRoutes";

const App = () => {
  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
};

export default App;
