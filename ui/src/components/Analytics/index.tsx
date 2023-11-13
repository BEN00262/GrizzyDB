import React from "react";
import { Rnd } from "react-rnd";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import StorageIcon from "@mui/icons-material/Storage";
import VoiceChatIcon from "@mui/icons-material/VoiceChat";
import AddchartIcon from "@mui/icons-material/Addchart";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HtmlIcon from "@mui/icons-material/Html";

import { CKEditor } from "@ckeditor/ckeditor5-react";

// @ts-ignore
import ClassicEditor from "@ckeditor/ckeditor5-build-balloon";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
    },

    y: {
      grid: {
        // display: false,
        drawBorder: false,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
};

const labels = ["January", "February", "March", "April", "May", "June", "July"];

export const data = {
  labels,
  datasets: [
    {
      label: "Dataset 1",
      data: [1, 2, 3, 4, 5, 6, 7],
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      borderWidth: 10,
      borderRadius: 20,
      borderColor: "transparent",
      borderSkipped: false,
    },
  ],
};

const Box = () => (
  <div
    className="box"
    style={{
      margin: 0,
      height: "100%",
      padding: "40px",
      border: "1px solid #efefefef",
      backgroundColor: "white",
    }}
  >
    <Bar options={options} data={data} />
    <div
      style={{
        position: "absolute",
        zIndex: 10,
        bottom: "5px",
        right: "5px",
        display: "flex",
      }}
    >
      <IconButton aria-label="ai">
        <VoiceChatIcon />
      </IconButton>
      <IconButton aria-label="data">
        <StorageIcon />
      </IconButton>
      <IconButton aria-label="delete" color="error">
        <DeleteIcon />
      </IconButton>
    </div>
  </div>
);

const HtmlBox = ({ object }: { object: IDisplayObject }) => (
  <div
    className="box"
    style={{
      margin: 0,
      height: "100%",
    //   padding: "40px",
      border: "1px solid #efefefef",
    //   backgroundColor: "white",
    }}
  >
    <CKEditor
      editor={ClassicEditor}
      data="<p>Hello from CKEditor&nbsp;5!</p>"
      config={{
        // height: object.config.default.height

      }}
      onReady={(editor) => {
        // You can store the "editor" and use when it is needed.
        // console.log("Editor is ready to use!", editor);
        editor.editing.view.change((writer) => {
            writer.setStyle(
                "height",
                `${object.config.default.height}px`,

                // @ts-ignore
                editor?.editing?.view?.document?.getRoot()
            );
        })
      }}
      onChange={(event, editor) => {
        const data = editor.getData();
        console.log({ event, editor, data });
      }}
      onBlur={(event, editor) => {
        console.log("Blur.", editor);
      }}
      onFocus={(event, editor) => {
        console.log("Focus.", editor);
      }}
    />
    <div
      style={{
        position: "absolute",
        zIndex: 10,
        bottom: "5px",
        right: "5px",
        display: "flex",
      }}
    >
      <IconButton aria-label="delete" color="error">
        <DeleteIcon />
      </IconButton>
    </div>
  </div>
);

interface IDisplayObject {
  type: "chart" | "html";
  config: {
    default: {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    minHeight: number;
    minWidth: number;
  };
}

function display_rnd(display: IDisplayObject) {
    switch (display.type) {
        case 'chart':
            return <Box />
        default:
            return <Box />
            // return <HtmlBox object={display}/>
    }
}

export function DashboardCreatorComp() {
  const [objects, setObjects] = React.useState<IDisplayObject[]>([]);

  const add_object = (type: 'chart' | 'html' = 'chart') => {
    setObjects((old) => [
      ...old,
      {
        type,
        config: {
          default: {
            x: 150,
            y: 205,
            width: 500,
            height: type === 'chart' ? 300 : 50,
          },

          minHeight: type === 'chart' ? 300 : 50,
          minWidth: 500,
        },
      },
    ]);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        border: "1px solid #efefef",
      }}
    >
      {objects.map((object, index) => {
        return (
          <Rnd
            key={index}
            bounds="parent"
            default={object.config.default}
            minHeight={object.config.minHeight}
            minWidth={object.config.minWidth}
            lockAspectRatio={true}
            onResize={(e, direction, ref, delta, position) => {
                console.log({ position })
                const local_objects = [...objects];

                local_objects[index].config.default = {
                    ...local_objects[index].config.default,
                    width: ref.offsetWidth,
                    height: ref.offsetHeight
                }

                setObjects(local_objects);
            }}
          >
            {display_rnd(object)}
          </Rnd>
        );
      })}

      <div
        style={{
          position: "absolute",
          zIndex: 10,
          bottom: "5px",
          right: "5px",
          border: "1px solid #efefef",
          padding: "5px",
          borderRadius: "5px",
          display: "flex",
          backgroundColor: "white",
        }}
      >
        <IconButton aria-label="ai" onClick={() => {
            add_object('html');
          }}>
          <HtmlIcon />
        </IconButton>
        <IconButton
          aria-label="data"
          onClick={() => {
            add_object('chart');
          }}
        >
          <AddchartIcon />
        </IconButton>
        <IconButton aria-label="delete">
          <FileDownloadIcon />
        </IconButton>
      </div>
    </div>
  );
}
