import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import SQLEditorComp from "./PopupEditor";
import { Container } from "react-bootstrap";
import Textarea from "@mui/joy/Textarea";

const SnippetEditorComp = () => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Modal
        opened={opened}
        fullScreen
        transitionProps={{ transition: "fade", duration: 200 }}
        onClose={close}
      >
        <Container>
          <SQLEditorComp />
        </Container>
      </Modal>

      <Button
        variant="outlined"
        className="action-text"
        size="small"
        style={{
          color: "black",
          border: "1px solid #000",
        }}
        onClick={open}
      >
        create snippet
      </Button>
    </>
  );
};

export const SnippetEditorWrapperComp = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [title, setTitle] = useState("");

  return (
    <>
      <Modal
        opened={opened}
        fullScreen
        transitionProps={{ transition: "fade", duration: 200 }}
        onClose={close}
      >
        <Container
          style={{
            position: "relative",
            height: "90vh"
          }}
        >
          <Textarea
            placeholder="Type snippet name..."
            variant="plain"
            onBlur={(e) => {
              //   handleMetadataUpdate.mutate();
            }}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            value={title}
            sx={{
              "--Textarea-focusedInset": "var(--any, )",
              "--Textarea-focusedThickness": "1px",
              "--Textarea-focusedHighlight": "transparent",
              "&::before": {
                transition: "box-shadow .15s ease-in-out",
              },
              "&:focus-within": {
                borderColor: "#86b7fe",
              },
              backgroundColor: "transparent",
              fontFamily: "'Sofia Sans Condensed', sans-serif",
              fontWeight: "bold",
              fontSize: "1.3rem",
            }}
          />
          <div
            style={{
              marginTop: "50px",
            }}
          >
            <SQLEditorComp />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "0px",
              zIndex: 2,
              width: "100%",
              padding: "10px",
              backgroundColor: "white",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px"
            }}
          >
            <Button variant="outlined" size="small" color="error">
              delete snippet
            </Button>

            <Button variant="outlined" size="small">
              update snippet
            </Button>
          </div>
        </Container>
      </Modal>

      <div onClick={open}>{children}</div>
    </>
  );
};

export default SnippetEditorComp;
