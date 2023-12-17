import StorageIcon from "@mui/icons-material/Storage";
import Button from "@mui/material/Button";
import { useState } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  initialize_databases,
  useGrizzyDBDispatch,
  useGrizzyDBState,
} from "../../../context";
import ProvisionModal from "../../landing/components/Provision";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Divider } from "@mui/material";
import { useDrag, useDrop } from "react-dnd";
import { LuNetwork } from "react-icons/lu";

// import { Menu, Item, Separator, Submenu, useContextMenu } from 'react-contexify';
// import 'react-contexify/ReactContexify.css';

import { useNavigate, useParams } from "react-router-dom";
import NotFoundSvg from "../../../assets/not_found.svg";
import {
  IDatabaseDisplay,
  IFolder,
  IQuickLinkCreate,
} from "../../../context/types";
import {
  check_if_subscribed,
  create_quick_links,
  get_checkout_link,
  get_my_databases,
  move_to_folder,
} from "../../landing/api";
import FileMoveComp from "../../landing/components/FileMove";
import FolderCreateComp from "../../landing/components/FolderCreate";
import LoadingButton from "@mui/lab/LoadingButton";

const DatabaseFolder = ({ folder }: { folder: IFolder }) => {
  const navigate = useNavigate();

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: "box",
    drop: () => ({ name: folder.name, reference: folder._id }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{
        border: "1px solid #d3d3d3",
        borderRadius: "5px",
        height: "200px",
        padding: "5px",
        boxSizing: "border-box",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "5px",
        alignItems: "center",
        margin: "20px auto",
        overflow: "hidden",
        whiteSpace: "nowrap",
        maxWidth: "100%",
        textOverflow: "ellipsis",
      }}
      onClick={() => {
        navigate(`/dashboard/folder/${folder._id}`);
      }}
    >
      <FolderOpenIcon
        style={{
          height: "24px",
          width: "24px",
        }}
      />
      <span className="action-text">folder</span>
      <br />
      <div
        style={{
          maxWidth: "80%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <span className="action-text">{folder.name}</span>
      </div>
    </div>
  );
};

interface DropResult {
  name: string;
  reference: string;
  isFavsTab: boolean;
}

const DatabaseFile = ({ database }: { database: IDatabaseDisplay }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const move_to_folder_mutation = useMutation(
    ({ folder, file }: { folder: string; file: string }) => {
      return move_to_folder(folder, file);
    },
    {
      onSuccess: (data) => {
        // invalidate the data
        queryClient.invalidateQueries(["my-databases"]);
      },
    }
  );

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

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "box",
    item: { name: database.name, reference: database._id },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (item && dropResult) {
        // alert(`You dropped ${item.name} into ${dropResult.name} ${dropResult.reference} ${dropResult.isFavsTab}!`);

        if (dropResult.isFavsTab) {
          move_to_favourites.mutate({
            quick_links: [
              {
                database: item.reference,
              },
            ],
          });
        } else {
          move_to_folder_mutation.mutate({
            folder: dropResult.reference,
            file: item.reference,
          });
        }
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        border: "1px solid #d3d3d3",
        borderRadius: "5px",
        height: "200px",
        padding: "5px",
        boxSizing: "border-box",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "5px",
        alignItems: "center",
        margin: "20px auto",
        overflow: "hidden",
        whiteSpace: "nowrap",
        maxWidth: "100%",
        textOverflow: "ellipsis",
      }}
      onClick={() => {
        navigate(`/dashboard/${database._id}`);
      }}
    >
      {database.product_type === "bring_your_own" ? (
        <LuNetwork
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
      <span className="action-text">{database.dialect}</span>
      <br />
      <div
        style={{
          maxWidth: "80%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <span className="action-text">{database.name}</span>
      </div>
    </div>
  );
};

export default function Databases() {
  const [isProvisionModalopen, setIsProvisionModalOpen] = useState(false);
  const { databases } = useGrizzyDBState();
  const dispatch = useGrizzyDBDispatch();

  const [folders, setFolders] = useState<IFolder[]>([]);

  const params = useParams();

  useQuery(
    ["my-databases", params?.folder_id],
    () => get_my_databases(params?.folder_id),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      onSuccess: (data) => {
        initialize_databases(dispatch, data.databases);
        setFolders(data.folders);
      },
    }
  );

  const { data: is_subscribed } = useQuery(
    ["subscription"],
    check_if_subscribed,
    {
      staleTime: 2000 /* recheck every 2 seconds */,
    }
  );

  const checkout_link_mutation = useMutation(
    () => {
      return get_checkout_link();
    },
    {
      onSuccess: (checkout_link) => {
        window.location.href = checkout_link;
      },
    }
  );

  return (
    <>
      <ProvisionModal
        open={isProvisionModalopen}
        handleClose={() => setIsProvisionModalOpen(false)}
      />
      <Button
        variant="outlined"
        className="action-text"
        size="small"
        style={{
          color: "black",
          // fontWeight: "bold",
          border: "1px solid #000",
        }}
        endIcon={<StorageIcon />}
        onClick={() => setIsProvisionModalOpen(true)}
      >
        create database
      </Button>{" "}
      <FolderCreateComp /> <FileMoveComp />
      <Divider
        className="action-text"
        style={{
          margin: "20px auto",
        }}
      />
      {typeof is_subscribed === "boolean" && !is_subscribed ? (
        <div
          style={{
            padding: "10px",
            borderRadius: "2px",
            backgroundColor: "#f7e771",
          }}
        >
          <p
            style={{
              fontWeight: "bold",
              letterSpacing: '1px'
            }}
            className="action-text"
          >
            You are currently on a free subscription, upgrade to enjoy the full
            features of GrizzyDB
          </p>
          <LoadingButton
            variant="outlined"
            className="action-text"
            size="small"
            style={{
              color: "black",
              border: "1px solid #000",
            }}
            loading={checkout_link_mutation.isLoading}
            disabled={checkout_link_mutation.isLoading}
            onClick={() => checkout_link_mutation.mutate()}
          >
            change subscription
          </LoadingButton>
        </div>
      ) : null}
      <Row>
        {databases.length || folders.length ? (
          <>
            {folders.map((folder, position) => {
              return (
                <Col xs={6} md={3} lg={2} key={position}>
                  <DatabaseFolder folder={folder} />
                </Col>
              );
            })}
            {databases.map((database, position) => {
              return (
                <Col xs={6} md={3} lg={2} key={position}>
                  <DatabaseFile database={database} />
                </Col>
              );
            })}
          </>
        ) : (
          <div
            style={{
              height: "500px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={NotFoundSvg}
              alt="not found"
              style={{
                width: "250px",
              }}
            />
          </div>
        )}
      </Row>
    </>
  );
}
