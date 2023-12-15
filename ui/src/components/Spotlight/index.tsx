import React from "react";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import IconButton from "@mui/material/IconButton";

import {
  Center,
  Group,
  Text,
  UnstyledButton,
  createStyles,
  rem,
} from "@mantine/core";
import {
  SpotlightAction,
  SpotlightActionProps,
  SpotlightProvider,
  spotlight,
} from "@mantine/spotlight";
import { useDebounce } from "use-debounce";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import StorageIcon from "@mui/icons-material/Storage";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  create_quick_links,
  search_for_database_or_folder,
} from "../../pages/landing/api";
import { IQuickLinkCreate } from "../../context/types";

const useStyles = createStyles((theme) => ({
  action: {
    position: "relative",
    display: "block",
    width: "100%",
    padding: `${rem(10)} ${rem(12)}`,
    borderRadius: theme.radius.sm,
    ...theme.fn.hover({
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[1],
    }),

    "&[data-hovered]": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[1],
    },
  },
}));

function SpotlightControl({ query }: { query: string }) {
  const queryClient = useQueryClient();

  const move_to_favourites = useMutation(
    (data: IQuickLinkCreate) => {
      return create_quick_links(data);
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(["quick-links"]);
      },
    }
  );

  useQuery(
    ["search-actions", query],
    async () => search_for_database_or_folder(query),
    {
      enabled: !!query,
      refetchOnWindowFocus: false,
      // staleTime: 120000,
      onSuccess: (data) => {
        const actions: SpotlightAction[] = [];

        for (const folder of data.folders) {
          actions.push({
            id: folder._id,
            title: folder.name,
            group: "Folders",
            onTrigger: () => {
              console.log("clicked folder");
            },
          });
        }

        for (const database of data.databases) {
          actions.push({
            id: database._id,
            title: database.name,
            group: "Databases",
            onTrigger: () => {
              move_to_favourites.mutate({
                quick_links: [
                    { database: database._id }
                ]
              })
            },
          });
        }

        spotlight.registerActions(actions);
      },
    }
  );

  return (
    <Group position="center">
      <IconButton onClick={() => spotlight.open()}>
        <AddCircleOutlineIcon />
      </IconButton>
    </Group>
  );
}

function CustomAction({
  action,
  styles,
  classNames,
  hovered,
  onTrigger,
  ...others
}: SpotlightActionProps) {
    // @ts-ignore
  const { classes } = useStyles(null, {
    styles,
    classNames,
    name: "Spotlight",
  });

  return (
    <UnstyledButton
      className={classes.action}
      data-hovered={hovered || undefined}
      tabIndex={-1}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onTrigger}
      {...others}
    >
      <Group noWrap>
        <Center>
          {action.group === "Folders" ? (
            <FolderOpenIcon
              style={{
                height: "24px",
                width: "24px",
              }}
            />
          ) : (
            <StorageIcon
              style={{
                height: "24px",
                width: "24px",
              }}
            />
          )}
        </Center>

        <div style={{ flex: 1 }}>
          <Text>{action.title}</Text>

          {action.description && (
            <Text color="dimmed" size="xs">
              {action.description}
            </Text>
          )}
        </div>
      </Group>
    </UnstyledButton>
  );
}

export default function AddFavouritesButton() {
  const [databases_and_folders, setDatabasesAndFolders] = React.useState<
    SpotlightAction[]
  >([]);

  const [query, setQuery] = React.useState("");
  const [search_term] = useDebounce(query, 500);

  return (
    <SpotlightProvider
      actions={databases_and_folders}
      onActionsChange={setDatabasesAndFolders}
      actionComponent={CustomAction}
      onQueryChange={setQuery}
      highlightQuery={true}
      searchPlaceholder="Search..."
      shortcut="mod + shift + I"
      overlayProps={{
        color: "#000",
        opacity: 0.6,
      }}
      query={query}
    >
      <SpotlightControl query={search_term} />
    </SpotlightProvider>
  );
}
