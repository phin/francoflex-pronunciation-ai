"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { api } from "@/lib/api"

const industries = [
  "Pharmaceutical",
  "Technology", 
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Education",
  "Legal",
  "Hospitality"
]

const learningLanguages = [
  { code: "en-us", name: "English (US)", flag: "🇺🇸" },
  { code: "fr-fr", name: "French (France)", flag: "🇫🇷" },
  { code: "es-es", name: "Spanish (Spain)", flag: "🇪🇸" }
]

const nativeLanguages = [
  { code: "en-us", name: "English (US)", flag: "🇺🇸" },
  { code: "fr-fr", name: "French (France)", flag: "🇫🇷" },
  { code: "es-es", name: "Spanish (Spain)", flag: "🇪🇸" },
  { code: "de-de", name: "German (Germany)", flag: "🇩🇪" },
  { code: "it-it", name: "Italian (Italy)", flag: "🇮🇹" },
  { code: "pt-pt", name: "Portuguese (Portugal)", flag: "🇵🇹" },
  { code: "nl-nl", name: "Dutch (Netherlands)", flag: "🇳🇱" },
  { code: "pl-pl", name: "Polish (Poland)", flag: "🇵🇱" },
  { code: "ru-ru", name: "Russian (Russia)", flag: "🇷🇺" },
  { code: "ja-jp", name: "Japanese (Japan)", flag: "🇯🇵" },
  { code: "ko-kr", name: "Korean (South Korea)", flag: "🇰🇷" },
  { code: "zh-cn", name: "Chinese (China)", flag: "🇨🇳" },
  { code: "ar-sa", name: "Arabic (Saudi Arabia)", flag: "🇸🇦" },
  { code: "hi-in", name: "Hindi (India)", flag: "🇮🇳" },
  { code: "tr-tr", name: "Turkish (Turkey)", flag: "🇹🇷" }
]

export default function PreferencesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [learningLanguage, setLearningLanguage] = useState("")
  const [nativeLanguage, setNativeLanguage] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Load existing user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setInitialLoading(false)
        return
      }

      try {
        console.log('Loading user data from FastAPI for user ID:', user.id)
        
        const result = await api.getPreferences(user.id)
        const data = result.data

        if (data) {
          // Load existing data into form
          setName(data.name || "")
          setIndustry(data.industry || "")
          setJobTitle(data.job || "")
          setLearningLanguage(data.learning || "")
          setNativeLanguage(data.native || "")
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        // Don't show error toast for "not found" - user might not have preferences yet
        if (error.message && !error.message.includes('No preferences found')) {
          toast.error("Failed to load preferences")
        }
      } finally {
        setInitialLoading(false)
      }
    }

    loadUserData()
  }, [user])

  const handleSave = async () => {
    console.log('handleSave called')
    console.log('Current user:', user)

    if (!user) {
      console.error('No user logged in')
      toast.error("You must be logged in to save preferences")
      return
    }

    // Validate required fields
    if (!learningLanguage || !nativeLanguage) {
      toast.error("Please select both learning and native languages")
      return
    }

    setLoading(true)

    try {
      // Prepare data for FastAPI
      const preferencesData = {
        learning: learningLanguage,
        native: nativeLanguage,
        industry: industry,
        job: jobTitle,
        name: name,
        user_id: user.id
      }

      console.log('Saving preferences via API:', preferencesData)

      // Call API endpoint
      const result = await api.savePreferences(preferencesData)

      console.log('Preferences saved successfully:', result)
      toast.success("Preferences saved successfully!")
      setShowSuccessDialog(true)

    } catch (error: any) {
      console.error('Error saving preferences:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        error: error
      })
      toast.error("Failed to save preferences: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }


  const handleCancel = () => {
    // Handle cancel logic here
    router.back()
  }

  // Show loading state while loading initial data
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Configure your pronunciation practice settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="job">Job Title</Label>
                <Input
                  id="job"
                  placeholder="Enter your job title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="learning-language">Learning Language</Label>
                <Select value={learningLanguage} onValueChange={setLearningLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select learning language" />
                  </SelectTrigger>
                  <SelectContent>
                    {learningLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="native-language">Native Language</Label>
                <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your native language" />
                  </SelectTrigger>
                  <SelectContent>
                    {nativeLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button 
            variant="neutral" 
            className="flex-1"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>

      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Preferences Saved!</AlertDialogTitle>
            <AlertDialogDescription>
              Your preferences have been saved successfully. You can now start your learning journey.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
