export default function ZapDevLogo({ className = "w-[80px] h-[20px]" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <linearGradient id="zapdevWordmark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="22"
        fontFamily="'Inter', 'Geist Sans', 'Segoe UI', sans-serif"
        fontSize="22"
        fontWeight="700"
        letterSpacing="0.08em"
        fill="url(#zapdevWordmark)"
      >
        ZapDev
      </text>
    </svg>
  );
}
