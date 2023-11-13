import { useMutation, useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { delete_database, get_database, update_database_metadata } from "./api";
import { BringYourOwnDBUI, ProvisionedDB } from "../landing";
import SQLEditorComp from "../landing/components/PopupEditor";
import LoadingButton from "@mui/lab/LoadingButton";
import { Divider } from "antd";
import Textarea from '@mui/joy/Textarea';
import { IDatabaseDisplay } from "../../context/types";
import { useState } from "react";

function BringYourOwnDB({ database }: {
    database: IDatabaseDisplay
}) {
    const params = useParams();
    const [title, setTitle] = useState(database.name ?? '');

    const handleDeleteDB = useMutation(() => delete_database(params.id ?? ""), {
        onSuccess: () => {
            // remove_database(dispatch, params.id);
        }
    });

    const handleMetadataUpdate = useMutation(() => update_database_metadata(params.id ?? "", { name: title }), {
        onSuccess: () => {
            // remove_database(dispatch, params.id);
        }
    });

    return (
        <>
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}>
                <div style={{ flex: 2}}>
                    <Textarea 
                        placeholder="Type database / project name..." 
                        variant="plain"
                        onBlur={e => { handleMetadataUpdate.mutate() }}
                        onChange={e => { setTitle(e.target.value) }}
                        value={title}
                        sx={{
                            '--Textarea-focusedInset': 'var(--any, )',
                            '--Textarea-focusedThickness': '1px',
                            '--Textarea-focusedHighlight': 'transparent',
                            '&::before': {
                                transition: 'box-shadow .15s ease-in-out',
                            },
                            '&:focus-within': {
                                borderColor: '#86b7fe',
                            },
                            backgroundColor: "transparent",
                            fontFamily: "'Sofia Sans Condensed', sans-serif",
                            fontWeight: "bold",
                            fontSize: "1.3rem",
                        }}
                    />  
                </div>

                <div style={{
                    display: "flex",
                    gap: "10px"
                }}>
                    <LoadingButton variant="text" loading={handleDeleteDB.isLoading} onClick={() => handleDeleteDB.mutate()} size="small" color="error">delete</LoadingButton>
                </div>
            </div>

            <Divider/>

            <div style={{
                marginTop: "20px",
                height: "75vh"
            }}>
                <BringYourOwnDBUI {...database}/>
            </div>
        </>
    )
}

function HostedDB({ database }: {
    database: IDatabaseDisplay
}) {
    const params = useParams();
    const [title, setTitle] = useState(database.name ?? '');

    const handleMetadataUpdate = useMutation(() => update_database_metadata(params.id ?? "", { name: title }), {
        onSuccess: () => {
            // remove_database(dispatch, params.id);
        }
    });

    const handleDeleteDB = useMutation(() => delete_database(params.id ?? ""), {
        onSuccess: () => {
            // remove_database(dispatch, params.id);
        }
    })

    return (
        <>
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}>
                <div style={{ flex: 2}}>
                    <Textarea 
                        placeholder="Type database / project name..." 
                        variant="plain"
                        onBlur={e => { handleMetadataUpdate.mutate() }}
                        onChange={e => { setTitle(e.target.value) }}
                        value={title}
                        sx={{
                            '--Textarea-focusedInset': 'var(--any, )',
                            '--Textarea-focusedThickness': '1px',
                            '--Textarea-focusedHighlight': 'transparent',
                            '&::before': {
                                transition: 'box-shadow .15s ease-in-out',
                            },
                            '&:focus-within': {
                                borderColor: '#86b7fe',
                            },
                            backgroundColor: "transparent",
                            fontFamily: "'Sofia Sans Condensed', sans-serif",
                            fontWeight: "bold",
                            fontSize: "1.3rem",
                        }}
                    />  
                </div>
                <div style={{
                    display: "flex",
                    gap: "10px"
                }}>
                    <SQLEditorComp/>
                    <LoadingButton variant="text" loading={handleDeleteDB.isLoading} onClick={() => handleDeleteDB.mutate()} size="small" color="error">delete</LoadingButton>
                </div>
            </div>

            <Divider/>

            <div style={{
                marginTop: "20px"
            }}>
                <ProvisionedDB {...database}/>
            </div>
        </>
    )
}

export default function DatabaseView() {
    const params = useParams();

    // get the database
    const { data: database } = useQuery(['fetch-database', params.id], () => get_database(params.id ?? ""), {
        enabled: !!params.id
    });

    if (!database) {
        return null;
    }

    return (
        <>
            {database.product_type === 'bring_your_own' ? <BringYourOwnDB database={database}/> : <HostedDB database={database}/>}
        </>
    );
}