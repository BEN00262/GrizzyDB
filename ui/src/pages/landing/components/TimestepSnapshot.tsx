import LoadingButton from "@mui/lab/LoadingButton";
import { useState } from "react";
import Visualizer from "../../../components/Visualizer";
import { useParams } from "react-router";
import { get_database_snapshots } from "./api";
import { useQuery } from "react-query";
import { ISnapshot } from "context/types";

const TimestepPoint = ({
  isClicked,
  onClick,
  snapshot,
}: {
  isClicked: boolean;
  onClick: () => void;
  snapshot: ISnapshot;
}) => {
  return (
    <>
      <div
        style={{
          minHeight: "80px",
          width: "100%",
          border: "1px solid #d3d3d3",
          borderRadius: "5px",
          cursor: "pointer",
          padding: "10px",
          boxSizing: "border-box",
        }}
        onClick={onClick}
      >
        <h5>{snapshot.checksum}</h5>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <p>{snapshot.humanTime}</p>
          <div
            style={{
              border: "1px solid #efefef",
              borderRadius: "10px",
              padding: "1px 15px",
              backgroundColor: "#e7f5ff",
              fontWeight: "bold"
            }}
          >
            {snapshot.status ?? "active"}
          </div>
        </div>
      </div>

      {isClicked && (!snapshot.status || snapshot.status === 'done') ? (
        <div
          style={{
            height: "550px",
            margin: "10px 0px",
          }}
        >
          <div
            style={{
              height: "500px",
              marginTop: "5px",
              border: "1px solid #d3d3d3",
            }}
          >
            <Visualizer
              hide_minmap={true}
              main={snapshot._id}
              base={snapshot._id}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <LoadingButton variant="outlined" size="small">export snapshot</LoadingButton>
            <LoadingButton variant="outlined" size="small">switch to snapshot</LoadingButton>
            <LoadingButton variant="outlined" size="small" color="error">delete snapshot</LoadingButton>
          </div>
        </div>
      ) : null}
    </>
  );
};

const TimestepSnapshotComp = () => {
  const [activeTimeStep, setActiveTimestep] = useState(-1);
  const params = useParams();

  const { data: snapshots } = useQuery(
    ["snapshots"],
    () => get_database_snapshots(params?.id ?? ""),
    {
      enabled: !!params?.id,
    }
  );

  return (
    <div
      className="snapshots"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        height: "75vh",
        overflowY: "auto",
        padding: "0px 10px",
      }}
    >
      {snapshots?.map((snapshot, index) => {
        return (
          <TimestepPoint
            key={index}
            snapshot={snapshot}
            isClicked={index === activeTimeStep}
            onClick={() => setActiveTimestep(index === activeTimeStep ? -1 : index)}
          />
        );
      })}
    </div>
  );
};

export default TimestepSnapshotComp;
