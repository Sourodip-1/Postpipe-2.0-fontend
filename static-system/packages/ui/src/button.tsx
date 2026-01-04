"use client";

import React from "react";

export const Button = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "10px 20px",
                background: "black",
                color: "white",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold"
            }}
        >
            {children}
        </button>
    );
};
