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
import { Snackbar } from "@mui/material";

function BringYourOwnDB({
  database,
  share,
}: {
  database: IDatabaseDisplay;
  share?: boolean;
}) {
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
      {share ? (
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
                disabled={true}
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
          </div>

          <Divider />
        </>
      ) : (
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
                color="success"
              >
                share
              </LoadingButton>

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
        </>
      )}

      <div
        style={{
          marginTop: "20px",
          height: "75vh",
        }}
      >
        <BringYourOwnDBUI {...database} share={share} />
      </div>
    </>
  );
}

export function DBDisplayFactory({
  database,
  share,
}: {
  database: IDatabaseDisplay;
  share?: boolean;
}) {
  // switch (database.dialect) {
  //   case "chromadb":
  //     return <ChromaDB {...database} />;
  //   // case "rethinkdb":
  //   //   return <RethinkDB {...database} />;
  // }

  return <RelationalDB {...database} share={share} />;
}

function HostedDB({
  database,
  share,
}: {
  database: IDatabaseDisplay;
  share?: boolean;
}) {
  const params = useParams();
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState(database.name ?? "");

  const navigate = useNavigate();
  const location = useLocation();

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
      if (location.key === "default") {
        return navigate("-1", { replace: true });
      }

      return navigate("/dashboard", { replace: true });
    },
  });

  return (
    <>
      {share ? (
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
              placeholder="Database / project name..."
              variant="plain"
              disabled={true}
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
        </div>

        <Divider />
      </>
      ) : (
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
              <LoadingButton
                variant="text"
                loading={handleDeleteDB.isLoading}
                onClick={() => {
                  // copy link
                  navigator.clipboard.writeText(
                    `${window.location.origin}/share/${params.id}`
                  );

                  setCopied(true);

                  setTimeout(() => {
                    setCopied(false);
                  }, 1000);
                }}
                size="small"
                color="primary"
              >
                share
              </LoadingButton>

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
        </>
      )}

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <DBDisplayFactory database={database} share={share} />
      </div>

      <Snackbar
        open={copied}
        autoHideDuration={1000}
        onClose={() => setCopied(false)}
        message="Share Link Copied to Clipboard"
      />
    </>
  );
}

export default function DatabaseView({ share }: { share?: boolean }) {
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
        <BringYourOwnDB database={database} share={share} />
      ) : (
        <HostedDB database={database} share={share} />
      )}
    </>
  );
}
