import Editor from "@monaco-editor/react";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import LoadingButton from "@mui/lab/LoadingButton";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Modal from "@mui/material/Modal";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Tab from "@mui/material/Tab";
import Grid from "@mui/material/Unstable_Grid2";
import { isAxiosError } from "axios";
import * as React from "react";
import { useMemo } from "react";
import { Container } from "react-bootstrap";
import { useMutation, useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { GrizzyQueryClient } from "../../../App";
import {
  DBDialect,
  IDatabase,
  IDatabaseTemplate,
  ISampleTemplate,
  Template,
} from "../../../context/types";
import {
  get_available_database,
  get_available_sample_data_templates,
  provision_database,
} from "./api";
import { DatabaseCredentialsForm, IExternalCredentials } from "./Import";
import { connect_external_database } from "../api";

export const DBCard: React.FC<{
  database: IDatabase;
  selected_dialect: DBDialect;
  onSelected: () => void;
}> = ({
  database: { dialect, logo, enabled },
  selected_dialect,
  onSelected,
}) => {
  return (
    <div
      style={{
        border: `1px solid ${
          selected_dialect === dialect ? "#2992d7" : "#efefef"
        }`,
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
      <img
        src={logo}
        alt=""
        style={{
          height: "100px",
          width: "100px",
          objectFit: "contain",
        }}
      />
    </div>
  );
};

const SampleDataEditor: React.FC<
  ISampleTemplate & {
    handleEditorChange: (value: string | undefined, event: any) => void;
  }
> = ({ sql_statements, handleEditorChange }) => {
  return (
    <Editor
      height="30vh"
      defaultLanguage="sql"
      value={sql_statements}
      onChange={handleEditorChange}
    />
  );
};

const YourSchemaEditor: React.FC<{
  handleEditorChange: (value: string | undefined, event: any) => void;
}> = ({ handleEditorChange }) => {
  return (
    <div
      style={{
        border: "1px solid #efefef",
        boxSizing: "border-box",
        padding: "10px",
      }}
    >
      <Editor
        height="30vh"
        defaultLanguage="sql"
        value={`-- copy your sql schema and paste here. The data will be generated using ChatGPT
          
-- -- Customers table
-- CREATE TABLE IF NOT EXISTS Customers (
--   customer_id INT AUTO_INCREMENT PRIMARY KEY,
--   customer_name VARCHAR(50) NOT NULL,
--   email VARCHAR(100) NOT NULL,
--   phone VARCHAR(20) NOT NULL,
--   address VARCHAR(200) NOT NULL
-- );

-- -- Products table
-- CREATE TABLE IF NOT EXISTS Products (
--   product_id INT AUTO_INCREMENT PRIMARY KEY,
--   product_name VARCHAR(100) NOT NULL,
--   price DECIMAL(10, 2) NOT NULL
-- );

-- -- Orders table
-- CREATE TABLE IF NOT EXISTS Orders (
--   order_id INT AUTO_INCREMENT PRIMARY KEY,
--   customer_id INT NOT NULL,
--   product_id INT NOT NULL,
--   quantity INT NOT NULL,
--   order_date DATE NOT NULL,
--   FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
--   FOREIGN KEY (product_id) REFERENCES Products(product_id)
-- );
          `}
        onChange={handleEditorChange}
      />
    </div>
  );
};

function SampleDataTabs({
  current_dialect,
  handleSampleDataChange,
  handleEditorChange,
}: {
  current_dialect: DBDialect;
  handleSampleDataChange: (template: string) => void;
  handleEditorChange: (value: string | undefined, event: any) => void;
}) {
  const [value, setValue] = React.useState("1");
  const [_samples, setSamples] = React.useState<ISampleTemplate[]>([]);

  const samples = useMemo(() => {
    return _samples.filter((sample) => sample.dialect === current_dialect);
  }, [_samples, current_dialect]);

  useQuery(["database-data-templates"], get_available_sample_data_templates, {
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    onSuccess: (data) => {
      setSamples(data);
    },
  });

  React.useEffect(() => {
    const position = +value;

    if (!isNaN(position) && position > 0) {
      handleSampleDataChange(samples?.[+value - 1]?.sql_statements ?? "");
    }
  }, [samples]);

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue);
    handleSampleDataChange(samples?.[newValue]?.sql_statements ?? "");
  };

  return (
    <Box
      sx={{
        width: "100%",
        typography: "body1",
        border: "1px solid #efefef",
        borderRadius: "2px",
        boxSizing: "border-box",
        padding: "2px",
        marginTop: "10px",
      }}
    >
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            {samples.map((sample, position) => {
              return (
                <Tab
                  label={sample.name}
                  value={`${position + 1}`}
                  key={position}
                />
              );
            })}
          </TabList>
        </Box>
        {samples.map((sample, position) => {
          return (
            <TabPanel value={`${position + 1}`} key={position}>
              <SampleDataEditor
                {...sample}
                handleEditorChange={handleEditorChange}
              />
            </TabPanel>
          );
        })}
      </TabContext>
    </Box>
  );
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "58vw",
  bgcolor: "background.paper",
  border: "1px solid #efefef",
  boxShadow: 24,
  borderRadius: "2px",
  p: 4,
};

const ProvisionModal: React.FC<{
  open: boolean;
  handleClose: () => void;
}> = ({ open, handleClose }) => {
  const [databaseTemplate, setDatabaseTemplate] =
    React.useState<IDatabaseTemplate>({
      dialect: "mariadb",
      product_type: "hosted",
      selected_template: "sample",
      sample_data_template: "",
      custom_schema_template: "",
    });

  const [databases, setDatabases] = React.useState<IDatabase[]>([]);
  const [value, setValue] = React.useState("none");
  const [error, setError] = React.useState<Error | null>(null);

  const [credentials, setCredentials] = React.useState<IExternalCredentials>({
    DB_HOST: "",
    DB_PASSWORD: "",
    DB_USER: "",
  });

  const [databases_selected, setDatabasesSelected] = React.useState<string[]>(
    []
  );

  const params = useParams();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = (event.target as HTMLInputElement).value;
    setValue(selected);

    setDatabaseTemplate({
      ...databaseTemplate,
      selected_template: selected as Template,
      product_type: selected === "bring_your_own" ? "bring_your_own" : "hosted",
    });
  };

  function handleEditorChange(key: string) {
    return (value: string | undefined, event: any) => {
      setDatabaseTemplate((old) => ({
        ...old,
        [key]: value,
      }));
    };
  }

  const { data: selectable_dbs } = useQuery(["available-datababes"], get_available_database, {
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000 * 60, // 30 mins
  });

  React.useEffect(() => {
    if (Array.isArray(selectable_dbs)) {
      setDatabases(selectable_dbs);
    }
  }, [selectable_dbs]);

  const handleSampleDataChange = (value: string) => {
    setDatabaseTemplate({
      ...databaseTemplate,
      sample_data_template: value,
    });
  };

  const handleProvisionRequest = useMutation(
    async () => {
      setError(null);

      if (databaseTemplate.selected_template === "external") {
        return connect_external_database(
          {
            dialect: databaseTemplate.dialect,
            credentials,
            databases_selected,
          },
          params?.folder_id
        );
      }

      return provision_database(databaseTemplate, params?.folder_id);
    },
    {
      onSuccess: (data) => {
        GrizzyQueryClient.invalidateQueries(["my-databases"]);
        handleClose();
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
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Container>
          <Alert
            style={{
              marginBottom: "20px",
            }}
            severity="info"
          >
            Limited to a <b>100MB</b> per database on the BETA version ().{" "}
            <b>The databases are deleted after 24hrs</b>
          </Alert>

          <Grid container spacing={2}>
            {databases.map((database, position) => {
              return (
                <Grid xs={6} sm={3} key={position}>
                  <DBCard
                    database={database}
                    onSelected={() =>
                      setDatabaseTemplate((old) => ({
                        ...old,
                        dialect: database.dialect,
                      }))
                    }
                    selected_dialect={databaseTemplate.dialect}
                  />
                </Grid>
              );
            })}
          </Grid>

          <div style={{ marginTop: "10px" }}>
            <div
              style={{
                padding: "10px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #d3d3d3",
                marginBottom: "10px",
                borderRadius: "2px",
                backgroundColor: "#e5f6fd",
              }}
            >
              <RadioGroup
                row
                aria-labelledby="demo-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={value}
                onChange={handleChange}
                style={{
                  display: "grid",
                  rowGap: "5px",
                  gridTemplate: "auto / auto auto auto auto",
                }}
              >
                <FormControlLabel
                  className="select-radio"
                  value="none"
                  control={
                    <Radio
                      checked={databaseTemplate.selected_template === "none"}
                    />
                  }
                  label={
                    <span className="action-text">
                      Start with a clean database
                    </span>
                  }
                />
                <FormControlLabel
                  className="select-radio"
                  value="external"
                  control={
                    <Radio
                      checked={
                        databaseTemplate.selected_template === "external"
                      }
                    />
                  }
                  label={
                    <span className="action-text">
                      Connect to external database
                    </span>
                  }
                />
                <FormControlLabel
                  className="select-radio"
                  value="sample"
                  control={
                    <Radio
                      checked={databaseTemplate.selected_template === "sample"}
                    />
                  }
                  label={
                    <span className="action-text">
                      Use sample schema and data
                    </span>
                  }
                />
                <FormControlLabel
                  className="select-radio"
                  value="custom"
                  control={
                    <Radio
                      checked={databaseTemplate.selected_template === "custom"}
                    />
                  }
                  label={
                    <span className="action-text">
                      Import your database schema
                    </span>
                  }
                />
                <FormControlLabel
                  className="select-radio"
                  value="bring_your_own"
                  control={
                    <Radio
                      checked={
                        databaseTemplate.selected_template === "bring_your_own"
                      }
                      disabled
                    />
                  }
                  label={
                    <span className="action-text">
                      Import your database schema
                    </span>
                  }
                />
              </RadioGroup>
            </div>

            {databaseTemplate.selected_template === "custom" ? (
              <YourSchemaEditor
                handleEditorChange={handleEditorChange(
                  "custom_schema_template"
                )}
              />
            ) : null}

            {databaseTemplate.selected_template === "external" ? (
              <DatabaseCredentialsForm
                dialect={databaseTemplate.dialect}
                credentials={credentials}
                setCredentials={setCredentials}
                setDatabasesSelected={setDatabasesSelected}
              />
            ) : null}

            {databaseTemplate.selected_template === "sample" ? (
              <SampleDataTabs
                current_dialect={databaseTemplate.dialect}
                handleEditorChange={handleEditorChange("sample_data_template")}
                handleSampleDataChange={handleSampleDataChange}
              />
            ) : null}
          </div>

          {error ? (
            <Alert
              style={{
                marginTop: "20px",
                marginBottom: "10px",
              }}
              severity="error"
            >
              {error.message}
            </Alert>
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
              width: "100%",
              marginTop: "20px",
            }}
          >
            <LoadingButton
              variant="outlined"
              size="small"
              loading={handleProvisionRequest.isLoading}
              onClick={() => handleProvisionRequest.mutate()}
              startIcon={<PlayCircleFilledWhiteIcon />}
            >
              {databaseTemplate.selected_template === "external"
                ? "connect"
                : "provision"}
            </LoadingButton>
          </div>
        </Container>
      </Box>
    </Modal>
  );
};

export default ProvisionModal;
