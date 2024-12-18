import { useEffect } from "react";
import {
  GrizzyDBProvider,
  change_fingerprint,
  useGrizzyDBDispatch,
} from "./context";
import LandingPage from "./pages/landing";

import {
  ClerkLoaded,
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";
import { Buffer } from 'buffer';
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthTokenComp from "./components/Auth";
import { AccountsPage } from "./pages/account";
import DatabaseDashboard from "./pages/account/components/Dashboard";
import DatabaseView from "./pages/database";

window.Buffer = window.Buffer || Buffer;

// a function to get the user fingerprint
const FingerPrintUser = () => {
  const dispatch = useGrizzyDBDispatch();

  useEffect(() => {
    getCurrentBrowserFingerPrint().then((fingerprint) => {
      change_fingerprint(dispatch, fingerprint);
    });
  }, []);

  return null;
};

export const GrizzyQueryClient = new QueryClient();

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ClerkLoaded>
        <AuthTokenComp />
        <GrizzyDBProvider>
          <FingerPrintUser />
          <QueryClientProvider client={GrizzyQueryClient}>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route
                  element={
                    <>
                      <SignedIn>
                        <AccountsPage />
                      </SignedIn>
                      <SignedOut>
                        <RedirectToSignIn />
                      </SignedOut>
                    </>
                  }
                >
                  <Route path="/dashboard" element={<DatabaseDashboard />} />
                  <Route
                    path="/dashboard/folder/:folder_id"
                    element={<DatabaseDashboard />}
                  />
                  <Route path="/dashboard/:id/*" element={<DatabaseView />} />
                  <Route path="/share/:id/*" element={<DatabaseView share={true} />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </QueryClientProvider>
        </GrizzyDBProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export default App;
