import JTab, { tabClasses } from "@mui/joy/Tab";
import JTabList from "@mui/joy/TabList";
import JTabPanel from "@mui/joy/TabPanel";
import JTabs from "@mui/joy/Tabs";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Unstable_Grid2";
import { useState } from "react";
import FileUpload from "react-material-file-upload";
import { IDatabase } from "../../../context/types";

import { useQuery } from "react-query";
import { DBCard } from "./Provision";
import { get_available_database } from "./api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 1000,
  bgcolor: "background.paper",
  border: "1px solid #efefef",
  boxShadow: 24,
  borderRadius: "2px",
  p: 4
};

const ImportComponent = () => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [files, setFiles] = useState<File[]>([]);
  const [databases, setDatabases] = useState<IDatabase[]>([]);

  //   support importing from other dbs --> on platform or not -- if not on platform ask the user to add ceredentials
  useQuery(["available-datababes"], get_available_database, {
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000 * 60, // 30 mins
    onSuccess: (data) => {
      setDatabases(data);
    },
  });

  return (
    <div>
      <Button variant="text" size="small" onClick={handleOpen} color="primary">
        import
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "5px",
            }}
          >
            <img
              src="/import.svg"
              style={{
                height: "150px",
                objectFit: "contain",
              }}
            />
          </div>

          <JTabs defaultValue={0} size="sm">
            <JTabList
              className="action-text"
              variant="plain"
              sx={{
                "--List-padding": "0px",
                "--List-radius": "0px",
                "--ListItem-minHeight": "48px",
                [`& .${tabClasses.root}`]: {
                  boxShadow: "none",
                  fontWeight: "md",
                  [`&.${tabClasses.selected}::before`]: {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    left: "var(--ListItem-paddingLeft)", // change to `0` to stretch to the edge.
                    right: "var(--ListItem-paddingRight)", // change to `0` to stretch to the edge.
                    bottom: 0,
                    height: 3,
                    bgcolor: "primary.400",
                  },
                },
                width: "50%",
                margin: "auto",
                marginBottom: "20px",
              }}
            >
              <JTab>SQL Dump (.sql)</JTab>
              <JTab>Auto Import</JTab>
            </JTabList>

            <JTabPanel value={0} sx={{ height: "40vh" }}>
              <FileUpload
                value={files}
                onChange={setFiles}
                sx={{
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              />
            </JTabPanel>

            <JTabPanel value={1} sx={{ minHeight: "51vh" }}>
              <Grid container spacing={2}>
                {databases.map((database, position) => {
                  return (
                    <Grid xs={6} sm={3} key={position}>
                      <DBCard
                        database={database}
                        onSelected={() => {}}
                        selected_dialect={"mariadb"}
                      />
                    </Grid>
                  );
                })}
              </Grid>

              <div
                style={{
                  // border: "1px solid #efefef",
                  marginTop: "10px",
                  // padding: "10px 2px",
                  borderRadius: "2px",
                  // backgroundColor: "#7ec7ee",
                  height: "300px",
                }}
              >
                {/* they can choose to add regular creds or attach to an exisiting DB */}
                <FormControlLabel
                  control={<Checkbox defaultChecked />}
                  label="Use existing database ( hosted within the platform )"
                />

                {/* list of the exisiting databases -> name (dialect) else its just a form with inputs */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    border: "1px solid #efefef",
                    padding: "15px",
                    borderRadius: "2px",
                    boxSizing: "border-box"
                    // backgroundColor:"#efefef"
                  }}
                >
                  <TextField
                    label="Host"
                    id="filled-size-small"
                    defaultValue="Small"
                    // variant="filled"
                    size="small"
                  />

                  <TextField
                    label="Database Name"
                    id="filled-size-small"
                    defaultValue="Small"
                    // variant="filled"
                    size="small"
                  />

                  <TextField
                    label="User Name"
                    id="filled-size-small"
                    defaultValue="Small"
                    // variant="filled"
                    size="small"
                  />

                  <TextField
                    label="Password"
                    id="filled-size-small"
                    defaultValue="Small"
                    // variant="filled"
                    size="small"
                  />

                  <TextField
                    label="Port"
                    id="filled-size-small"
                    defaultValue="Small"
                    // variant="filled"
                    size="small"
                  />
                </div>
              </div>
            </JTabPanel>
          </JTabs>

          <div style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "flex-end"
          }}>
          <button>
            import
          </button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default ImportComponent;
