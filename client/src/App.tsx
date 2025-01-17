import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ImageGenerator from "@/pages/image-generator";
import Gallery from "@/pages/gallery";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Gallery} />
      <Route path="/generate" component={ImageGenerator} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;