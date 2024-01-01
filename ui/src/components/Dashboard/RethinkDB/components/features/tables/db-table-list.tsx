import { CardActions, Chip, Paper, styled, Typography } from "@mui/material";
import React from "react";

import { admin, useRequest } from "../rethinkdb";

import { CreateTableModal } from "./create-table-modal";
import { tableListQuery } from "./queries";
import { TableList } from "./table-list";
import { EnrichedDatabaseEntry } from "./types";

export function useTableEntries(database_name: string): null | EnrichedDatabaseEntry[] {
  const dbFeed = admin(database_name).db_config.changes();
  const tableFeed = admin(database_name).table_status.changes();

  const cList = [dbFeed, tableFeed];

  const [state] = useRequest<EnrichedDatabaseEntry[]>(tableListQuery(database_name), cList);

  return state;
}

const NoTablePaper = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: "center",
  color: theme.palette.text.secondary,
  backgroundColor: "#efefef",
  padding: theme.spacing(1),
}));

export const FullTableList = React.memo(
  ({ entries }: { entries: EnrichedDatabaseEntry[] }) => {

    if (!Array.isArray(entries)) {
      return <div>loading</div>;
    }

    return (
      <>
        {entries.map((entry) => (
          <Paper
            key={entry.id}
            sx={{
              marginBottom: 2,
              marginTop: 1,
              padding: 1,
              width: "100%",
              border: "1px solid #d3d3d3",
            }}
            elevation={0}
          >
            <Typography gutterBottom variant="h5" component="h2">
              <Chip color="primary" label="DATABASE" sx={{ marginRight: 1 }} />
              {entry.name}
            </Typography>
            {entry.tables.length > 0 ? (
              <TableList tables={entry.tables} />
            ) : (
              <NoTablePaper elevation={0}>
                There are no tables in this database
              </NoTablePaper>
            )}
            <CardActions>
              <CreateTableModal dbName={entry.name} />
            </CardActions>
          </Paper>
        ))}
      </>
    );
  }
);
