import Hero from "./components/Hero";
import './index.css'
import * as React from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Visualizer from "../../components/Visualizer";
import { ICredential, IDatabaseDisplay } from "../../context/types";
import { useMutation, useQuery } from "react-query";
import LoadingButton from '@mui/lab/LoadingButton';
import { delete_database, get_my_databases } from "./api";
import SQLEditorComp from "./components/PopupEditor";
import { initialize_databases, remove_database, switch_active_database, useGrizzyDBDispatch, useGrizzyDBState } from "../../context";
import { useActiveDatabase } from "../../hooks";


const Credential: React.FC<ICredential> = ({
    credentialKey, value, isHidden
}) => {
    return (
        <TableRow
            key={credentialKey}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
        >
            <TableCell component="th" scope="row">{credentialKey}</TableCell>
            <TableCell>{isHidden ? "********" : value}</TableCell>
        </TableRow>
    );
}

function Credentials({ credentials }: { credentials: ICredential[] }) {
    return (
        <div style={{ flex: 3 }}>
            <TableContainer>
                <Table 
                    aria-label="simple table" size="small"
                    sx={{
                        [`& .${tableCellClasses.root}`]: {
                          borderBottom: "none"
                        }
                    }}
                >
                    <TableBody>
                        {
                            credentials.map(({credentialKey, value, isHidden }, position) => {
                                return (
                                    <Credential
                                        key={position}
                                        credentialKey={credentialKey}
                                        value={value}
                                        isHidden={isHidden}
                                    />
                                )
                            })
                        }

                        {/* built on the fly */}
                        <Credential
                            credentialKey="CONNECTION STRING"
                            value="mongodb://localhost:27017/juma-sample-db"
                            isHidden={false}
                        />
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

function ProvisionedDB({ credentials }: IDatabaseDisplay) {
    const dispatch = useGrizzyDBDispatch();
    const { active_database } = useActiveDatabase();

    const handleDeleteDB = useMutation(() => delete_database(active_database?._id), {
        onSuccess: () => {
            remove_database(dispatch, active_database?._id);
        }
    })


    return (
        <div style={{
            display: "flex",
            flexDirection: "row"
        }}>

            <div style={{
                borderRight: "1px solid #efefef",
                height: "400px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                padding: "10px",
                gap: "4px"
            }}>
                <Credentials credentials={credentials} />
                <SQLEditorComp/>
                <LoadingButton variant="outlined" loading={handleDeleteDB.isLoading} onClick={() => handleDeleteDB.mutate()} size="small" color="error" style={{
                    width: "80%"
                }}>delete</LoadingButton>
            </div>

            <div style={{ flex: 4 }}>
                <Visualizer database={"ecommerce"} />
            </div>
        </div>
    );
}

function LabTabs() {
    const dispatch = useGrizzyDBDispatch();
    const [value, setValue] = React.useState('0');
    
    const { databases } = useGrizzyDBState();

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue);
    switch_active_database(dispatch, +newValue);
  };

  useQuery(['my-databases'], get_my_databases, {
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000 * 60, // 30 mins
    onSuccess: data => {
        initialize_databases(dispatch, data)
    },
  })

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} scrollButtons aria-label="lab API tabs example">
            {
                databases.map((database, position) => {
                    return <Tab label={database.name} value={position.toString()} key={position}/>
                })
            }
          </TabList>
        </Box>
        {
            databases.map((database, position) => {
                return (
                    <TabPanel value={position.toString()} key={position}>
                        <ProvisionedDB {...database}/>
                    </TabPanel>
                )
            })
        }
      </TabContext>
    </Box>
  );
}

const LandingPage = () => {
    return (
        <div>
            <div style={{
                position: "absolute",
                boxSizing: "border-box",
                padding: "20px"
            }}>
                <h1 className="logo-text"><b>Grizzy DB</b></h1>
            </div>
            <Hero/>
            <div style={{
                zIndex: 2,
                position: "absolute",
                height: "500px",
                border: "1px solid #000",
                top: "420px",
                left: "20%",
                width: "60%",
                background: "white",
                borderRadius: "2px"
            }}>
                {/* provisioned dbs */}
                <LabTabs/>

            </div>
        </div>
    );
}

export default LandingPage;