"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Eye, EyeOff, X, Home, Loader2 } from "lucide-react"
import Image from "next/image"
import { NestFindLogo } from "@/components/nestfind-logo"
import { login, register } from "@/lib/api"

export default function AuthPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"signup" | "signin">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<"USER" | "AGENT">("USER")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register({ email, password, firstName, lastName, phone, role })
      router.push("/onboarding")
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left: Auth form on white background */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md">
          <div className="bg-white border border-black/10 rounded-[32px] p-8 shadow-xl shadow-black/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex bg-muted/40 rounded-full p-1 border border-black/10">
                <button
                  onClick={() => setActiveTab("signup")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeTab === "signup"
                      ? "bg-foreground text-background border border-foreground shadow-lg"
                      : "text-foreground/60 hover:text-foreground hover:bg-black/5"
                  }`}
                >
                  S&apos;inscrire
                </button>
                <button
                  onClick={() => setActiveTab("signin")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeTab === "signin"
                      ? "bg-foreground text-background border border-foreground shadow-lg"
                      : "text-foreground/60 hover:text-foreground hover:bg-black/5"
                  }`}
                >
                  Se connecter
                </button>
              </div>
              <button
                onClick={() => router.push("/")}
                className="w-10 h-10 bg-muted/40 rounded-full flex items-center justify-center border border-black/10 hover:bg-muted transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-muted border border-black/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-foreground" />
              </div>
              <NestFindLogo size="md" />
            </div>
            <h1 className="text-3xl font-semibold text-foreground mt-6 mb-2">
              {activeTab === "signup" ? "Créer un compte" : "Bon retour"}
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              {activeTab === "signup"
                ? "Rejoignez ImmoGeo et trouvez votre prochain logement au Cameroun."
                : "Connectez-vous pour reprendre votre recherche immobilière."}
            </p>

            {/* Forms */}
            <div className="relative">
              {/* Sign Up */}
              {activeTab === "signup" && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-white border border-black/10 rounded-2xl h-14 text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-0 focus:outline-none text-base transition-all duration-200 hover:bg-muted/30 px-4"
                      placeholder="Prénom"
                      required
                    />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-white border border-black/10 rounded-2xl h-14 text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-0 focus:outline-none text-base transition-all duration-200 hover:bg-muted/30 px-4"
                      placeholder="Nom"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-2xl h-14 text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-0 focus:outline-none pl-12 text-base transition-all duration-200 hover:bg-muted/30 px-4"
                      placeholder="Adresse e-mail"
                      required
                    />
                  </div>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-black/10 rounded-2xl h-14 text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-0 focus:outline-none text-base transition-all duration-200 hover:bg-muted/30 px-4"
                    placeholder="Téléphone (ex: +237690000000)"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("USER")}
                      className={`flex-1 h-12 rounded-2xl text-sm font-medium border transition-all ${
                        role === "USER"
                          ? "bg-foreground text-background border-foreground"
                          : "bg-white border-black/10 text-foreground/60 hover:bg-muted/30"
                      }`}
                    >
                      Chercheur
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("AGENT")}
                      className={`flex-1 h-12 rounded-2xl text-sm font-medium border transition-all ${
                        role === "AGENT"
                          ? "bg-foreground text-background border-foreground"
                          : "bg-white border-black/10 text-foreground/60 hover:bg-muted/30"
                      }`}
                    >
                      Agent / Propriétaire
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-2xl h-14 text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-0 focus:outline-none pr-12 text-base transition-all duration-200 hover:bg-muted/30 px-4"
                      placeholder="Mot de passe"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-foreground text-background font-medium rounded-2xl h-14 mt-4 text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading ? "Création..." : "Créer un compte"}
                  </button>
                </form>
              )}

              {/* Sign In */}
              {activeTab === "signin" && (
                <form onSubmit={handleSignin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-2xl h-14 text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-0 focus:outline-none pl-12 text-base transition-all duration-200 hover:bg-muted/30 px-4"
                      placeholder="Adresse e-mail"
                      required
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-black/10 rounded-2xl h-14 text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-0 focus:outline-none pr-12 text-base transition-all duration-200 hover:bg-muted/30 px-4"
                      placeholder="Mot de passe"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border border-black/20 bg-white text-foreground focus:ring-foreground/20 focus:ring-2"
                      />
                      <span className="text-muted-foreground text-sm">Se souvenir de moi</span>
                    </label>
                    <button type="button" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-foreground text-background font-medium rounded-2xl h-14 mt-4 text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {loading ? "Connexion..." : "Se connecter"}
                  </button>
                </form>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-black/10" />
              <span className="px-4 text-muted-foreground text-sm font-medium">
                {activeTab === "signup" ? "OU S'INSCRIRE AVEC" : "OU CONTINUER AVEC"}
              </span>
              <div className="flex-1 h-px bg-black/10" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-3 gap-3">
              <button className="bg-white border border-black/10 rounded-2xl h-14 flex items-center justify-center hover:bg-muted/40 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
              <button className="bg-white border border-black/10 rounded-2xl h-14 flex items-center justify-center hover:bg-muted/40 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
              <button className="bg-white border border-black/10 rounded-2xl h-14 flex items-center justify-center hover:bg-muted/40 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
                <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </button>
            </div>

            <p className="text-center text-muted-foreground text-sm mt-8">
              {activeTab === "signup"
                ? "En créant un compte, vous acceptez nos Conditions d'utilisation"
                : "En vous connectant, vous acceptez nos Conditions d'utilisation"}
            </p>
          </div>
        </div>
      </div>

      {/* Right: House image panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <Image
          src="/images/hero-house.jpg"
          alt="Maison moderne à louer au Cameroun"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
      </div>
    </div>
  )
}
