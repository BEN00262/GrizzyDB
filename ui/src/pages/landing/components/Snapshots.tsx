import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import Select, { components } from "react-select";
import Visualizer from "../../../components/Visualizer";
import { get_database_snapshots } from "./api";

const customStyles = {
  menu: (provided: any) => ({
    ...provided,
    width: "max-content",
    minWidth: "100%",
  }),
};

export default function Snapshots({ share }: { share?: boolean }) {
  const params = useParams();
  const [options, setOptions] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);

  const [base, setBase] = useState<{ base: string; main: string }>({
    base: "",
    main: "",
  });

  useQuery(["snapshots"], () => get_database_snapshots(params?.id ?? ""), {
    enabled: !!params?.id,
    onSuccess: (data) => {
      const options = data.map((x) => {
        return {
          value: x._id,
          label: `${x.checksum ?? "original"} (${x.humanTime})`,
        };
      });

      setOptions(options);
      if (options?.length) {
        const base = options[0].value;
        setBase({ base, main: base });
      }
    },
  });

  return (
    <>
      {share ? (
        <Visualizer main={base.main} base={base.base} />
      ) : (
        <Row>
          <Col xs={12}>
            <div>
              <h5>Snapshots</h5>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <Select
                options={options}
                onChange={(e) => {
                  setBase((old) => ({
                    ...old,
                    main: e?.value ?? "",
                  }));
                }}
                styles={customStyles}
                value={options?.[0]}
                components={{
                  SingleValue: ({ children, ...props }) => {
                    return (
                      <components.SingleValue {...props}>
                        {"base: " + children}
                      </components.SingleValue>
                    );
                  },
                  Placeholder: ({ children, ...props }) => {
                    return (
                      <components.Placeholder {...props}>
                        {"base: " + children}
                      </components.Placeholder>
                    );
                  },
                  IndicatorSeparator: () => null,
                }}
              />
              <ArrowBackIcon />
              <Select
                options={options}
                onChange={(e) => {
                  setBase((old) => ({
                    ...old,
                    base: e?.value ?? "",
                  }));
                }}
                styles={customStyles}
                value={options?.[0]}
                components={{
                  SingleValue: ({ children, ...props }) => {
                    return (
                      <components.SingleValue {...props}>
                        {"compare: " + children}
                      </components.SingleValue>
                    );
                  },
                  Placeholder: ({ children, ...props }) => {
                    return (
                      <components.Placeholder {...props}>
                        {"compare: " + children}
                      </components.Placeholder>
                    );
                  },
                  IndicatorSeparator: () => null,
                }}
              />
            </div>
            <div
              style={{
                height: "70vh",
                marginTop: "20px",
                border: "1px solid #efefef",
                padding: "5px",
              }}
            >
              <Visualizer main={base.main} base={base.base} />
            </div>
          </Col>
        </Row>
      )}
    </>
  );
}
