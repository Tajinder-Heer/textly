import type { SVGProps } from "react";

export function TextlyLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M4 7V5h16v2" />
        <path d="M12 5v14" />
        <path d="M8 19h8" />
        <path d="M18 13a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4Z" />
      <title>Textly Logo</title>
    </svg>
  );
}
