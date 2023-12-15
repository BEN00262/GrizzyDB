import {
  Center,
  Navbar,
  Stack,
  Tooltip,
  UnstyledButton,
  createStyles,
  rem,
} from "@mantine/core";
import StorageIcon from "@mui/icons-material/Storage";
import { Tooltip as MuiTooltip } from '@mui/material';
import { IconHome2 } from "@tabler/icons-react";
import { useState } from "react";
import { Container } from "react-bootstrap";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Outlet, useNavigate, useParams } from "react-router-dom";

import { UserButton } from "@clerk/clerk-react";
import { useQuery } from "react-query";
import AddFavouritesButton from "../../components/Spotlight";
import { get_my_quick_links } from "../landing/api";

const useStyles = createStyles((theme) => ({
  link: {
    width: rem(50),
    height: rem(50),
    borderRadius: theme.radius.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[5]
          : theme.colors.gray[0],
    },
  },

  active: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({
        variant: "light",
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
        .color,
    },
  },
}));

interface NavbarLinkProps {
  icon: React.FC<any>;
  label: string;
  active?: boolean;
  onClick?(): void;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  const { classes, cx } = useStyles();
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        onClick={onClick}
        className={cx(classes.link, { [classes.active]: active })}
      >
        <Icon size="1.2rem" stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const FavouritesBar = () => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: "box",
    drop: () => ({ name: "favourites", isFavsTab: true }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const navigate = useNavigate();
  const params = useParams();

  const { data: quick_links } = useQuery(["quick-links"], get_my_quick_links);

  return (
    <div
      style={{
        position: "fixed",
        top: "20%",
        right: "20px",
        width: "70px",
        height: "60%",
        border: "1px solid #d3d3d3",
        borderRadius: "5px",
        backgroundColor: "white",
        zIndex: 5,
        padding: "5px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 2, display: "flex", marginBottom: "10px", flexDirection: "column", gap: 5, height: "60%", overflowY: "auto", padding: "0px 5px" }} className="quick-links" ref={drop}>
        {quick_links?.map((quick_link, position) => {
          return (
            <MuiTooltip key={position} title={quick_link.database.name} arrow placement="left">
              <div
              style={{
                width: "50px",
                border: `1px solid ${params?.id === quick_link.database._id ? "#000" : "#d3d3d3"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "50px",
                borderRadius: "10px",
                cursor: "pointer",
              }}

              onClick={() => {
                navigate(`/dashboard/${quick_link.database._id}`)
              }}
            >
              <StorageIcon
                style={{
                  height: "24px",
                  width: "24px",
                }}
              />

              <div
                style={{
                  fontSize: 8,
                  maxWidth: 40,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {quick_link.database.name}
              </div>
            </div>
            </MuiTooltip>
          );
        })}
      </div>

      <AddFavouritesButton/>
    </div>
  );
};

export function AccountsPage() {
  const [active, setActive] = useState<string | null>("Dashboard");

  const navigate = useNavigate();

  return (
    <div style={{ display: "flex" }}>
      <Navbar
        width={{ base: 80 }}
        p="md"
        style={{
          position: "fixed",
          top: "0px",
        }}
      >
        <Center>
          <img
            src="/logo.png"
            alt="Grizzy DB logo"
            style={{
              height: "80px",
              width: "80px",
              objectFit: "contain",
            }}
          />
        </Center>
        <Navbar.Section grow mt={50}>
          <Stack justify="center" spacing={0}>
            <NavbarLink
              icon={IconHome2}
              label="Dashboard"
              key="Dashboard"
              active={"Dashboard" === active}
              onClick={() => {
                setActive("Dashboard");
                navigate("/dashboard");
              }}
            />
          </Stack>
        </Navbar.Section>

        <Navbar.Section>
          <Stack justify="center" spacing={0}>
            <UserButton
              afterSignOutUrl="/"
              signInUrl="/"
              afterMultiSessionSingleSignOutUrl="/"
            />
          </Stack>
        </Navbar.Section>
      </Navbar>

      <Container style={{ padding: "20px" }}>
        <DndProvider backend={HTML5Backend}>
          <Outlet />
          <FavouritesBar />
        </DndProvider>
      </Container>
    </div>
  );
}
