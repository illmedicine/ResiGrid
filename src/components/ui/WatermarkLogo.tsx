import Image from "next/image";

interface WatermarkLogoProps {
  size?: number;
  opacity?: number;
}

/**
 * Large semi-transparent logo used as a centered page watermark
 * behind auth forms and other content areas.
 */
export function WatermarkLogo({ size = 560, opacity = 0.06 }: WatermarkLogoProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <Image
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        style={{ opacity, userSelect: "none" }}
        priority={false}
      />
    </div>
  );
}
