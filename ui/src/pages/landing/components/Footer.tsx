import { ActionIcon, Container, Group, createStyles, rem } from "@mantine/core";
import {
  IconBrandGithub,
  IconBrandTwitter
} from "@tabler/icons-react";

const useStyles = createStyles((theme) => ({
  footer: {
    marginTop: rem(120),
    borderTop: `${rem(1)} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[2]
    }`,
  },

  inner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,

    [theme.fn.smallerThan("xs")]: {
      flexDirection: "column",
    },
  },

  links: {
    [theme.fn.smallerThan("xs")]: {
      marginTop: theme.spacing.md,
    },
  },
}));

export function FooterSocial() {
  const { classes } = useStyles();

  return (
    <div className={classes.footer}>
      <Container className={classes.inner}>
        {/* <MantineLogo size={28} /> */}
        <img
          src="/logo.png"
          alt="Grizzy DB logo"
          style={{
            height: "80px",
            width: "80px",
            objectFit: "contain",
          }}
        />
        <Group spacing={0} className={classes.links} position="right" noWrap>
          <ActionIcon size="lg">
            <IconBrandTwitter size="1.05rem" stroke={1.5} />
          </ActionIcon>
          <ActionIcon size="lg">
            <IconBrandGithub
              size="1.05rem"
              stroke={1.5}
              href="https://github.com/GrizzyDB"
            />
          </ActionIcon>
        </Group>
      </Container>
    </div>
  );
}
