import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const IconPlate = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /></svg>
);
export const IconBasket = (p: P) => (
  <svg {...base(p)}><path d="M4 9h16l-1.5 10a2 2 0 0 1-2 1.7h-9a2 2 0 0 1-2-1.7L4 9Z" /><path d="M8.5 9 11 3.5M15.5 9 13 3.5M9.5 13v4M14.5 13v4" /></svg>
);
export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconFlame = (p: P) => (
  <svg {...base(p)}><path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 3-5.4 3.6-9.4 2.6 1.6 4 3.8 4.2 6 .8-.6 1.4-1.6 1.6-2.8 1.6 1.6 2.6 3.6 2.6 6.2 0 3.2-2.4 5.6-6 5.6Z" /></svg>
);
export const IconLeaf = (p: P) => (
  <svg {...base(p)}><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14H5Z" /><path d="M5 19 13 11" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconBack = (p: P) => (
  <svg {...base(p)}><path d="M15 5 8 12l7 7" /></svg>
);
export const IconRefresh = (p: P) => (
  <svg {...base(p)}><path d="M19 12a7 7 0 1 1-2.1-5" /><path d="M19 4.5V9h-4.5" /></svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" /><path d="M15.5 5.8a3 3 0 0 1 0 5.4M17.5 14.6c1.6.6 2.7 2 3 4.4" /></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}><path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7" /></svg>
);
export const IconChat = (p: P) => (
  <svg {...base(p)}><path d="M5 18.5 4 21l3-1a8 8 0 1 0-2-1.5Z" /></svg>
);
export const IconSwap = (p: P) => (
  <svg {...base(p)}><path d="M7 7h11l-3-3M17 17H6l3 3" /></svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base(p)}><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg>
);
