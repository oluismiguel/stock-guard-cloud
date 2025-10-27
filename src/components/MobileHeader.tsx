import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
}

const MobileHeader = ({ title, subtitle }: MobileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-[#000080] to-[#0000CD] text-white px-4 py-6 pb-8">
      <button
        onClick={() => navigate("/")}
        className="mb-4 flex items-center gap-2 text-white/80 active:text-white"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Voltar</span>
      </button>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
    </div>
  );
};

export default MobileHeader;
