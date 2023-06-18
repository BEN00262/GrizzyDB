import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Modal from '@mui/material/Modal';
import { Container } from 'react-bootstrap';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import Button from '@mui/material/Button';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Alert from '@mui/material/Alert';
import Editor from '@monaco-editor/react';
import LoadingButton from '@mui/lab/LoadingButton';
import { useMutation, useQuery } from 'react-query';
import { get_available_database, get_available_sample_data_templates, provision_database } from './api';
import { DBDialect, IDatabase, IDatabaseTemplate, ISampleTemplate, Template } from '../../../context/types';
import { useMemo } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { add_database, useGrizzyDBDispatch } from '../../../context';

const DBCard: React.FC<{
  database: IDatabase, 
  selected_dialect: DBDialect, 
  onSelected: () => void 
}> = ({ database: {dialect, logo, enabled }, selected_dialect, onSelected }) => {
    return (
        <div style={{
            border: `1px solid ${selected_dialect === dialect ? 'black' :  '#efefef'}`,
            borderRadius: "2px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            boxSizing: "border-box",
            padding: "20px",
            cursor: enabled ? "pointer" : "not-allowed",
        }}
        onClick={enabled ? onSelected : () => null}
        >
            <img src={logo} alt="" style={{
                height: "100px",
                width: "100px",
                objectFit: "contain"
            }} />
        </div>
    );
}

const SampleDataEditor: React.FC<ISampleTemplate & {
  handleEditorChange: (value: string | undefined, event: any) => void
}> = ({ sql_statements, handleEditorChange }) => {
    return (
        <Editor 
          height="350px" 
          defaultLanguage="sql" 
          value={sql_statements}
          onChange={handleEditorChange}
        />
    );
}

const YourSchemaEditor: React.FC<{
  handleEditorChange: (value: string | undefined, event: any) => void
}> = ({ handleEditorChange }) => {
  return (
      <div style={{ border: '1px solid #efefef', boxSizing: 'border-box', padding: '10px' }}>
        <Editor 
          height="350px" 
          defaultLanguage="sql" 
          value='-- copy your sql schema and paste here. The data willn be generated using ChatGPT'
          onChange={handleEditorChange}
        />
      </div>
  );
}


