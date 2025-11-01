import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: senha,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determinar o role baseado no código de convite
      let role: "cliente" | "funcionario" | "admin" = "cliente";
      
      if (inviteCode.toUpperCase() === "MACACO") {
        role = "funcionario";
      } else if (inviteCode.toUpperCase() === "LEAO") {
        role = "admin";
      }

      // Criar usuário com código de convite nos metadata
      const { data, error } = await signUp(email, password, inviteCode);
      if (error) throw error;

      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 500));

      // Se tiver código de convite válido, atualizar o role
      if (inviteCode && data?.user) {
        let role: "cliente" | "funcionario" | "admin" = "cliente";
        
        if (inviteCode.toUpperCase() === "MACACO") {
          role = "funcionario";
        } else if (inviteCode.toUpperCase() === "LEAO") {
          role = "admin";
        }

        if (role !== "cliente") {
          const { error: roleError } = await supabase
            .from("user_roles")
            .update({ role })
            .eq("user_id", data.user.id);

          if (roleError) {
            console.error("Erro ao atualizar role:", roleError);
          }
        }
      }

      toast.success("Registro realizado com sucesso! Faça login com suas credenciais.");
      setIsRegisterMode(false);
      setEmail("");
      setPassword("");
      setInviteCode("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar");
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

        {/* Login/Register Card */}
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <p className="text-[#000080] font-bold text-center mb-8 text-sm uppercase tracking-wide">
            {isRegisterMode ? "Criar nova conta de cliente" : "Por favor digite o usuário e senha"}
          </p>

          {isRegisterMode ? (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="text-gray-500 text-sm font-medium block"
                >
                  Email
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
                  htmlFor="password" 
                  className="text-gray-500 text-sm font-medium block"
                >
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#000080] bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="inviteCode" 
                  className="text-gray-500 text-sm font-medium block"
                >
                  Link de Indicação (Opcional)
                </label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="MACACO ou LEAO"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#000080] bg-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para criar conta de cliente
                </p>
              </div>

              <Button
                type="submit" 
                className="w-full bg-[#000080] hover:bg-[#000060] text-white font-semibold py-6 rounded-lg mt-8" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>

              <p className="text-center text-sm mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-[#000080] hover:underline font-medium"
                >
                  Já tem conta? Faça login
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <label 
                  htmlFor="usuario" 
                  className="text-gray-500 text-sm font-medium block"
                >
                  Email
                </label>
                <Input
                  id="usuario"
                  type="email"
                  placeholder=""
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
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
                <Input
                  id="senha"
                  type="password"
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

              <p className="text-center text-sm mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="text-[#000080] hover:underline font-medium"
                >
                  Não tem registro? Clique aqui
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
