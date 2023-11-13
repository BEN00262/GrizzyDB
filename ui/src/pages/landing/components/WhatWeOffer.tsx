import {
    createStyles,
    Title,
    SimpleGrid,
    Text,
    ThemeIcon,
    Grid,
    Col,
    rem,
  } from '@mantine/core';
import { Button } from '@mui/material';
  import { IconReceiptOff, IconFlame, IconCircleDotted, IconFileCode } from '@tabler/icons-react';
import { useLoginWithGoogleAuth } from '../../../hooks';
import LoginComponent from '../../../components/Login';
  
  const useStyles = createStyles((theme) => ({
    wrapper: {
      padding: `calc(${theme.spacing.xl} * 2) ${theme.spacing.xl}`,
      boxSizing: 'border-box',
    },
  
    title: {
    //   fontFamily: `Greycliff CF, ${theme.fontFamily}`,
      fontSize: rem(36),
      fontWeight: 900,
      lineHeight: 1.1,
      marginBottom: theme.spacing.md,
      color: theme.colorScheme === 'dark' ? theme.white : theme.black,
      fontFamily: "'Sofia Sans Condensed', sans-serif",
    },
  }));
  
  const features = [
    {
      icon: IconReceiptOff,
      title: 'Free',
      description: 'Get started right away without paying for anything',
    },
    {
      icon: IconFileCode,
      title: 'Unlimited storage',
      description: 'Create free databases with unlimited storage sizes',
    },
    {
      icon: IconCircleDotted,
      title: 'No annoying focus ring',
      description:
        'With new :focus-visible selector focus ring will appear only when user navigates with keyboard',
    },
    {
      icon: IconFlame,
      title: 'Flexible',
      description:
        'Customize colors, spacing, shadows, fonts and many other settings with global theme object',
    },
  ];
  
  export function FeaturesGrid() {
    const { classes } = useStyles();
    // const { login } = useLoginWithGoogleAuth()
  
    const items = features.map((feature) => (
      <div key={feature.title}>
        <ThemeIcon
          size={44}
          radius="md"
          variant="outline"
          color="dark"
        >
          <feature.icon size={rem(26)} stroke={1.5} color={'#000'} />
        </ThemeIcon>
        <Text fz="lg" mt="sm" fw={500} className='action-text'>
          {feature.title}
        </Text>
        <Text c="dimmed" fz="sm" className='action-text'>
          {feature.description}
        </Text>
      </div>
    ));
  
    return (
      <div className={classes.wrapper}>
        <Grid gutter={80}>
          <Col span={12} md={5}>
            {/* databases | schema management */}
            <Title className={classes.title} order={2}>
            Free Ephemeral Relational Databases for all your testing needs
            </Title>
            <Text c="dimmed" className='action-text'>
              Build fully functional accessible web applications faster than ever – Mantine includes
              more than 120 customizable components and hooks to cover you in any situation
            </Text>

            <div style={{
                    marginTop: "20px"
                }}>
              <LoginComponent/>
            </div>

            {/* <Button 
                variant="outlined"
                className='action-text'
                style={{
                    color: "black",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    border: "1px solid #000",
                    marginTop: "20px"
                }}
                // endIcon={<StorageIcon />}
                onClick={() => login()}
            >
                check us out
            </Button> */}
          </Col>
          <Col span={12} md={7}>
            <SimpleGrid cols={2} spacing={30} breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
              {items}
            </SimpleGrid>
          </Col>
        </Grid>
      </div>
    );
  }