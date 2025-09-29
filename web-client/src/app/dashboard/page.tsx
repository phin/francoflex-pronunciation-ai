"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { Plus, Play, Clock, Target } from "lucide-react"

  const levels = [
    { value: "A1", label: "A1 - Beginner" },
    { value: "A2", label: "A2 - Elementary" },
    { value: "B1", label: "B1 - Intermediate" },
    { value: "B2", label: "B2 - Upper Intermediate" },
    { value: "C1", label: "C1 - Advanced" },
    { value: "C2", label: "C2 - Proficient" },
  ]

  const modes = [
    { value: "repeat", label: "Repeat Mode" },
    { value: "conversational", label: "Conversational Mode" },
  ]

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState("")
  const [selectedMode, setSelectedMode] = useState("repeat")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [creatingLevel, setCreatingLevel] = useState("")
  const [creatingMode, setCreatingMode] = useState("")

  // Load sessions when component mounts
  useEffect(() => {
    const loadSessions = async () => {
      if (!user) {
        setInitialLoading(false)
        return
      }

      try {
        console.log('Loading sessions for user:', user.id)
        const result = await api.getAllSessions(user.id)
        setSessions(result.data || [])
      } catch (error) {
        console.error('Error loading sessions:', error)
        // Don't show error toast for "not found" - user might not have sessions yet
        if (error.message && !error.message.includes('No sessions found')) {
          toast.error("Failed to load sessions")
        }
      } finally {
        setInitialLoading(false)
      }
    }

    loadSessions()
  }, [user])

  const handleCreateActivity = async () => {
    if (!user) {
      toast.error("You must be logged in to create an activity")
      return
    }

    if (!selectedLevel) {
      toast.error("Please select a level")
      return
    }

    // Close dialog immediately and show loading state
    setShowCreateDialog(false)
    setCreatingLevel(selectedLevel)
    setCreatingMode(selectedMode)
    setLoading(true)
    setSelectedLevel("")
    setSelectedMode("repeat")
    
    try {
      console.log('Creating session for level:', selectedLevel)
      
      const result = await api.createSession(user.id, selectedLevel, selectedMode)
      console.log('Session created:', result)
      
      if (result.success && result.data && result.data.length > 0) {
        // Get the session ID from the created session
        const sessionId = result.data[0].id || result.data[0].session_id
        
        // Reload sessions to show the new one
        const sessionsResult = await api.getAllSessions(user.id)
        setSessions(sessionsResult.data || [])
        
        toast.success("Activity created successfully!")
        
        // Redirect to appropriate page based on mode
        if (selectedMode === 'conversational') {
          router.push(`/voice_chat_conversational?sessionId=${sessionId}`)
        } else {
          router.push(`/voice_chat_activity?sessionId=${sessionId}`)
        }
      } else {
        throw new Error("Failed to create session - no data returned")
      }
      
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.error("Failed to create activity: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
      setCreatingLevel("")
    }
  }

  const handleStartActivity = (session: any) => {
    // Navigate to the appropriate page based on session type
    if (session.type === 'conversational') {
      router.push(`/voice_chat_conversational?sessionId=${session.id}`)
    } else {
      router.push(`/voice_chat_activity?sessionId=${session.id}`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getLevelColor = (level: string) => {
    const colors = {
      A1: "bg-green-100 text-green-800",
      A2: "bg-blue-100 text-blue-800", 
      B1: "bg-yellow-100 text-yellow-800",
      B2: "bg-orange-100 text-orange-800",
      C1: "bg-red-100 text-red-800",
      C2: "bg-purple-100 text-purple-800"
    }
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  // Show loading state while loading initial data
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your learning progress and activities</p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Activity
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessions.filter(s => s.completed).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessions.filter(s => !s.completed).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessions.reduce((sum, s) => sum + (s.content?.length || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Loading Activity Card */}
          {loading && (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Creating Activity...</CardTitle>
                    <CardDescription className="mt-1">
                      {creatingMode} • Level {creatingLevel}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-200`}>
                    {creatingLevel}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>Creating...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-main h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Creating</span>
                    <Button disabled className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {sessions.length === 0 && !loading ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 mb-4">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No sessions yet</h3>
                <p className="text-sm">Create your first activity to get started!</p>
              </div>
            </div>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{formatDate(session.created_at)}</CardTitle>
                      <CardDescription className="mt-1">
                        {session.type === 'conversational' ? 'Conversational' : 'Repeat'} • Level {session.level}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(session.level)}`}>
                      {session.level}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span>0%</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-orange-600">
                        In Progress
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => handleStartActivity(session)}
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Activity Dialog */}
        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Activity</AlertDialogTitle>
              <AlertDialogDescription>
                Choose a difficulty level for your new learning activity. This will generate personalized questions and audio content based on your preferences.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Mode
                </label>
                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {modes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Level
                </label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowCreateDialog(false)
                setSelectedLevel("")
                setSelectedMode("repeat")
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCreateActivity}
                disabled={!selectedLevel || loading}
              >
                {loading ? "Creating..." : "Create Activity"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
