type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <span aria-hidden="true" className={`text-[#ff5a36] ${className}`}>
      w
    </span>
  );
}

type LogoProps = {
  className?: string;
};

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span className={className}>
      <LogoMark />
      <span className="sr-only">wearn</span>
      <span aria-hidden="true">earn</span>
    </span>
  );
}
