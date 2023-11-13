import StorageIcon from "@mui/icons-material/Storage";
import Button from "@mui/material/Button";
import { useState } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { useQuery } from "react-query";
import {
  initialize_databases,
  useGrizzyDBDispatch,
  useGrizzyDBState,
} from "../../../context";
import ProvisionModal from "../../landing/components/Provision";

import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { Divider } from "@mui/material";
import { LuNetwork } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import NotFoundSvg from "../../../assets/not_found.svg";
import { IFolder } from "../../../context/types";
import { get_my_databases } from "../../landing/api";
import FileMoveComp from "../../landing/components/FileMove";
import FolderCreateComp from "../../landing/components/FolderCreate";

export default function Databases() {
  const [isProvisionModalopen, setIsProvisionModalOpen] = useState(false);
  const { databases } = useGrizzyDBState();
  const dispatch = useGrizzyDBDispatch();

  const [folders, setFolders] = useState<IFolder[]>([]);

  const params = useParams();

  const navigate = useNavigate();

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
          fontWeight: "bold",
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
      <div>
        <Row>
          {databases.length || folders.length ? (
            <>
              {folders.map((folder, position) => {
                return (
                  <Col xs={6} md={3} lg={2} key={position}>
                    <div
                      style={{
                        border: "1px solid #efefef",
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
                      <div>
                        <span className="action-text">{folder.name}</span>
                      </div>
                    </div>
                  </Col>
                );
              })}
              {databases.map((database, position) => {
                return (
                  <Col xs={6} md={3} lg={2} key={position}>
                    <div
                      style={{
                        border: "1px solid #efefef",
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
                      <div>
                        <span className="action-text">{database.name}</span>
                      </div>
                    </div>
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
      </div>
    </>
  );
}
