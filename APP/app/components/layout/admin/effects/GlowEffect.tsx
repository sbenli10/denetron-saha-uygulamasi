export default function GlowEffect() {
  return (
    <div
      className="
        absolute inset-0
        opacity-[0.18]
        bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.9)_0%,transparent_55%),radial-gradient(circle_at_80%_100%,rgba(34,197,94,0.9)_0%,transparent_55%)]
        blur-[2px]
      "
    />
  );
}
