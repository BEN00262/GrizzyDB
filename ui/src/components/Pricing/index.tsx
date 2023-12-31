import {
  Box,
  Button,
  Divider,
  Flex,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { get_pricing_deals } from "../../pages/landing/api";
import React from "react";
import { useState } from "react";
import { useQuery } from "react-query";
import Switch from "react-switch";
import { useUser } from "@clerk/clerk-react";
import LoginComponent from "../Login";
import { useNavigate } from "react-router";

export const PricingContainer = () => {
  const theme = useMantineTheme();
  const [monthly, setMonthly] = useState(false);

  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  const handleChange = () => {
    setMonthly(!monthly);
  };

  const { data: pricing_deals } = useQuery(["pricing"], get_pricing_deals);

  return (
    <>
      <Group sx={{ zIndex: 50 }}>
        <Stack spacing={40}>
          {/** header section */}
          <Flex direction="column" gap={10} align="center" justify="start">
            <Title
              order={2}
              color={
                theme.colorScheme === "dark" ? "white" : "hsl(233, 13%, 49%)"
              }
            >
              Our Pricing
            </Title>
            <Box
              sx={{
                fontWeight: 700,
                color:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[1]
                    : "hsl(234, 14%, 74%)",
                display: "flex",
                alignItems: "center",
                gap: 19,
              }}
            >
              <Text fz={"sm"}>Annually</Text>
              <Switch
                checked={monthly}
                onChange={handleChange}
                // @ts-ignore
                checkedIcon={false}

                // @ts-ignore
                uncheckedIcon={false}

                boxShadow=""
                activeBoxShadow=""
                width={45}
                height={25}
                onColor={"#7F85E4"}
                offColor={"#7F85E4"}
                handleDiameter={18}
              />
              <Text fz={"sm"}>Monthly</Text>
            </Box>
          </Flex>
          {/** cards section */}
          <Group>
            <Flex
              align={"center"}
              direction={{ base: "column", sm: "row" }}
              color={"hsl(232, 13%, 33%)"}
              gap={{ base: "1.5rem", sm: 0 }}
            >
              <Box
                sx={{
                  boxShadow: "0px 30px 50px -7px rgba(0,0,0,0.1)",
                  height: "22rem",
                  width: "17rem",
                  paddingInline: "1.5rem",
                  backgroundColor:
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[5]
                      : "white",
                  borderRadius: "0.7rem 0 0 0.7rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  "@media (max-width: 755px)": {
                    width: "19rem",
                    borderRadius: "0.7rem",
                  },
                  "@media (min-width: 756px) and (max-width: 820px)": {
                    width: "15rem",
                    borderRadius: "0.7rem 0 0 0.7rem",
                  },
                }}
              >
                <Stack w={"100%"} align={"center"} spacing={20}>
                  <Text
                    sx={{
                      fontWeight: 700,
                      color:
                        theme.colorScheme === "dark"
                          ? theme.colors.dark[1]
                          : "hsl(233, 13%, 49%)",
                    }}
                    fz={"md"}
                  >
                    Starters
                  </Text>
                  <Title
                    order={2}
                    sx={{
                      color:
                        theme.colorScheme === "dark"
                          ? "white"
                          : "hsl(232, 13%, 33%)",
                      fontSize: 50,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Text fz={"2rem"}>Free</Text>
                  </Title>
                  <Stack
                    w={"100%"}
                    align="center"
                    spacing={10}
                    // @ts-ignore
                    sx={{
                      color:
                        theme.colorScheme === "light" && "hsl(233, 13%, 49%)",
                    }}
                  >
                    <Divider
                    // @ts-ignore
                      sx={{
                        width: "100%",
                        borderColor: theme.colorScheme === "dark" && "gray",
                        opacity: theme.colorScheme === "dark" && 0.7,
                      }}
                    />
                    <Text fz={"sm"} fw={600}>
                      3 databases
                    </Text>
                    <Divider
                    // @ts-ignore
                      sx={{
                        width: "100%",
                        borderColor: theme.colorScheme === "dark" && "gray",
                        opacity: theme.colorScheme === "dark" && 0.7,
                      }}
                    />
                    <Text fz={"sm"} fw={600}>
                      Databases removed after 24hrs
                    </Text>
                    <Divider
                    // @ts-ignore
                      sx={{
                        width: "100%",
                        borderColor: theme.colorScheme === "dark" && "gray",
                        opacity: theme.colorScheme === "dark" && 0.7,
                      }}
                    />
                    <Text fz={"sm"} fw={600}>
                      Limited to 20mb per database
                    </Text>
                    <Divider
                    // @ts-ignore
                      sx={{
                        width: "100%",
                        borderColor: theme.colorScheme === "dark" && "gray",
                        opacity: theme.colorScheme === "dark" && 0.7,
                      }}
                    />
                  </Stack>
                  <LoginComponent
                    component={
                      <Button
                        variant="gradient"
                        gradient={{
                          from: "hsl(236, 72%, 79%)",
                          to: "hsl(237, 63%, 64%)",
                        }}
                        w="100%"
                        {...(isSignedIn
                          ? {
                              onClick: () => {
                                navigate("/dashboard", { replace: true });
                              },
                            }
                          : {})}
                      >
                        GET STARTED
                      </Button>
                    }
                  />
                </Stack>
              </Box>

              {pricing_deals?.map((deal, position) => {
                return (
                  <Box
                    key={position}
                    sx={{
                      boxShadow: "0px 30px 50px -7px rgba(0,0,0,0.1)",
                      height: "25rem",
                      width: "19rem",
                      paddingInline: "1.5rem",
                      background:
                        "linear-gradient(to bottom right, hsl(236, 72%, 79%), hsl(237, 63%, 64%))",
                      color: "white",
                      borderRadius: "0.7rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      "@media (min-width: 756px) and (max-width: 820px)": {
                        width: "15rem",
                        borderRadius: "0.7rem",
                      },
                    }}
                  >
                    <Stack w={"100%"} align={"center"} spacing={20}>
                      <Text
                        sx={{
                          fontWeight: 700,
                        }}
                        fz={"md"}
                      >
                        {deal.caption}
                      </Text>
                      <Title
                        order={2}
                        sx={{
                          fontSize: 50,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Text fz={"2rem"}>$</Text>
                        {monthly ? "9.99" : "109.89"}
                      </Title>
                      <Stack w={"100%"} align="center" spacing={10}>
                        <Divider
                        // @ts-ignore
                          sx={{
                            width: "100%",
                            borderColor:
                              theme.colorScheme === "dark" && "white",
                            opacity: theme.colorScheme === "dark" && 0.6,
                          }}
                        />
                        {deal.features.map((feature, fposition) => {
                          return (
                            <React.Fragment key={fposition}>
                              <Text fz={"sm"} fw={600}>
                                {feature}
                              </Text>
                              <Divider
                              // @ts-ignore
                                sx={{
                                  width: "100%",
                                  borderColor:
                                    theme.colorScheme === "dark" && "white",
                                  opacity: theme.colorScheme === "dark" && 0.6,
                                }}
                              />
                            </React.Fragment>
                          );
                        })}
                      </Stack>

                      <LoginComponent
                        component={
                          <Button
                            sx={{
                              backgroundColor: "white",
                              color: "hsl(237, 63%, 64%)",

                              "&:hover": {
                                backgroundColor: "white",
                                opacity: 0.95,
                              },
                            }}
                            w="100%"
                            {...(isSignedIn
                              ? {
                                  onClick: () => {
                                    navigate("/dashboard", { replace: true });
                                  },
                                }
                              : {})}
                          >
                            GET STARTED
                          </Button>
                        }
                      />
                    </Stack>
                  </Box>
                );
              })}
            </Flex>
          </Group>
        </Stack>
      </Group>
    </>
  );
};
