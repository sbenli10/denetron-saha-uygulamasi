export default function ScanlineEffect() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-0 top-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_3px] opacity-20 animate-scanline" />
    </div>
  );
}
