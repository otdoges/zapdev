export default function ZapDevLogo() {
  return (
    <div className="flex items-center space-x-2">
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L3 10h4v8l9-8h-4V2z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-semibold text-lg">ZapDev</span>
    </div>
  );
}