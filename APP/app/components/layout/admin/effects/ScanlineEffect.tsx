export default function ScanlineEffect() {
  return (
    <div className="absolute inset-0">
      <div
        className="
          absolute inset-0
          opacity-[0.12]
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]
          bg-[length:100%_4px]
          animate-scanline
        "
      />
    </div>
  );
}
