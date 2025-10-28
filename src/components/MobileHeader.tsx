import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { NotificationBell } from "./NotificationBell";
import UserProfile from "./UserProfile";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
}

const MobileHeader = ({ title, subtitle }: MobileHeaderProps) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-b from-[#000080] to-[#0000CD] text-white px-4 py-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/80 active:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </button>
          
          <div className="flex gap-2 items-center">
            <NotificationBell />
            <button
              onClick={() => setProfileOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <User className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
      </div>
      
      <UserProfile open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
};

export default MobileHeader;
