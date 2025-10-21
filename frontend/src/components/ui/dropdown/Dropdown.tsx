import React from "react";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Dropdown({
  isOpen,
  onClose,
  children,
  className = "",
}: DropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop to close dropdown when clicking outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dropdown content */}
      <div className={`z-50 ${className}`}>{children}</div>
    </>
  );
}
