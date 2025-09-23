import { HTMLAttributes } from "react";

export default function ZapDevIcon({
  fill = "url(#zapdevGradient)",
  innerFillColor = "#0f172a",
  ...attrs
}: HTMLAttributes<HTMLOrSVGElement> & {
  innerFillColor?: string;
  fill?: string;
}) {
  return (
    <svg
      {...attrs}
      viewBox="0 0 600 600"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="zapdevGradient" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <g>
        <path
          d="M332 60 120 360h150l-64 220 254-330H320l12-190Z"
          fill={fill}
        />
        <path
          d="M250 134 278 60"
          stroke={innerFillColor}
          strokeLinecap="round"
          strokeWidth="36"
        />
        <path
          d="m330 540 22-94"
          stroke={innerFillColor}
          strokeLinecap="round"
          strokeWidth="36"
        />
      </g>
    </svg>
  );
}
