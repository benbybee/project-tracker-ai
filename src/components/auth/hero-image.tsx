export default function HeroImage() {
  return (
    <div className="h-full w-full rounded-[18px] overflow-hidden shadow-inner relative">
      {/* Cyberpunk/synthwave hero image */}
      <div 
        className="h-full w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/cyberpunk-hero.jpg')"
        }}
      />
    </div>
  );
}
