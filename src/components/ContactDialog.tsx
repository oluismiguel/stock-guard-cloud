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
  const whatsappUrl = "https://api.whatsapp.com/send/?phone=553598746037&text=&type=phone_number&app_absent=0&wame_ctl=1&fbclid=PAb21jcAN4PtdleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA81NjcwNjczNDMzNTI0MjcAAac3JJWgxDfQjAeeznFulRn6l_RET3_tI5guozLzyNvI9B2IP5xVmBE4cioV7A_aem_UlJivlF5JJG4i_mYgtDedg";
  const instagramUrl = "https://www.instagram.com/ddiksports?igsh=MTUxenQyM2pjcnRrdA==";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entre em Contato</DialogTitle>
          <DialogDescription>
            Fale conosco através dos nossos canais
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-900">WhatsApp</p>
              <p className="text-sm text-green-700">+55 35 9874-6037</p>
            </div>
          </a>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors border border-pink-200"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full">
              <Instagram className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-pink-900">Instagram</p>
              <p className="text-sm text-pink-700">@ddiksports</p>
            </div>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
