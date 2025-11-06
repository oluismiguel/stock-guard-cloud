import { MessageCircle, Instagram, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ContactDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/20">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Entre em Contato</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Fale conosco através dos nossos canais
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <a
            href="https://api.whatsapp.com/send/?phone=553598746037&text=&type=phone_number&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all duration-300 border border-[#25D366]/30 group"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white group-hover:scale-110 transition-transform">
              <Phone className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">WhatsApp</p>
              <p className="text-sm text-muted-foreground">+55 35 9874-6037</p>
            </div>
          </a>

          <a
            href="https://www.instagram.com/ddiksports?igsh=MTUxenQyM2pjcnRrdA=="
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-[#833AB4]/10 via-[#E1306C]/10 to-[#F56040]/10 hover:from-[#833AB4]/20 hover:via-[#E1306C]/20 hover:to-[#F56040]/20 transition-all duration-300 border border-[#E1306C]/30 group"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F56040] text-white group-hover:scale-110 transition-transform">
              <Instagram className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Instagram</p>
              <p className="text-sm text-muted-foreground">@ddiksports</p>
            </div>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
