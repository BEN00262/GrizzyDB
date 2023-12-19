import { Table } from "@mantine/core";
import Tooltip from "@mui/material/Tooltip";
import { useQuery } from "react-query";
import { useParams } from "react-router";

import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { get_query_analysis } from "../api";

function cut_query(query: string) {
  if (query.length < 80) {
    return query;
  }

  return `${query?.slice(0, 80)}...`;
}

const InsightsTab = () => {
  const params = useParams();

  const { data: elements } = useQuery(
    ["query-analysis", params.id],
    async () => {
      if (params?.id) {
        return get_query_analysis(params?.id);
      }

      return [];
    }
  );

  const ths = (
    <tr>
      <th style={{
        width: "50%"
      }}>Query</th>
      <th>Count</th>
      <th>Total Time</th>
      <th>Mean Time</th>
    </tr>
  );

  const rows = elements?.map((element, position) => (
    <tr key={position}>
      <td
        style={{
          height: "20px",
          cursor: "pointer",
        }}
      >
        <Tooltip
          title={element.query}
          arrow
          placement="right"
          componentsProps={{
            tooltip: {
              sx: {
                color: "#000",
                backgroundColor: "#efefef",
                borderRadius: "4px",
                padding: "1rem",
                // fontWeight: "300",
                fontSize: "12px",
                fontFamily: "Inter",
                boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                maxWidth: "800px",
                maxHeight: "400px",
                overflowY: "auto",
              },
            },
          }}
        >
          <div>
            {cut_query(element.query)}
          </div>
        </Tooltip>
      </td>
      <td>{element.calls}</td>
      <td>{element.total_time}</td>
      <td>{element.mean_time}</td>
    </tr>
  ));

  return (
    <Table
      striped
      highlightOnHover
      withBorder
      withColumnBorders
      //   captionSide="bottom"
      horizontalSpacing="sm"
      style={{
        tableLayout: "fixed",
      }}
    >
      {/* <caption>query insights analytics</caption> */}
      <thead>{ths}</thead>
      <tbody>{rows}</tbody>
    </Table>
  );
};

export default InsightsTab;
