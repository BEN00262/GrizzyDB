import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Editor from '@monaco-editor/react';
import Modal from '@mui/material/Modal';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { IDBQuery } from '../../../context/types';
import { useActiveDatabase } from '../../../hooks';
import { query_database } from './api';
import { useMutation } from 'react-query';
import Alert from '@mui/material/Alert';
import { isAxiosError } from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ mt: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const EditorTabs: React.FC<{
    handleEditorChange: (mode: 'sql' | 'text') => (value: string | undefined, event: any) => void,
}> = ({ handleEditorChange }) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', marginBottom: "20px" }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="SQL" {...a11yProps(0)} />
          <Tab label="AI (ChatGPT)" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <YourSQLPromptEditor handleEditorChange={handleEditorChange('sql')} mode="sql"/>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <YourSQLPromptEditor handleEditorChange={handleEditorChange('text')} mode="text"/>
      </TabPanel>
    </Box>
  );
}

function generate_columns_from_row_data(row: {[key: string]: any}) {
  return Object.keys(row).map(key => ({
    field: key,
    headerName: key,
    width: 150,
    editable: false,
  }));
}
  
// this gets a query and the mode to send to the backend and then sends
const DBDataGrid: React.FC<IDBQuery> = ({ query, mode }) => {
    const [grid_data, setGridData] = React.useState<{
        columns: GridColDef[],
        rows: any[]
    }>({ columns: [], rows: [] });

    const [error, setError] = React.useState<Error | null>(null);

    const { active_database } = useActiveDatabase();

    const handleQueryDatabase = useMutation(async () => {
      setError(null);

        // check if the query is empty
        if (!query) {
            return;
        }

        return await query_database(active_database?._id, {
            query,
            mode
        });
    }, {
        onSuccess: data => {
          if (data?.length) {
            const has_id = Object.keys(data?.[0] ?? {}).includes('id');

            setGridData({
                columns: data ? generate_columns_from_row_data(data[0]) : [],
                rows: (data ?? []).map((x, position) => ({
                  ...x,
                  ...(has_id ? {} : { id: position + 1 })
                }))
            })
          }
        },

        onError: (error: Error) => {
          if (isAxiosError(error)) {
            setError(
              new Error(
                error.response?.data?.data?.errors?.join("\n")
              )
            )

            return;
          }

          setError(error);
        }
    })

    return (
        <>
            {
              error ?
              <Alert style={{
                marginBottom: "20px"
              }} severity="error">{error.message}</Alert>
              : null 
            }

            <LoadingButton
                onClick={() => handleQueryDatabase.mutate()} 
                variant="outlined" size="small" 
                loading={handleQueryDatabase.isLoading}
                startIcon={<PlayCircleIcon/>}>Run Query</LoadingButton>
            {
                grid_data.columns.length ? 
                <Box sx={{ 
                    height: 400, width: '100%', 
                    marginTop: "20px", '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#efefef',
                      }, 
                    }}>
                    <DataGrid
                      rows={grid_data.rows}
                      columns={grid_data.columns}
                      initialState={{
                        pagination: {
                          paginationModel: {
                            pageSize: 5,
                          },
                        },
                      }}
                      pageSizeOptions={[5]}
                      checkboxSelection
                      disableRowSelectionOnClick
                    />
                </Box>
                : null
            }
        </>
    );
  }

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 1000,
    bgcolor: 'background.paper',
    border: '1px solid #efefef',
    boxShadow: 24,
    borderRadius: '2px',
    p: 4,
};

const YourSQLPromptEditor: React.FC<{
    handleEditorChange: (value: string | undefined, event: any) => void,
    mode: 'sql' | 'text'
  }> = ({ handleEditorChange, mode }) => {
    return (
        <div style={{ border: '1px solid #efefef', boxSizing: 'border-box', padding: '10px' }}>
          <Editor 
            height="200px" 
            defaultLanguage={mode}
            options={{
                minimap: { enabled: false}
            }}
            onChange={handleEditorChange}
          />
        </div>
    );
}

const SQLEditorComp = () => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [query, setQuery] = React.useState<IDBQuery>({
    mode: 'sql',
    query: ''
  });

  function handleEditorChange(mode: 'sql' | 'text') {
    return (value: string | undefined, event: any) => {
        setQuery({ mode, query: value as string })
    }
  }

  return (
    <div>
      <Button variant="outlined" size="small" onClick={handleOpen} color="primary" style={{
            width: "80%"
        }}>sql / AI editor</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <EditorTabs 
                handleEditorChange={handleEditorChange}
            />

          <DBDataGrid {...query}/>
        </Box>
      </Modal>
    </div>
  );
}

export default SQLEditorComp;