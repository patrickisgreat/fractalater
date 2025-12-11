import Image from "next/image";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/main_logo.png"
      alt="Fractalater"
      width={1024}
      height={643}
      className={`h-8 md:h-10 w-auto ${className}`}
      priority
    />
  );
}
