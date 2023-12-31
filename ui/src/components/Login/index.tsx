import { SignInButton, useAuth, useUser } from "@clerk/clerk-react";
import React from "react";
import { useNavigate } from "react-router";

const LoginComponent = ({ component }: { component?: React.ReactNode }) => {
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  if (isSignedIn) {
    if (component) {
      return component;
    }

    return (
      <button
        style={{
          border: "1px solid #000",
          padding: "10px 40px",
          borderRadius: "8px",
          backgroundColor: "transparent",
          fontWeight: 700,
          fontSize: "18px",
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={() => {
          navigate("/dashboard", { replace: true });
        }}
      >
        Go To Dashboard
        {user.hasImage ? (
          <img
            src={user.imageUrl}
            alt=""
            style={{
              height: "25px",
              borderRadius: "50%",
              border: "1px solid #d3d3d3",
              padding: "1px",
            }}
          />
        ) : null}
      </button>
    );
  }

  return (
    <SignInButton mode="modal" redirectUrl="/dashboard">
      {component ? (
        component
      ) : (
        <button
          style={{
            border: "1px solid #000",
            padding: "10px 40px",
            borderRadius: "8px",
            backgroundColor: "transparent",
            fontWeight: 700,
            fontSize: "18px",
          }}
        >
          Get started
        </button>
      )}
    </SignInButton>
  );
};

export default LoginComponent;
