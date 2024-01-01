import JTab, { tabClasses } from "@mui/joy/Tab";
import JTabList from "@mui/joy/TabList";
import JTabPanel from "@mui/joy/TabPanel";
import JTabs from "@mui/joy/Tabs";
import { IDatabaseDisplay } from "../../../context/types";
import { Credentials } from "../../../pages/landing";
import { DashboardPage } from "./components/features/dashboard/dashboard-page";
import { TablesPage } from "./components/features/tables/tables-page";
import { DataExplorerPage } from "./components/features/data-explorer/data-explorer-page";

// this is the default to any db thats relational
function RethinkDB({ credentials, _id }: IDatabaseDisplay) {
  return (
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
        {/* <JTab>Dashboard</JTab> */}
        <JTab>Tables</JTab>
        <JTab>Data Explorer</JTab>
        <JTab>Credentials</JTab>
      </JTabList>

      {/* <JTabPanel value={0} sx={{ height: "75vh" }}>
        <DashboardPage/>
      </JTabPanel> */}

      <JTabPanel value={0} sx={{ height: "75vh" }}>
        <TablesPage/>
      </JTabPanel>

      <JTabPanel value={1} sx={{ height: "75vh" }}>
        <DataExplorerPage/>
      </JTabPanel>

      <JTabPanel value={2} sx={{ height: "75vh" }}>
        <div
          style={{
            height: "400px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxSizing: "border-box",
            padding: "10px",
            gap: "4px",
          }}
        >
          <Credentials credentials={credentials} />
        </div>
      </JTabPanel>
    </JTabs>
  );
}

export default RethinkDB;
