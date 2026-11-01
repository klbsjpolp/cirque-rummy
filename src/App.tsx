import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";

/**
 * L'application, qui tient en une page : le plateau, et les notifications qui disent
 * au joueur pourquoi une action a été refusée.
 */
const App = () => (
  <>
    <Toaster />
    <Index />
  </>
);

export default App;
