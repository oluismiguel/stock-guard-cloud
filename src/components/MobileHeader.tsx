import { ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { NotificationBell } from "./NotificationBell";
import UserProfile from "./UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
}

const MobileHeader = ({ title, subtitle }: MobileHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("profile_picture_url")
        .eq("id", user?.id)
        .single();

      if (data?.profile_picture_url) {
        setProfilePicture(data.profile_picture_url);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

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
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={profilePicture || undefined} />
                <AvatarFallback className="bg-white/20">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
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
