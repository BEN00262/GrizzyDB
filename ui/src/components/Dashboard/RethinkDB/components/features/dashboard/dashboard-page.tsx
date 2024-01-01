
import { Box, Stack } from '@mui/material';

import { CommonTitledLayout } from '../../layouts/page';
import { LineChart } from '../chart';

import { Panel } from './panel';

const DashboardPage = () => (
  <CommonTitledLayout title={""}>
    <Stack spacing={1}>
      <Box mb={2} mt={5}>
        <Panel />
      </Box>
      <LineChart />
    </Stack>
  </CommonTitledLayout>
);

export { DashboardPage };

