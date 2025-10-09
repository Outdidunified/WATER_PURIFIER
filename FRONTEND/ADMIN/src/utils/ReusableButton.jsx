// utils/ReusableButton.jsx
import React from "react";

const ReusableButton = ({ type = "button", onClick, loading, children, ...props }) => {
  return (
    <button
      type={type}          // ✅ type now works
      onClick={onClick}    // ✅ onClick now works
      disabled={loading}
      {...props}
      className="btn btn-primary"
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

export default ReusableButton;
