import { HTMLAttributes } from "react";

export default function ZapDevIconStatic({
  fill = "currentColor",
  className = "",
  ...attrs
}: HTMLAttributes<HTMLOrSVGElement> & { fill?: string }) {
  return (
    <svg
      {...attrs}
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <path d="M13.5 2 5 12.8h6l-1.5 8.2 10-12.5h-6L17 2h-3.5Z" fill={fill} />
        <path d="M9 5.2 10.6 2" />
        <path d="M14.2 21.5 15 18" />
      </g>
    </svg>
  );
}
