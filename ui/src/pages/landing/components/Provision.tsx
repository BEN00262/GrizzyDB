import Editor from "@monaco-editor/react";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import StorageIcon from "@mui/icons-material/Storage";
import LoadingButton from "@mui/lab/LoadingButton";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
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
  connect_external_database,
  import_from_external_database,
} from "../api";
import { DatabaseCredentialsForm, IExternalCredentials } from "./Import";
import {
  get_available_database,
  get_available_sample_data_templates,
  provision_database,
} from "./api";

import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

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

const ProvisionModal = () => {
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

  const { data: selectable_dbs } = useQuery(
    ["available-datababes"],
    get_available_database,
    {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000 * 60, // 30 mins
    }
  );

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

  React.useEffect(() => {
    if (['chromadb', 'rethinkdb'].includes(databaseTemplate.dialect)) {
      setDatabaseTemplate(old => ({ ...old, selected_template: 'none' }))
    }
  }, [databaseTemplate.dialect])

  const [opened, { open, close }] = useDisclosure(false);

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

      if (databaseTemplate.selected_template === "external-import") {
        return import_from_external_database(
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
        close();
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
      <Modal
        opened={opened}
        fullScreen
        transitionProps={{ transition: "fade", duration: 200 }}
        onClose={close}
      >
        <Container>
          <Alert
            style={{
              marginBottom: "20px",
            }}
            severity="warning"
          >
            Limited to a <b>20MB</b> per database on the <b>free</b> version.
          </Alert>

          <Grid container spacing={2} style={{
            marginBottom: "20px"
          }}>
            {databases.map((database, position) => {
              return (
                <Grid xs={6} md={4} lg={2} sm={4} key={position}>
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
                  disabled={['chromadb', 'rethinkdb'].includes(databaseTemplate.dialect)}
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
                  value="external-import"
                  disabled={['chromadb', 'rethinkdb'].includes(databaseTemplate.dialect)}
                  control={
                    <Radio
                      checked={
                        databaseTemplate.selected_template === "external-import"
                      }
                    />
                  }
                  label={
                    <span className="action-text">
                      Import from external database
                    </span>
                  }
                />

                <FormControlLabel
                  className="select-radio"
                  value="sample"
                  disabled={['chromadb', 'rethinkdb'].includes(databaseTemplate.dialect)}
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
                  disabled={['chromadb', 'rethinkdb'].includes(databaseTemplate.dialect)}
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
                  label={<span className="action-text">Schema management</span>}
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

            {databaseTemplate.selected_template === "external-import" ? (
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
                : databaseTemplate.selected_template === "external-import"
                ? "import database(s)"
                : "provision"}
            </LoadingButton>
          </div>
        </Container>
      </Modal>

      <Button
        variant="outlined"
        className="action-text"
        size="small"
        style={{
          color: "black",
          border: "1px solid #000",
        }}
        endIcon={<StorageIcon />}
        onClick={open}
      >
        create database
      </Button>
    </>
  );
};

export default ProvisionModal;
