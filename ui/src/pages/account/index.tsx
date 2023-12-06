import {
  Center,
  Navbar,
  Stack,
  Tooltip,
  UnstyledButton,
  createStyles,
  rem,
} from "@mantine/core";
import { IconHome2 } from "@tabler/icons-react";
import { useState } from "react";
import { Container } from "react-bootstrap";
import { Outlet, useNavigate } from "react-router-dom";

import {
  UserButton
} from "@clerk/clerk-react";

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
        <Outlet />
      </Container>
    </div>
  );
}
