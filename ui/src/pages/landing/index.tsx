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
import { Col, Container, Row } from "react-bootstrap";


const Credential: React.FC<ICredential> = ({
    credentialKey, value
}) => {
    return (
        <TableRow
            key={credentialKey}
            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
        >
            <TableCell component="th" scope="row"><b>{credentialKey.replace("DB_", "")}</b></TableCell>
            <TableCell>{value}</TableCell>
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
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

function ProvisionedDB({ credentials, dialect }: IDatabaseDisplay) {
    const dispatch = useGrizzyDBDispatch();
    const { active_database } = useActiveDatabase();

    const handleDeleteDB = useMutation(() => delete_database(active_database?._id), {
        onSuccess: () => {
            remove_database(dispatch, active_database?._id);
        }
    })


    return (
        <Container>
            <Row>
                <Col xs={12} sm={4}>
                <div style={{
                        borderRight: "1px solid #efefef",
                        height: "400px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        boxSizing: "border-box",
                        padding: "10px",
                        gap: "4px"
                    }}>
                        <h2 className='action-text' style={{
                            letterSpacing: "1px"
                        }}>{dialect}</h2>
                        <Credentials credentials={credentials} />
                        <SQLEditorComp/>
                        <LoadingButton variant="outlined" loading={handleDeleteDB.isLoading} onClick={() => handleDeleteDB.mutate()} size="small" color="error" style={{
                            width: "80%"
                        }}>delete</LoadingButton>
                    </div>
                </Col>

                <Col xs={12} sm={8}>
                    <Visualizer database={"ecommerce"} />
                </Col>
            </Row>
        </Container>
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
    refetchOnMount: true,
    onSuccess: data => {
        initialize_databases(dispatch, data)
    },
  })

  return (
    <Box sx={{ width: '100%', border: "1px solid #d3d3d3", background: "white", typography: 'body1', borderRadius: "2px" }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} scrollButtons aria-label="lab API tabs example">
            {
                databases.map((database, position) => {
                    return <Tab 
                        label={database.name} 
                        value={position.toString()} 
                        key={position}
                    />
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
                width: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0px 10px",
            }}>
                <img 
                    src="/logo.png" 
                    alt="Grizzy DB logo"
                    style={{
                        height: "100px",
                        width: "100px",
                        objectFit: "contain"
                    }} 
                />

                <a href="https://www.producthunt.com/posts/grizzy-db?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-grizzy&#0045;db" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=400313&theme=light" alt="Grizzy&#0032;DB - quick&#0032;disposable&#0032;databases&#0032;for&#0032;all&#0032;your&#0032;testing&#0032;requirements | Product Hunt" style={{width: "250px",height: "45px"}}/></a>
            </div>
            <Hero/>
            <div style={{
                zIndex: 2,
                position: "absolute",
                height: "500px",
                top: "420px",
                width: "100%"
            }}>
                <Container>
                    <LabTabs/>
                </Container>
            </div>
        </div>
    );
}

export default LandingPage;