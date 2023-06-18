import { useEffect } from 'react';
import { GrizzyDBProvider, change_fingerprint, useGrizzyDBDispatch } from './context';
import LandingPage from './pages/landing';

import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";
import { QueryClient, QueryClientProvider } from 'react-query';

// a function to get the user fingerprint
const FingerPrintUser = () => {
  const dispatch = useGrizzyDBDispatch();

  useEffect(() => {
    getCurrentBrowserFingerPrint().then((fingerprint) => {
      change_fingerprint(dispatch, fingerprint)
    })
  }, []);

  return null;
}

export const GrizzyQueryClient = new QueryClient();

function App() {
  return (
    <GrizzyDBProvider>
      <FingerPrintUser/>
      <QueryClientProvider client={GrizzyQueryClient}>
        <LandingPage/>
      </QueryClientProvider>
    </GrizzyDBProvider>
  )
}

export default App
