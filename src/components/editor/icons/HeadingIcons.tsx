import { forwardRef } from 'react';

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const Heading4 = forwardRef<SVGSVGElement, CustomIconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || "24"}
    height={props.size || "24"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="m17 10-3 4h4" />
  </svg>
));

export const Heading5 = forwardRef<SVGSVGElement, CustomIconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || "24"}
    height={props.size || "24"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M17 10h3" />
    <path d="M17 14c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 .9 2 2z" />
  </svg>
));

export const Heading6 = forwardRef<SVGSVGElement, CustomIconProps>((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || "24"}
    height={props.size || "24"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <circle cx="19" cy="14" r="2" />
    <path d="M20 10c-2 2-3 3.5-3 6" />
  </svg>
));

Heading4.displayName = 'Heading4';
Heading5.displayName = 'Heading5';
Heading6.displayName = 'Heading6'; 