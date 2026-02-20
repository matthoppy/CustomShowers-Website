import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ShowerConfiguratorWizard from "./pages/ShowerConfiguratorWizard";
import NotFound from "./pages/NotFound";
import "./index.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/design-shower" element={<ShowerConfiguratorWizard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
