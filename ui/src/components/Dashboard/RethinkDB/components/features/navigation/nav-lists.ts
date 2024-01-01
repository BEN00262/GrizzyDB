import {
  Dashboard,
  DataArray,
  Explore,
  Storage,
  TextSnippet,
  Timeline
} from '@mui/icons-material';
export const menuList = [
  {
    title: 'Dashboard',
    icon: Dashboard,
    url: '/',
    exact: true,
  },
  {
    icon: DataArray,
    title: 'Tables',
    url: '/tables',
  },
  // {
  //   icon: Storage,
  //   title: 'Servers',
  //   url: '/servers',
  // },
  // {
  //   icon: TextSnippet,
  //   title: 'Logs',
  //   url: '/logs',
  // },
  {
    icon: Explore,
    title: 'Data Explorer',
    url: '/dataexplorer',
  },
  // {
  //   icon: Timeline,
  //   title: 'Chart with tables',
  //   url: '/chart',
  // },
];

export const linkList = [];
