import React from 'react';
import { Box, styled, Typography } from '@mui/material';

export const CommonLayout = styled('div')({
  margin: 1,
});

export type CommonTitledLayoutProps = {
  children?: React.ReactNode;
  title: string;
  titleOptions?: React.ReactElement;
};

export const CommonTitledLayout = ({
  children,
  titleOptions,
}: CommonTitledLayoutProps) => (
  <CommonLayout>
    <Box display="flex" m={1}>
      {titleOptions}
    </Box>
    <Box m={1}>{children}</Box>
  </CommonLayout>
);