function SampleDataTabs(
  { 
    current_dialect, handleSampleDataChange, handleEditorChange
  }: { 
    current_dialect: DBDialect, 
    handleSampleDataChange: (template: string) => void, 
    handleEditorChange: (value: string | undefined, event: any) => void
  }
) {
    const [value, setValue] = React.useState('1');
    const [_samples, setSamples] = React.useState<ISampleTemplate[]>([]);

    const samples = useMemo(() => {
      return _samples.filter(sample => sample.dialect === current_dialect);
    }, [_samples, current_dialect]);

    useQuery(['database-data-templates'], get_available_sample_data_templates, {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000 * 60, // 30 mins
      onSuccess: data => {
        setSamples(data);
      },
    });

    const handleChange = (event: any, newValue: any) => {
      setValue(newValue);
      handleSampleDataChange(samples?.[newValue]?.sql_statements ?? '');
    };
  
    return (
      <Box sx={{ 
            width: '100%', typography: 'body1', 
            border: '1px solid #efefef',
            borderRadius: "2px",
            boxSizing: "border-box",
            padding: "2px",
            marginTop: "10px"
        }}>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              {
                samples.map((sample, position) => {
                  return <Tab label={sample.name} value={`${position}`} key={position} />
                })
              }
            </TabList>
          </Box>
          {
            samples.map((sample, position) => {
              return (
                <TabPanel value={`${position}`} key={position}>
                  <SampleDataEditor 
                    {...sample} 
                    handleEditorChange={handleEditorChange}
                  />
                </TabPanel>
              )
            })
          }
        </TabContext>
      </Box>
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

const ProvisionModal: React.FC<{ 
    open: boolean;
    handleClose: () => void
}> = ({ open, handleClose }) => {

  const [databaseTemplate, setDatabaseTemplate] = React.useState<IDatabaseTemplate>({
    dialect: 'mariadb',
    selected_template: 'sample',
    sample_data_template: '',
    custom_schema_template: ''
  });

  const [databases, setDatabases] = React.useState<IDatabase[]>([]);
  const dispatch = useGrizzyDBDispatch();
  const [value, setValue] = React.useState('female');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = (event.target as HTMLInputElement).value;
    setValue(selected);


    setDatabaseTemplate({
      ...databaseTemplate,
      selected_template: selected as Template
    });
  };

  function handleEditorChange(key: string) {
    return (value: string | undefined, event: any) => {
      setDatabaseTemplate(old => ({
        ...old,
        [key]: value
      }))
    }
  }


  useQuery(['available-datababes'], get_available_database, {
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000 * 60, // 30 mins
    onSuccess: data => {
      setDatabases(data);
    },
  });

  const handleSampleDataChange = (value: string) => {
    setDatabaseTemplate({
      ...databaseTemplate,
      sample_data_template: value
    });
  }

  const handleProvisionRequest = useMutation(() => provision_database(databaseTemplate), {
    onSuccess: data => {
      add_database(dispatch, data);
      handleClose();
    }
  });

  return (
    <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Container>
            <Alert style={{
                marginBottom: "10px"
            }} severity="info">Limited to a <b>100MB</b> per database on the BETA version. <b>The databases are deleted after 24hrs</b></Alert>
            
            <Grid container spacing={2}>
                {
                  databases.map((database, position) => {
                    return (
                      <Grid xs={6} sm={4} key={position}>
                        <DBCard 
                          database={database}
                          onSelected={() => setDatabaseTemplate(old => ({ ...old, dialect: database.dialect }))}
                          selected_dialect={databaseTemplate.dialect}
                        />
                      </Grid>
                    )
                  })
                }
            </Grid>

            <div style={{ marginTop: "10px" }}>
                {/* <FormControlLabel control={<Checkbox checked={databaseTemplate.use_sample_data} onChange={handleCheckboxChange} />} label="Use sample data" /> */}
                
                <div style={{padding: "10px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center"}}>
                  <RadioGroup
                    row
                    aria-labelledby="demo-controlled-radio-buttons-group"
                    name="controlled-radio-buttons-group"

                    value={value}
                    onChange={handleChange}
                  >
                    <FormControlLabel className='select-radio' value="none" control={<Radio checked={databaseTemplate.selected_template === 'none'}/>} label="Clean database" />
                    <FormControlLabel className='select-radio' value="sample" control={<Radio checked={databaseTemplate.selected_template === 'sample'}/>} label="Use sample data" />
                    <FormControlLabel className='select-radio' value="custom" control={<Radio checked={databaseTemplate.selected_template === 'custom'}/>} label="Import your database schema" />
                </RadioGroup>
                </div>

                {
                  databaseTemplate.selected_template === 'custom' ?
                  <YourSchemaEditor
                    handleEditorChange={handleEditorChange('custom_schema_template')}
                  /> : null
                }


                { databaseTemplate.selected_template === 'sample' ? 
                  <SampleDataTabs 
                    current_dialect={databaseTemplate.dialect}
                    handleEditorChange={handleEditorChange('sample_data_template')}
                    handleSampleDataChange={handleSampleDataChange}
                  /> : null }
            </div>
            
            <div style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              width: "100%",
              marginTop: "10px"
            }}>
                <LoadingButton 
                  variant="outlined" loading={handleProvisionRequest.isLoading} 
                  onClick={() => handleProvisionRequest.mutate()}
                >Provision</LoadingButton>
            </div>

            {/* <Alert severity="error">This is an error alert — check it out!</Alert> */}
          </Container>
        </Box>
    </Modal>
  );
}

export default ProvisionModal;

