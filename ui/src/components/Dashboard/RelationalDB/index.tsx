import JTab, { tabClasses } from "@mui/joy/Tab";
import JTabList from "@mui/joy/TabList";
import JTabPanel from "@mui/joy/TabPanel";
import JTabs from "@mui/joy/Tabs";
import { Divider } from "@mui/material";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Tooltip from "@mui/material/Tooltip";
import { IDatabaseDisplay } from "../../../context/types";
import Snapshots from "../../../pages/landing/components/Snapshots";
import TimestepSnapshotComp from "../../../pages/landing/components/TimestepSnapshot";
import InsightsTab from "../../../pages/landing/components/Insights";
import { Credentials } from "../../../pages/landing";
import SQLEditorComp from "../../../pages/landing/components/PopupEditor";
import SnippetEditorComp, { SnippetEditorWrapperComp } from "../../../pages/landing/components/SnippetEditor";

// this is the default to any db thats relational
function RelationalDB({ credentials, _id }: IDatabaseDisplay) {
  return (
    <div className="scroll-style" style={{
      overflowX: "hidden",
      overflowY: "auto",
      // padding: "0px 20px"
    }}>
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
        <JTab>ERD</JTab>
        <JTab>Snapshots</JTab>
        <JTab>Insights</JTab>
        <JTab>Credentials</JTab>
      </JTabList>

      <JTabPanel value={0} sx={{ height: "75vh" }}>
        <Snapshots />
      </JTabPanel>

      <JTabPanel value={1} sx={{ height: "75vh" }}>
        <TimestepSnapshotComp />
      </JTabPanel>

      <JTabPanel value={2} sx={{ height: "75vh" }}>
        <InsightsTab />
      </JTabPanel>

      <JTabPanel value={3} sx={{ height: "75vh" }}>
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
    </div>
  );
}

export default RelationalDB;
