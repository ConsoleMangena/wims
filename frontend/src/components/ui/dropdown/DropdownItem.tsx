import React from "react";
import { Link } from "react-router";

interface DropdownItemProps {
  children: React.ReactNode;
  className?: string;
  onItemClick?: () => void;
  tag?: "button" | "a" | "div";
  to?: string;
}

export function DropdownItem({
  children,
  className = "",
  onItemClick,
  tag = "button",
  to,
}: DropdownItemProps) {
  const handleClick = () => {
    onItemClick?.();
  };

  if (tag === "a" && to) {
    return (
      <Link to={to} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  if (tag === "button") {
    return (
      <button className={className} onClick={handleClick}>
        {children}
      </button>
    );
  }

  return (
    <div className={className} onClick={handleClick}>
      {children}
    </div>
  );
}
