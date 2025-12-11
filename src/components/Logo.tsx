export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent ${className}`}>
      Fractalater
    </span>
  );
}
