export default function SecurityBackground() {
  return (
    <>
      {/* Soft enterprise gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/6 via-transparent to-cyan-400/6" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient opacity-30" />

      {/* Noise layer (Apple style) */}
      <div className="absolute inset-0 opacity-[0.025] bg-[url('/noise.png')]" />
    </>
  );
}
