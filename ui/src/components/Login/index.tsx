import { SignInButton } from "@clerk/clerk-react";

const LoginComponent = () => {
  return (
    <SignInButton mode="modal" redirectUrl="http://localhost:5173/dashboard">
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
    </SignInButton>
  );
};

export default LoginComponent;
