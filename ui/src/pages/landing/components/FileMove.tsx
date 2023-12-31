import Editor from "@monaco-editor/react";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import StorageIcon from "@mui/icons-material/Storage";
import LoadingButton from "@mui/lab/LoadingButton";
import { Divider } from "@mui/material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { isAxiosError } from "axios";
import MUIDataTable from "mui-datatables";
import * as React from "react";
import { Col, Row } from "react-bootstrap";
import { LuNetwork } from "react-icons/lu";
import { useMutation, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { useGrizzyDBState } from "../../../context";
import { IDBQuery } from "../../../context/types";
import { create_folder, query_database } from "./api";

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
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const EditorTabs: React.FC<{
  handleEditorChange: (
    mode: "sql" | "text"
  ) => (value: string | undefined, event: any) => void;
}> = ({ handleEditorChange }) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", marginBottom: "20px" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="SQL" {...a11yProps(0)} />
          <Tab label="AI (ChatGPT)" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <YourSQLPromptEditor
          handleEditorChange={handleEditorChange("sql")}
          mode="sql"
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <YourSQLPromptEditor
          handleEditorChange={handleEditorChange("text")}
          mode="text"
        />
      </TabPanel>
    </Box>
  );
};

function generate_columns_from_row_data(row: { [key: string]: any }) {
  return Object.keys(row); /*.map(key => ({
    field: key,
    headerName: key,
    width: 150,
    editable: false,
  }));*/
}

// this gets a query and the mode to send to the backend and then sends
const DBDataGrid: React.FC<IDBQuery> = ({ query, mode }) => {
  const [grid_data, setGridData] = React.useState<{
    columns: string[];
    rows: any[];
  }>({ columns: [], rows: [] });

  const [error, setError] = React.useState<Error | null>(null);

  // const { active_database } = useActiveDatabase();
  const params = useParams();

  const handleQueryDatabase = useMutation(
    async () => {
      setError(null);

      // check if the query is empty
      if (!query) {
        return;
      }

      return await query_database(params?.id ?? "", {
        query,
        mode,
      });
    },
    {
      onSuccess: (data) => {
        if (data?.length) {
          const has_id = Object.keys(data?.[0] ?? {}).includes("id");

          setGridData({
            columns: data ? generate_columns_from_row_data(data[0]) : [],
            rows: (data ?? []).map((x, position) => ({
              ...x,
              ...(has_id ? {} : { id: position + 1 }),
            })),
          });
        }
      },

      onError: (error: Error) => {
        if (isAxiosError(error)) {
          setError(new Error(error.response?.data?.data?.errors?.join("\n")));

          return;
        }

        setError(error);
      },
    }
  );

  return (
    <>
      {error ? (
        <Alert
          style={{
            marginBottom: "20px",
          }}
          severity="error"
        >
          {error.message}
        </Alert>
      ) : null}

      <LoadingButton
        onClick={() => handleQueryDatabase.mutate()}
        variant="outlined"
        size="small"
        loading={handleQueryDatabase.isLoading}
        startIcon={<PlayCircleIcon />}
      >
        Run Query
      </LoadingButton>
      {grid_data.columns.length ? (
        <Box
          sx={{
            height: 400,
            width: "100%",
            marginTop: "20px",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#efefef",
            },
          }}
        >
          <MUIDataTable
            title={""}
            data={grid_data.rows.map((x) => Object.values(x))}
            columns={grid_data.columns}
            options={{
              filterType: "checkbox",
              count: 10,
              elevation: 0,
              print: false,
            }}
          />
        </Box>
      ) : null}
    </>
  );
};

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "70%",
  bgcolor: "background.paper",
  border: "1px solid #efefef",
  boxShadow: 24,
  borderRadius: "2px",
  p: 4,
};

const YourSQLPromptEditor: React.FC<{
  handleEditorChange: (value: string | undefined, event: any) => void;
  mode: "sql" | "text";
}> = ({ handleEditorChange, mode }) => {
  return (
    <div
      style={{
        border: "1px solid #efefef",
        boxSizing: "border-box",
        padding: "10px",
      }}
    >
      <Editor
        height="200px"
        defaultLanguage={mode}
        options={{
          minimap: { enabled: false },
        }}
        onChange={handleEditorChange}
      />
    </div>
  );
};

const FileMoveComp = () => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const queryClient = useQueryClient();

  const params = useParams();

  const { databases } = useGrizzyDBState();

  const [selectedFiles, setSelectedFiles] = React.useState<string[]>([]);
  const [folderName, setFolderName] = React.useState("");

  const handleFolderCreate = useMutation(() => {
    return create_folder(folderName, selectedFiles);
  }, {
    onSuccess: (data) => {
      // invalidate the data
      queryClient.invalidateQueries(['my-databases'])
    }
  });

  return (
    <>
      {params?.folder_id ? (
        <Button
          variant="outlined"
          className="action-text"
          size="small"
          style={{
            color: "black",
            // fontWeight: "bold",
            // letterSpacing: "2px",
            border: "1px solid #000",
          }}
          endIcon={<DriveFileMoveOutlinedIcon />}
          onClick={handleOpen}
        >
          add database files
        </Button>
      ) : null}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Divider
            className="action-text"
            style={{
              margin: "20px auto",
            }}
          >
            Choose databases to include in this folder
          </Divider>
          <Row
            style={{
              height: "500px",
              overflowY: "auto",
            }}
          >
            {databases.map((database, position) => {
              return (
                <Col xs={6} md={4} lg={2} key={position}>
                  <div
                    style={{
                      border: `1px solid ${
                        selectedFiles.includes(database._id) ? "" : "#efefef"
                      }`,
                      borderRadius: "5px",
                      height: "200px",
                      padding: "5px",
                      boxSizing: "border-box",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "5px",
                      alignItems: "center",
                      margin: "20px auto",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                      textOverflow: "ellipsis",
                    }}
                    onClick={() => {
                      setSelectedFiles(
                        selectedFiles.includes(database._id)
                          ? selectedFiles.filter((x) => x !== database._id)
                          : [...selectedFiles, database._id]
                      );
                    }}
                  >
                    {database.product_type === "bring_your_own" ? (
                      <LuNetwork
                        style={{
                          height: "24px",
                          width: "24px",
                        }}
                      />
                    ) : (
                      <StorageIcon
                        style={{
                          height: "24px",
                          width: "24px",
                        }}
                      />
                    )}
                    <span className="action-text">{database.dialect}</span>
                    <br />
                    <div>
                      <span className="action-text">{database.name}</span>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
          <LoadingButton
            onClick={() => handleFolderCreate.mutate()}
            variant="outlined"
            size="small"
            loading={handleFolderCreate.isLoading}
          >
            Move
          </LoadingButton>
        </Box>
      </Modal>
    </>
  );
};

export default FileMoveComp;
