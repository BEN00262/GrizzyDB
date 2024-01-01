import React, { StrictMode } from 'react';

import {
  CssBaseline,
  ThemeProvider,
  styled
} from '@mui/material';
import { reatomContext } from '@reatom/react';
import { HashRouter as Router } from 'react-router-dom';

import { Drawer, drawerWidth } from './features/navigation';
import { AppRoutes } from './features/routes';
import { store } from './features/store';
import { useTheme } from './features/theme';

import './features/rethinkdb';

const { Provider: StateProvider } = reatomContext;

const Root = styled('div')`
  display: flex;
`;

const ContentWrapper = styled('main')`
  flex-grow: 1;
  width: calc(100% - ${drawerWidth}px);
`;

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

const App = () => (
  <StrictMode>
    {/* TODO fix Router weird ts error */}
    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
    {/* @ts-ignore */}
    <Router>
      <StateProvider value={store}>
        <ThemedContent />
      </StateProvider>
    </Router>
  </StrictMode>
);

export const ThemedContent = () => {
  const theme = useTheme();
  return (
    <ThemeProvider theme={theme}>
      <AppInnerContent />
    </ThemeProvider>
  );
};

export const AppInnerContent = () => {
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };
  
  return (
    <Root>
      <CssBaseline />
      <Drawer handleDrawerToggle={handleDrawerToggle} mobileOpen={mobileOpen} />
      <ContentWrapper>
        <AppRoutes />
      </ContentWrapper>
    </Root>
  );
};

export default App;
