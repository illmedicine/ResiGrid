import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  /** px height — width is auto to preserve the square aspect ratio */
  size?: number;
  href?: string;
}

/**
 * Transparent ResiGrid logo with a drop-shadow that makes it appear to
 * float above whatever surface it sits on. The gentle bob animation
 * reinforces the hover-above-the-page effect.
 */
export function Logo({ size = 52, href = "/" }: LogoProps) {
  const img = (
    <Image
      src="/logo.png"
      alt="ResiGrid"
      width={size}
      height={size}
      priority
      style={{
        filter:
          "drop-shadow(0 6px 18px rgba(11,31,58,0.55)) drop-shadow(0 2px 6px rgba(242,121,29,0.25))",
        animation: "logo-float 3.5s ease-in-out infinite",
      }}
    />
  );

  return href ? (
    <Link href={href} className="flex items-center">
      {img}
    </Link>
  ) : (
    <span className="flex items-center">{img}</span>
  );
}
