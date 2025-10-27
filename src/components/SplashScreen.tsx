import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#000080] to-[#0000CD] transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Wave Background */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2">
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
        >
          <path
            fill="#0000FF"
            fillOpacity="0.8"
            d="M0,160L48,165.3C96,171,192,181,288,186.7C384,192,480,192,576,181.3C672,171,768,149,864,149.3C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
        <div className="absolute inset-0 bg-white rounded-t-[50%]"></div>
      </div>

      {/* Logo and Text */}
      <div className="relative z-10 text-center px-8 mb-32">
        <h1 className="text-white font-black text-5xl md:text-6xl mb-4 tracking-wider">
          D-DIK
        </h1>
        <h2 className="text-white font-black text-5xl md:text-6xl mb-8 tracking-wider">
          SPORTS
        </h2>
        <p className="text-[#0000FF] font-bold text-lg md:text-xl mt-16">
          SUA LOJA DE ARTIGOS
        </p>
        <p className="text-[#0000FF] font-bold text-lg md:text-xl">
          ESPORTIVOS
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
