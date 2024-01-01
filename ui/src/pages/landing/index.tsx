import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import * as React from "react";
import { Container } from "react-bootstrap";
import { useQuery } from "react-query";
import {
  switch_active_database,
  useGrizzyDBDispatch,
  useGrizzyDBState,
} from "../../context";
import { ICredential, IDatabaseDisplay } from "../../context/types";
import { get_monitor_installation_instructions } from "./api";
import Hero from "./components/Hero";
import "./index.css";

import { useAuth } from "@clerk/clerk-react";
import JTab, { tabClasses } from "@mui/joy/Tab";
import JTabList from "@mui/joy/TabList";
import JTabPanel from "@mui/joy/TabPanel";
import JTabs from "@mui/joy/Tabs";
import copy from "copy-to-clipboard";
import { useNavigate } from "react-router";
import { PricingContainer } from "../../components/Pricing";
import { DBDisplayFactory } from "../../pages/database";
import { FooterSocial } from "./components/Footer";
import Markdown from "./components/Markdown";
import Snapshots from "./components/Snapshots";
import { FeaturesGrid } from "./components/WhatWeOffer";

const Credential: React.FC<ICredential> = ({ credentialKey, value }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "20px",
        marginBottom: "10px",
        justifyContent: "center",
      }}
    >
      <div style={{ flex: 4 }}>
        <b>{credentialKey.replace("DB_", "")}</b>
      </div>
      <div>{value}</div>
    </div>
  );
};

export function Credentials({ credentials }: { credentials: ICredential[] }) {
  const credentials_for_copy = React.useMemo(() => {
    return credentials
      .map(({ credentialKey, value }) => `${credentialKey} = ${value}`)
      .join("\n");
  }, [credentials]);

  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return (
    <Container>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          className="credentials"
          onClick={() => {
            copy(credentials_for_copy);
            setCopied(true);
          }}
        >
          {copied ? (
            <div
              style={{
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              copied
            </div>
          ) : null}
          {credentials.map(({ credentialKey, value, isHidden }, position) => {
            return (
              <Credential
                key={position}
                credentialKey={credentialKey}
                value={value}
                isHidden={isHidden}
              />
            );
          })}
        </div>
      </div>
    </Container>
  );
}

export function BringYourOwnDBUI({ _id }: IDatabaseDisplay) {
  const { data: instructions } = useQuery(
    ["instructions"],
    () => get_monitor_installation_instructions(_id),
    {
      refetchOnWindowFocus: false,
      enabled: !!_id,
      refetchOnMount: true,
    }
  );

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
        <JTab>ERD</JTab>
        <JTab>Installation (instructions)</JTab>
        {/* <JTab>Snapshots (versions)</JTab> */}
        {/* <JTab>Analytics</JTab> */}
        {/* <JTab>Notifications</JTab> */}
      </JTabList>

      <JTabPanel value={0} sx={{ height: "75vh" }}>
        <Snapshots />
      </JTabPanel>

      <JTabPanel value={1} sx={{ height: "fit-content" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box",
            padding: "10px",
          }}
        >
          <Markdown markdown={instructions ?? ""} />
        </div>
      </JTabPanel>
    </JTabs>
  );
}

export function LabTabs() {
  const dispatch = useGrizzyDBDispatch();
  const [value, setValue] = React.useState("0");

  const { databases } = useGrizzyDBState();

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue);
    switch_active_database(dispatch, +newValue);
  };

  return (
    <Box
      sx={{
        width: "100%",
        border: "1px solid #d3d3d3",
        background: "white",
        typography: "body1",
        borderRadius: "2px",
      }}
    >
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleChange}
            scrollButtons
            aria-label="lab API tabs example"
          >
            {databases.map((database, position) => {
              return (
                <Tab
                  label={database.name}
                  value={position.toString()}
                  key={position}
                />
              );
            })}
          </TabList>
        </Box>
        {databases.map((database, position) => {
          return (
            <TabPanel value={position.toString()} key={position}>
              <DBDisplayFactory database={database} />
            </TabPanel>
          );
        })}
      </TabContext>
    </Box>
  );
}

const LandingPage = () => {
  // check if we are signed in already and redirect to dashboard
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  // if (isSignedIn) {
  //   navigate("/dashboard", { replace: true });
  // }

  return (
    <div>
      <div
        style={{
          position: "absolute",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 10px",
        }}
      >
        <img
          src="/logo.png"
          alt="Grizzy DB logo"
          style={{
            height: "100px",
            width: "100px",
            objectFit: "contain",
          }}
        />

        {/* <div style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px"
        }}>
        <div>Features</div>
        <div>Pricing</div>
        </div> */}
      </div>
      <Hero />

      <>
        {/* find a way to join them together */}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "100px",
            gap: "5px",
            padding: "50px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 3,
            }}
          >
            <img
              src="/create.png"
              style={{
                width: "100%",
                borderRadius: "2px",
                objectFit: "contain",
                border: "1px solid #d3d3d3",
                transform: "rotate(10deg)",
              }}
            />
          </div>
          <div
            style={{
              flex: 3,
            }}
          >
            <img
              src="/home.png"
              style={{
                width: "100%",
                borderRadius: "2px",
                objectFit: "contain",
                border: "1px solid #d3d3d3",
              }}
            />
          </div>
          <div
            style={{
              flex: 3,
            }}
          >
            <img
              src="/database.png"
              style={{
                width: "100%",
                borderRadius: "2px",
                objectFit: "contain",
                border: "1px solid #d3d3d3",
                transform: "rotate(10deg)",
              }}
            />
          </div>
        </div>
      </>

      <Container>
        <FeaturesGrid />
      </Container>

      <>
        {/* find a way to join them together */}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "100px",
            gap: "5px",
            padding: "50px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 3,
            }}
          >
            <img
              src="/insights.png"
              style={{
                width: "100%",
                borderRadius: "2px",
                objectFit: "contain",
                border: "1px solid #d3d3d3",
                transform: "rotate(10deg)",
              }}
            />
          </div>
          <div
            style={{
              flex: 3,
            }}
          >
            <img
              src="/snapshots.png"
              style={{
                width: "100%",
                borderRadius: "2px",
                objectFit: "contain",
                border: "1px solid #d3d3d3",
                transform: "rotate(-10deg)",
              }}
            />
          </div>
        </div>
      </>

      <Container
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <PricingContainer />
      </Container>

      <FooterSocial />
    </div>
  );
};

export default LandingPage;
