import Textarea from "@mui/joy/Textarea";
import LoadingButton from "@mui/lab/LoadingButton";
import { Divider } from "antd";
import { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IDatabaseDisplay } from "../../context/types";
import { BringYourOwnDBUI } from "../landing";
import SQLEditorComp from "../landing/components/PopupEditor";
import { delete_database, get_database, update_database_metadata } from "./api";
import ImportComponent from "../landing/components/Import";
import ExportComponent from "../landing/components/Export";
import RelationalDB from "../../components/Dashboard/RelationalDB";
import ChromaDB from "../../components/Dashboard/ChromaDB";
import RethinkDB from "../../components/Dashboard/RethinkDB";

function BringYourOwnDB({ database }: { database: IDatabaseDisplay }) {
  const params = useParams();
  const [title, setTitle] = useState(database.name ?? "");

  const navigate = useNavigate();
  const location = useLocation();

  const handleDeleteDB = useMutation(() => delete_database(params.id ?? ""), {
    onSuccess: () => {
      if (location.key === "default") {
        return navigate("-1", { replace: true });
      }

      return navigate("/dashboard", { replace: true });
    },
  });

  const handleMetadataUpdate = useMutation(
    () => update_database_metadata(params.id ?? "", { name: title }),
    {
      onSuccess: () => {
        // remove_database(dispatch, params.id);
      },
    }
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 2 }}>
          <Textarea
            placeholder="Type database / project name..."
            variant="plain"
            onBlur={(e) => {
              handleMetadataUpdate.mutate();
            }}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            value={title}
            sx={{
              "--Textarea-focusedInset": "var(--any, )",
              "--Textarea-focusedThickness": "1px",
              "--Textarea-focusedHighlight": "transparent",
              "&::before": {
                transition: "box-shadow .15s ease-in-out",
              },
              "&:focus-within": {
                borderColor: "#86b7fe",
              },
              backgroundColor: "transparent",
              fontFamily: "'Sofia Sans Condensed', sans-serif",
              fontWeight: "bold",
              fontSize: "1.3rem",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <LoadingButton
            variant="text"
            loading={handleDeleteDB.isLoading}
            onClick={() => handleDeleteDB.mutate()}
            size="small"
            color="error"
          >
            delete
          </LoadingButton>
        </div>
      </div>

      <Divider />

      <div
        style={{
          marginTop: "20px",
          height: "75vh",
        }}
      >
        <BringYourOwnDBUI {...database} />
      </div>
    </>
  );
}

export function DBDisplayFactory({ database }: { database: IDatabaseDisplay }) {
  switch (database.dialect) {
    case "chromadb":
      return <ChromaDB {...database} />;
    case "rethinkdb":
      return <RethinkDB {...database} />;
  }

  return <RelationalDB {...database} />;
}

function HostedDB({ database }: { database: IDatabaseDisplay }) {
  const params = useParams();
  const [title, setTitle] = useState(database.name ?? "");

  const handleMetadataUpdate = useMutation(
    () => update_database_metadata(params.id ?? "", { name: title }),
    {
      onSuccess: () => {
        // remove_database(dispatch, params.id);
      },
    }
  );

  const handleDeleteDB = useMutation(() => delete_database(params.id ?? ""), {
    onSuccess: () => {
      // remove_database(dispatch, params.id);
    },
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 2 }}>
          <Textarea
            placeholder="Type database / project name..."
            variant="plain"
            onBlur={(e) => {
              handleMetadataUpdate.mutate();
            }}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            value={title}
            sx={{
              "--Textarea-focusedInset": "var(--any, )",
              "--Textarea-focusedThickness": "1px",
              "--Textarea-focusedHighlight": "transparent",
              "&::before": {
                transition: "box-shadow .15s ease-in-out",
              },
              "&:focus-within": {
                borderColor: "#86b7fe",
              },
              backgroundColor: "transparent",
              fontFamily: "'Sofia Sans Condensed', sans-serif",
              fontWeight: "bold",
              fontSize: "1.3rem",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          {["postgres", "mariadb", "mysql"].includes(database.dialect) ? (
            <>
              <SQLEditorComp />
              <div
                style={{
                  height: "20px",
                  border: "1px solid #efefef",
                }}
              />
            </>
          ) : null}
          {/* <div style={{
            height: "20px",
            border: "1px solid #efefef"
          }}/>
          <ImportComponent/>
          <div style={{
            height: "20px",
            border: "1px solid #efefef"
          }}/>
          <ExportComponent/> */}
          <LoadingButton
            variant="text"
            loading={handleDeleteDB.isLoading}
            onClick={() => handleDeleteDB.mutate()}
            size="small"
            color="error"
          >
            delete
          </LoadingButton>
        </div>
      </div>

      <Divider />

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <DBDisplayFactory database={database} />
      </div>
    </>
  );
}

export default function DatabaseView() {
  const params = useParams();

  // get the database
  const { data: database } = useQuery(
    ["fetch-database", params.id],
    () => get_database(params.id ?? ""),
    {
      enabled: !!params.id,
    }
  );

  if (!database) {
    return null;
  }

  return (
    <>
      {database.product_type === "bring_your_own" ? (
        <BringYourOwnDB database={database} />
      ) : (
        <HostedDB database={database} />
      )}
    </>
  );
}
