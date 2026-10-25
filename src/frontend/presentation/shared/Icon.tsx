const paths = {
  arrow: <path d="M4 12h15M13 5l7 7-7 7" />,
  diagonal: <path d="M6 18 18 6M6 6h12v12" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  phone: (
    <path d="M7 3 4 4c-3 5 11 19 16 16l1-3-5-3-2 2c-3-1-5-3-6-6l2-2-3-5Z" />
  ),
  message: (
    <>
      <path d="M20 11a8 8 0 0 1-8 8H4l1-4a8 8 0 1 1 15-4Z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  door: <path d="M3 21h18M5 21V3h14v18M12 3v18M9 11v3M15 11v3" />,
  window: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M12 3v18M3 12h18M7 7l2-2M15 17l2-2" />
    </>
  ),
  layers: <path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5" />,
  railing: <path d="M3 7h18M3 20h18M5 7v13M12 7v13M19 7v13M3 4h18" />,
  roof: <path d="m2 11 10-8 10 8M5 9v12h14V9M8 6l8 15M12 3l7 15M5 14h14" />,
  ruler: (
    <path d="m3 16 13-13 5 5L8 21l-5-5ZM8 11l3 3M11 8l2 2M14 5l3 3M5 14l2 2" />
  ),
  file: <path d="M14 2H5v20h14V7l-5-5ZM14 2v6h5M8 12h8M8 16h8" />,
  tool: (
    <path d="M20 7a6 6 0 0 1-8 7L5 21l-3-3 7-7a6 6 0 0 1 7-8l-4 4 3 3 5-3Z" />
  ),
  check: <path d="m5 12 4 4L19 6" />,
  shield: (
    <>
      <path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" />
    </>
  ),
  home: <path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8" />,
  location: (
    <>
      <path d="M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 5 10 8L22 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  plus: <path d="M12 4v16M4 12h16" />,
  edit: <path d="m15 4 5 5M3 21l5-1L21 7l-5-5L3 15v6Z" />,
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="2" />
      <path d="m3 17 6-6 4 4 3-3 5 5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="m3 3 18 18M10.6 5.1 12 5c6 0 10 7 10 7a20 20 0 0 1-3 3.8M6.2 6.2A23 23 0 0 0 2 12s4 7 10 7a13 13 0 0 0 5.8-1.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-1 3-3 1-2 4 2 3v4l4 3 3-1 3 1 4-3v-4l2-3-2-4-3-1-1-3H9Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  bell: <path d="M5 17h14l-2-4V8a5 5 0 0 0-10 0v5l-2 4ZM10 21h4" />,
  logout: <path d="M9 3H3v18h6M8 12h13M16 7l5 5-5 5" />,
  filter: (
    <>
      <path d="M3 6h18M6 12h12M9 18h6" />
      <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  upload: <path d="M12 16V3m-5 5 5-5 5 5M3 15v6h18v-6" />,
  bookmark: <path d="M5 3h14v19l-7-5-7 5V3Z" />,
};
export default function Icon({
  name = "arrow",
  size = 20,
  className = "",
  ...props
}: {
  name?: string;
  size?: number;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name as keyof typeof paths] || paths.arrow}
    </svg>
  );
}
