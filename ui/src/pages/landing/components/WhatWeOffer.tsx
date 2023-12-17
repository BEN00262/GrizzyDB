import {
  Col,
  Grid,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
  createStyles,
  rem,
} from "@mantine/core";
import {
  IconFileCode,
  IconFolders,
  IconReceiptOff,
  IconTopologyStar,
} from "@tabler/icons-react";
import LoginComponent from "../../../components/Login";

const useStyles = createStyles((theme) => ({
  wrapper: {
    padding: `calc(${theme.spacing.xl} * 2) ${theme.spacing.xl}`,
    boxSizing: "border-box",
  },

  title: {
    //   fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    fontSize: rem(36),
    fontWeight: 900,
    lineHeight: 1.1,
    marginBottom: theme.spacing.md,
    color: theme.colorScheme === "dark" ? theme.white : theme.black,
    fontFamily: "'Sofia Sans Condensed', sans-serif",
  },
}));

const features = [
  {
    icon: IconReceiptOff,
    title: "Free",
    description: "Get started right away without paying for anything",
  },
  {
    icon: IconFileCode,
    title: "Unlimited storage",
    description: "Create free databases with unlimited storage sizes",
  },
  {
    icon: IconFolders,
    title: "File system structure",
    description:
      "Helps with easy organisation of test databases into related folders",
  },
  {
    icon: IconTopologyStar,
    title: "ERD",
    description: "View relationships between your tables graphically",
  },
];

export function FeaturesGrid() {
  const { classes } = useStyles();
  // const { login } = useLoginWithGoogleAuth()

  const items = features.map((feature) => (
    <div key={feature.title}>
      <ThemeIcon size={44} radius="md" variant="outline" color="dark">
        <feature.icon size={rem(26)} stroke={1.5} color={"#000"} />
      </ThemeIcon>
      <Text fz="lg" mt="sm" fw={500} className="action-text">
        {feature.title}
      </Text>
      <Text c="dimmed" fz="sm" className="action-text">
        {feature.description}
      </Text>
    </div>
  ));

  return (
    <div className={classes.wrapper}>
      <Grid gutter={80}>
        <Col span={12} md={5}>
          <Title className={classes.title} order={2}>
            Free Ephemeral Relational Databases for all your testing needs
          </Title>
          <Text c="dimmed" className="action-text">
            Database Delight: Test with Might, Ephemeral and Free, Just like it
            should be! 🌐🚀 <br />
            #DevJoy #DataFreePlay
          </Text>

          <div
            style={{
              marginTop: "20px",
            }}
          >
            <LoginComponent />
          </div>
        </Col>
        <Col span={12} md={7}>
          <SimpleGrid
            cols={2}
            spacing={30}
            breakpoints={[{ maxWidth: "md", cols: 1 }]}
          >
            {items}
          </SimpleGrid>
        </Col>
      </Grid>

      {/* <Grid gutter={80} style={{ marginTop: "50px" }}>
        <Col span={12} md={12}>
          <Title className={classes.title} order={2}>
            Pricing
          </Title>
          
        </Col>
      </Grid> */}
    </div>
  );
}
