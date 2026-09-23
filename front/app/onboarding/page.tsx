"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ArrowRight, Home, Building2, Trees, Store, Warehouse, Briefcase, Hotel, Bath, Car, Dumbbell, Waves, Camera, User } from "lucide-react"
import { NestFindLogo } from "@/components/nestfind-logo"
import { getToken, updatePreferences, updateProfile } from "@/lib/api"

const PROPERTY_TYPES = [
  { label: "Maison à louer", icon: Home },
  { label: "Maison à vendre", icon: Home },
  { label: "Appartement à louer", icon: Building2 },
  { label: "Appartement à vendre", icon: Building2 },
  { label: "Studio", icon: Building2 },
  { label: "Villa", icon: Home },
  { label: "Terrain", icon: Trees },
  { label: "Bureau commercial", icon: Briefcase },
  { label: "Magasin", icon: Store },
  { label: "Entrepôt", icon: Warehouse },
  { label: "Hotel", icon: Hotel },
  { label: "Résidence", icon: Building2 },
]

// Libellés d'affichage → codes stockés en base (users.preferred_types)
const TYPE_MAP: Record<string, string> = {
  "Maison à louer": "maison",
  "Maison à vendre": "maison",
  "Appartement à louer": "appartement",
  "Appartement à vendre": "appartement",
  "Studio": "studio",
  "Villa": "villa",
  "Terrain": "terrain",
  "Bureau commercial": "bureau",
  "Magasin": "magasin",
  "Entrepôt": "entrepot",
  "Hotel": "hotel",
  "Résidence": "residence",
}

const AMENITIES = [
  { label: "Piscine", icon: Waves },
  { label: "Garage / Parking", icon: Car },
  { label: "Salle de sport", icon: Dumbbell },
  { label: "Douche intérieure", icon: Bath },
  { label: "Jardin", icon: Trees },
  { label: "Cuisine équipée", icon: Home },
]

const CITIES = [
  "Yaoundé",
  "Douala",
  "Bafoussam",
  "Bamenda",
  "Garoua",
  "Maroua",
  "Buea",
  "Limbe",
  "Kribi",
  "Ebolowa",
  "Ngaoundéré",
  "Dschang",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Étape profil (dernière) : prénom, nom, téléphone, photo
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)

  const chipSteps = [
    {
      title: "Quel type de bien recherchez-vous ?",
      subtitle: "Sélectionnez un ou plusieurs types de biens immobiliers.",
      items: PROPERTY_TYPES,
      selected: selectedTypes,
      setSelected: setSelectedTypes,
    },
    {
      title: "Quelles commodités souhaitez-vous ?",
      subtitle: "Choisissez les équipements et commodités importants pour vous.",
      items: AMENITIES,
      selected: selectedAmenities,
      setSelected: setSelectedAmenities,
    },
    {
      title: "Dans quelles villes cherchez-vous ?",
      subtitle: "Sélectionnez les villes camerounaises qui vous intéressent.",
      items: CITIES.map((c) => ({ label: c, icon: null as any })),
      selected: selectedCities,
      setSelected: setSelectedCities,
    },
  ]
  const isProfileStep = step === chipSteps.length
  const totalSteps = chipSteps.length + 1

  const current = chipSteps[step] || null
  const totalSelected = isProfileStep
    ? [firstName, lastName, phone, photo].filter(Boolean).length
    : current.selected.length

  const toggle = (label: string) => {
    current.setSelected((prev: string[]) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Sauvegarde réelle : préférences + profil sont persistés en base et
  // réutilisés ensuite (recommandations, filtres, recherches).
  const saveAll = async () => {
    if (!getToken()) return // pas connecté → on passe sans sauvegarder
    const preferredTypes = [...new Set(selectedTypes.map((l) => TYPE_MAP[l] || l.toLowerCase()))]
    const tasks: Promise<unknown>[] = []
    if (preferredTypes.length || selectedCities.length || selectedAmenities.length) {
      tasks.push(
        updatePreferences({
          preferredTypes,
          preferredZones: selectedCities,
          preferredAmenities: selectedAmenities,
        })
      )
    }
    if (firstName.trim() || lastName.trim() || phone.trim() || photo) {
      tasks.push(
        updateProfile({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          phone: phone.trim() || undefined,
          profilePhoto: photo || undefined,
        })
      )
    }
    await Promise.allSettled(tasks)
  }

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      setLoading(true)
      try {
        await saveAll()
      } finally {
        router.push("/dashboard")
      }
    }
  }

  const handleSkip = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 anim-fade-up">
        <NestFindLogo size="md" />
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-12">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-foreground" : i < step ? "w-2 bg-foreground/60" : "w-2 bg-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* Title */}
      <div className="text-center mb-12 anim-fade-up max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          {isProfileStep ? "Complétez votre profil" : current.title}
        </h1>
        <p className="text-muted-foreground text-base">
          {isProfileStep
            ? "Dernière étape : vos informations seront visibles par les annonceurs."
            : current.subtitle}
        </p>
      </div>

      {isProfileStep ? (
        /* ── Étape profil ── */
        <div className="w-full max-w-sm space-y-4 anim-fade-up">
          {/* Photo */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              {photo ? (
                <img src={photo} alt="Profil" className="w-24 h-24 rounded-full object-cover border-2 border-foreground/20" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center group-hover:border-foreground/40 transition-colors">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
            </label>
          </div>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom"
            className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm outline-none focus:border-foreground/40"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm outline-none focus:border-foreground/40"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone (+237…)"
            type="tel"
            className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm outline-none focus:border-foreground/40"
          />
        </div>
      ) : (
        /* ── Chips ── */
        <div className="max-w-[640px] w-full">
          <motion.div
            className="flex flex-wrap gap-3 justify-center"
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
          >
            {current.items.map((item) => {
              const isSelected = current.selected.includes(item.label)
              const Icon = item.icon
              return (
                <motion.button
                  key={item.label}
                  onClick={() => toggle(item.label)}
                  layout
                  initial={false}
                  animate={{
                    backgroundColor: isSelected ? "var(--foreground)" : "transparent",
                  }}
                  whileHover={{
                    backgroundColor: isSelected ? "var(--foreground)" : "var(--secondary)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5,
                    backgroundColor: { duration: 0.15 },
                  }}
                  className={`inline-flex items-center px-4 py-2.5 rounded-full text-base font-medium whitespace-nowrap ring-1 ring-inset transition-colors ${
                    isSelected
                      ? "text-background ring-foreground"
                      : "text-foreground ring-border hover:ring-foreground/30"
                  }`}
                >
                  <motion.div
                    className="relative flex items-center gap-2"
                    animate={{ paddingRight: isSelected ? "1.5rem" : "0" }}
                    transition={{ ease: [0.175, 0.885, 0.32, 1.275], duration: 0.3 }}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
                          className="absolute right-0"
                        >
                          <div className="w-5 h-5 rounded-full bg-background flex items-center justify-center">
                            <Check className="w-3 h-3 text-foreground" strokeWidth={2.5} />
                          </div>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.button>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 flex flex-col items-center gap-4 anim-fade-up">
        <p className="text-sm text-muted-foreground">
          {totalSelected > 0
            ? `${totalSelected} sélectionné${totalSelected > 1 ? "s" : ""}`
            : "Sélectionnez au moins un élément — ou passez directement"}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="px-6 py-3 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 transition-all"
          >
            Passer
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-3 rounded-full text-sm font-bold bg-foreground text-background hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              "Enregistrement..."
            ) : step < totalSteps - 1 ? (
              <>
                Suivant
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Terminer
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
