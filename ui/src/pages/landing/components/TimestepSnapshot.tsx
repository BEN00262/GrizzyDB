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
          height: "80px",
          width: "100%",
          border: "1px solid #efefef",
          borderRadius: "5px",
          cursor: "pointer",
          padding: "10px",
          boxSizing: "border-box",
        }}
        onClick={onClick}
      >
        <h4>{snapshot.checksum}</h4>
        <p>{snapshot.humanTime}</p>
      </div>

      {isClicked ? (
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
              border: "1px solid #efefef",
            }}
          >
            <Visualizer hide_minmap={true} main={snapshot._id} base={snapshot._id} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "10px",
            }}
          >
            <LoadingButton variant="outlined">use snapshot</LoadingButton>
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
            onClick={() => setActiveTimestep(index)}
          />
        );
      })}
    </div>
  );
};

export default TimestepSnapshotComp;
