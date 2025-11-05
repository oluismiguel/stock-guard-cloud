import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, senha);

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#000080] to-[#0000CD] relative overflow-hidden">
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

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-16 px-6">
        {/* Logo */}
        <div className="text-center mb-16">
          <h1 className="text-white font-black text-4xl md:text-5xl mb-2 tracking-wider">
            D-DIK
          </h1>
          <h2 className="text-white font-black text-4xl md:text-5xl tracking-wider">
            SPORTS
          </h2>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <p className="text-[#000080] font-bold text-center mb-8 text-sm uppercase tracking-wide">
            Por favor digite o usuário e senha
          </p>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-gray-500 text-sm font-medium block"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#000080] bg-transparent"
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="senha" 
                className="text-gray-500 text-sm font-medium block"
              >
                Senha
              </label>
              <PasswordInput
                id="senha"
                placeholder=""
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#000080] bg-transparent"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#000080] hover:bg-[#000060] text-white font-semibold py-6 rounded-lg mt-8" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="text-center mt-4">
              <Link 
                to="/register" 
                className="text-[#000080] hover:text-[#000060] text-sm font-medium"
              >
                Não tem registro? Clique aqui
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
