import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  GrizzyDBProvider,
  change_fingerprint,
  useGrizzyDBDispatch,
} from "./context";
import LandingPage from "./pages/landing";

import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  SignIn,
  SignUp,
  UserButton,
  ClerkLoaded,
} from "@clerk/clerk-react";
import { AccountsPage } from "./pages/account";
import DatabaseView from "./pages/database";
import DatabaseDashboard from "./pages/account/components/Dashboard";
import AuthTokenComp from "./components/Auth";

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
        <AuthTokenComp/>
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
                  <Route path="/dashboard/:id" element={<DatabaseView />} />
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
