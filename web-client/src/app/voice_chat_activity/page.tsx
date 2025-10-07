"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { toast, Toaster } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, Send, Volume2, Square, RotateCcw, CheckCircle, AlertCircle, Play, Pause, BarChart3, ChevronDown } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isAudio?: boolean
  audioUrl?: string
  nativeTranslation?: string
}

export default function VoiceChatActivityPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(25)
  const [isRecording, setIsRecording] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({})
  const [selectedWord, setSelectedWord] = useState<{word: string, score: number, analysis: string} | null>(null)
  
  // Translation drawer state
  const [translationDrawerOpen, setTranslationDrawerOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  
  // Session data
  const [sessionData, setSessionData] = useState<any>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Analysis data
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [analysisReady, setAnalysisReady] = useState(false)

  // Load session data and messages when component mounts
  useEffect(() => {
    const loadSessionData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const sessionId = searchParams.get('sessionId')
        console.log('Loading session data for user:', user.id, 'sessionId:', sessionId)
        
        if (sessionId) {
          // Load specific session by ID
          const sessionResult = await api.getSpecificSession(user.id, sessionId)
          console.log('Session data loaded:', sessionResult)
          
          if (sessionResult.success && sessionResult.data) {
            setSessionData(sessionResult.data)
            
            // Load existing messages from database
            try {
              const messagesResult = await api.getMessagesFromSession(sessionId)
              console.log('Messages loaded:', messagesResult)
              
              if (messagesResult.success && messagesResult.data.length > 0) {
                // Convert database messages to UI format
                const dbMessages = messagesResult.data.map((msg: any) => ({
                  id: msg.id,
                  type: msg.author === 'system' ? 'ai' : 'user',
                  content: msg.content,
                  timestamp: new Date(msg.created_at),
                  audioUrl: msg.metadata?.audio_url,
                }))
                setMessages(dbMessages)
                
                // Get the current question index based on completed questions
                try {
                  const nextQuestionResult = await api.getNextQuestion(sessionId, user.id)
                  if (nextQuestionResult.success && nextQuestionResult.data) {
                    setCurrentQuestionIndex(nextQuestionResult.data.index)
                  } else {
                    // All questions completed, set to last question
                    setCurrentQuestionIndex(sessionResult.data.content.length - 1)
                  }
                } catch (error) {
                  console.error('Error getting current question index:', error)
                  setCurrentQuestionIndex(0)
                }
                
                // Load latest pronunciation analysis
                try {
                  const latestAnalysisResult = await api.getLatestPronunciationAnalysis(user.id)
                  if (latestAnalysisResult.success && latestAnalysisResult.data) {
                    setAnalysisData(latestAnalysisResult.data.content)
                    setAnalysisReady(true)
                    console.log("✅ Loaded latest pronunciation analysis from database")
                  }
                } catch (analysisError) {
                  console.error('Error loading latest pronunciation analysis:', analysisError)
                }
              } else {
                // No messages exist, generate and save greeting message first
                try {
                  // Get user preferences for language info
                  const userPrefs = await api.getPreferences(user.id)
                  const learningLanguage = userPrefs.data?.[0]?.learning || 'fr'
                  
                  // Generate personalized greeting
                  const greetingResult = await api.generateGreeting({
                    user_name: userPrefs.data?.[0]?.name || 'Student',
                    learning_language: learningLanguage,
                    session_content: sessionResult.data.content || [],
                    level: sessionResult.data.level || 'B1'
                  })
                  
                  const messages = []
                  
                  if (greetingResult.success) {
                    // Save greeting message
                    const greetingMessage = {
                      author: 'system',
                      session_id: sessionId,
                      content: greetingResult.data.greeting,
                      audio_url: undefined,
                      user_id: user.id,
                    }
                    
                    const greetingSaveResult = await api.saveMessage(greetingMessage)
                    if (greetingSaveResult.success) {
                      const greetingMsg: Message = {
                        id: greetingSaveResult.data.id,
                        type: "ai",
                        content: greetingResult.data.greeting,
                        timestamp: new Date(greetingSaveResult.data.created_at),
                      }
                      messages.push(greetingMsg)
                    }
                  }
                  
                  // Then save the first question as a system message
                  const firstQuestion = sessionResult.data.content?.[0]
                  if (firstQuestion) {
                    const systemMessage = {
                      author: 'system',
                      session_id: sessionId,
                      content: firstQuestion.learning,
                      audio_url: firstQuestion.audio_url,
                      user_id: user.id,
                    }
                    
                    const messageSaveResult = await api.saveMessage(systemMessage)
                    if (messageSaveResult.success) {
                      const firstMsg: Message = {
                        id: messageSaveResult.data.id,
                        type: "ai",
                        content: firstQuestion.learning,
                        timestamp: new Date(messageSaveResult.data.created_at),
                        audioUrl: firstQuestion.audio_url,
                      }
                      messages.push(firstMsg)
                    }
                  }
                  
                  setMessages(messages)
                  
                } catch (error) {
                  console.error('Error initializing session messages:', error)
                  // Fallback: just show the first question
                  const firstQuestion = sessionResult.data.content?.[0]
                  if (firstQuestion) {
                    const firstMsg: Message = {
                      id: 'temp-' + Date.now(),
                      type: "ai",
                      content: firstQuestion.learning,
                      timestamp: new Date(),
                      audioUrl: firstQuestion.audio_url,
                    }
                    setMessages([firstMsg])
                  }
                }
              }
            } catch (messageError) {
              console.error('Error loading messages:', messageError)
              // Fallback to first question if message loading fails
              const firstQuestion = sessionResult.data.content?.[0]
              if (firstQuestion) {
                setMessages([
                  {
                    id: "1",
                    type: "ai",
                    content: firstQuestion.learning,
                    timestamp: new Date(),
                    audioUrl: firstQuestion.audio_url,
                  }
                ])
              }
            }
          }
        } else {
          // Get most recent session (auto-creates if none exists)
          const result = await api.getSession(user.id)
          console.log('Session data loaded:', result)

          if (result.success && result.data) {
            setSessionData(result.data)
            // Initialize messages with the first question
            const firstQuestion = result.data.content?.[0]
            if (firstQuestion) {
              setMessages([
                {
                  id: "1",
                  type: "ai",
                  content: firstQuestion.learning,
                  timestamp: new Date(),
                  audioUrl: firstQuestion.audio_url,
                }
              ])
            }
          }
        }
      } catch (error) {
        console.error('Error loading session data:', error)
        // Keep the default messages if session loading fails
      } finally {
        setLoading(false)
      }
    }

    loadSessionData()
  }, [user, searchParams])
  
  // Pronunciation analysis data for each question
  const pronunciationAnalysis = [
    {
      id: "1",
      question: "Bonjour, je suis nouveau dans l'apprentissage du français. Je travaille dans le secteur pharmaceutique.",
      score: 78,
      wordScores: [
        { word: "Bonjour", score: 85, analysis: "Good pronunciation. The 'j' sound is clear and the nasal 'on' is well articulated." },
        { word: "je", score: 90, analysis: "Excellent. The 'j' sound is perfect and the vowel is clear." },
        { word: "suis", score: 80, analysis: "Good pronunciation. The 's' sound could be slightly softer." },
        { word: "nouveau", score: 75, analysis: "The 'eau' ending needs work. Try to make the 'o' sound more rounded." },
        { word: "dans", score: 88, analysis: "Very good. The nasal 'an' is well pronounced." },
        { word: "l'apprentissage", score: 70, analysis: "Complex word. Break it down: 'ap-pren-ti-ssage'. The double 's' needs emphasis." },
        { word: "du", score: 92, analysis: "Perfect pronunciation. The liaison is natural." },
        { word: "français", score: 78, analysis: "Good overall. The 'ç' sound is correct but could be softer." },
        { word: "Je", score: 85, analysis: "Consistent with previous pronunciation. Well done." },
        { word: "travaille", score: 72, analysis: "The 'ai' sound needs work. It should be more like 'ay'." },
        { word: "dans", score: 88, analysis: "Consistent pronunciation. Good repetition." },
        { word: "le", score: 90, analysis: "Perfect. The 'l' sound is clear and natural." },
        { word: "secteur", score: 76, analysis: "Good attempt. The 'ct' combination could be smoother." },
        { word: "pharmaceutique", score: 65, analysis: "Challenging word. Practice: 'far-ma-sö-tik'. The 'ph' should be 'f' sound." }
      ],
      feedback: "Bon travail ! Votre prononciation est correcte. Essayez de ralentir un peu sur 'pharmaceutique'.",
      audioUrls: {
        user: "/talking/talking_01.mp4",
        native: "/speech-intro.mp3"
      }
    },
    {
      id: "2", 
      question: "Je présente les résultats des essais cliniques de notre nouveau médicament.",
      score: 85,
      wordScores: [
        { word: "Je", score: 90, analysis: "Perfect pronunciation. Consistent with previous attempts." },
        { word: "présente", score: 85, analysis: "Very good. The 'é' sound is clear and the 't' is properly pronounced." },
        { word: "les", score: 88, analysis: "Excellent. The 'l' sound is natural and the 's' is correctly silent." },
        { word: "résultats", score: 82, analysis: "Good overall. The 'é' and 'a' sounds are clear." },
        { word: "des", score: 92, analysis: "Perfect. The liaison with the next word is natural." },
        { word: "essais", score: 78, analysis: "Good attempt. The 'ai' sound could be more like 'ay'." },
        { word: "cliniques", score: 75, analysis: "The 'cl' combination needs work. Try 'klee-neek'." },
        { word: "de", score: 90, analysis: "Perfect pronunciation and liaison." },
        { word: "notre", score: 85, analysis: "Very good. The 'o' sound is clear." },
        { word: "nouveau", score: 80, analysis: "Better than before. Keep working on the 'eau' ending." },
        { word: "médicament", score: 72, analysis: "Complex word. Practice: 'may-dee-ka-mahn'. The 'é' should be 'ay' sound." }
      ],
      feedback: "Excellente prononciation ! Votre articulation est très claire.",
      audioUrls: {
        user: "/talking/talking_02.mp4",
        native: "/speech-intro.mp3"
      }
    },
    {
      id: "3",
      question: "Les effets secondaires sont minimaux et bien tolérés par les patients.",
      score: 72,
      wordScores: [
        { word: "Les", score: 85 },
        { word: "effets", score: 78 },
        { word: "secondaires", score: 72 },
        { word: "sont", score: 88 },
        { word: "minimaux", score: 68 },
        { word: "et", score: 92 },
        { word: "bien", score: 85 },
        { word: "tolérés", score: 70 },
        { word: "par", score: 90 },
        { word: "les", score: 88 },
        { word: "patients", score: 75 }
      ],
      feedback: "Bon effort ! Concentrez-vous sur l'intonation des mots techniques.",
      audioUrls: {
        user: "/talking/talking_03.mp4",
        native: "/speech-intro.mp3"
      }
    }
  ]
  
  const [messages, setMessages] = useState<Message[]>([])


  const handleVoiceRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        const audioChunks: Blob[] = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
          setRecordedAudio(audioBlob)
          const url = URL.createObjectURL(audioBlob)
          setAudioUrl(url)
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
        
        // Store mediaRecorder reference for stopping
        ;(window as any).currentMediaRecorder = mediaRecorder
      } catch (error) {
        console.error('Error accessing microphone:', error)
        alert('Unable to access microphone. Please check permissions.')
      }
    } else {
      // Stop recording
      const mediaRecorder = (window as any).currentMediaRecorder
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        setIsRecording(false)
      }
    }
  }

  const handlePlayRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      setIsPlayingRecording(true)
      
      audio.onended = () => {
        setIsPlayingRecording(false)
      }
      
      audio.play()
    }
  }

  const handleSubmitRecording = async () => {
    if (recordedAudio && user) {
      setIsGenerating(true)
      
      try {
        // Get session ID from URL parameters or from session data
        const sessionId = searchParams.get('sessionId') || sessionData?.id

        if (!sessionId) {
          console.error('No session ID found')
          toast.error('No active session found')
          return
        }
        
        // Convert Blob to File
        const audioFile = new File([recordedAudio], 'recording.wav', {
          type: 'audio/wav'
        })
        
        console.log('Uploading audio file:', audioFile.name, audioFile.size, 'bytes')
        
        // Upload audio to backend
        const uploadResult = await api.uploadAudio(audioFile, user.id, sessionId)
        console.log('Audio upload result:', uploadResult)
        
        // Save user message to database
        const userMessage = {
          author: 'user',
          session_id: sessionId,
          content: "[Message vocal]",
          audio_url: uploadResult.data.audio_url,
          user_id: user.id,
        }
        
        const saveResult = await api.saveMessage(userMessage)
        console.log('User message saved:', saveResult)
        
        if (saveResult.success) {
          const newMessage: Message = {
            id: saveResult.data.id,
            type: "user",
            content: "[Message vocal]",
            timestamp: new Date(saveResult.data.created_at),
            isAudio: true,
            audioUrl: uploadResult.data.audio_url,
          }
          
          setMessages(prev => [...prev, newMessage])
          setProgress(prev => Math.min(prev + 5, 100))
          
          // Trigger pronunciation analysis
          try {
            console.log('Starting pronunciation analysis...')
            
            // Get the current question text for analysis
            const currentQuestion = sessionData?.content?.[currentQuestionIndex]
            if (currentQuestion) {
              const analysisResult = await api.analyzePronunciation({
                audio_url: uploadResult.data.audio_url,
                target_text: currentQuestion.learning,
                session_id: sessionId,
                analysis_language: "fr-fr",
                native_language: "en" // You can get this from user preferences
              })
              
              console.log('Pronunciation analysis completed:', analysisResult)
              
              if (analysisResult.success) {
                // Save pronunciation analysis to database
                try {
                  const saveAnalysisResult = await api.savePronunciationAnalysis({
                    user_id: user.id,
                    level: sessionData.level || "B1",
                    analysis_content: analysisResult.data,
                    analysis_type: "repeat"
                  })
                  
                  if (saveAnalysisResult.success) {
                    console.log("✅ Pronunciation analysis saved to database")
                  }
                } catch (saveError) {
                  console.error("Error saving pronunciation analysis:", saveError)
                }
                
                setAnalysisData(analysisResult.data)
                setAnalysisReady(true)
                
                // Show toast notification
                toast.success("🎉 Pronunciation analysis is ready!", {
                  description: "Click on the Analysis panel to view your results",
                  duration: 5000,
                })
                
                // Save the summary message from AI
                const summaryMessage = {
                  author: 'system',
                  session_id: sessionId,
                  content: analysisResult.data.summary,
                  audio_url: undefined,
                  user_id: user.id,
                }
                
                const summarySaveResult = await api.saveMessage(summaryMessage)
                if (summarySaveResult.success) {
                  const summaryMsg: Message = {
                    id: summarySaveResult.data.id,
                    type: "ai",
                    content: analysisResult.data.summary,
                    timestamp: new Date(summarySaveResult.data.created_at),
                  }
                  setMessages(prev => [...prev, summaryMsg])
                }
                
                // Update current question status to done
                try {
                  await api.updateQuestionStatus(sessionId, currentQuestionIndex, user.id)
                  console.log(`✅ Updated question ${currentQuestionIndex} status to done`)
                  
                  // Get the next question
                  const nextQuestionResult = await api.getNextQuestion(sessionId, user.id)
                  console.log('Next question result:', nextQuestionResult)
                  
                  if (nextQuestionResult.success && nextQuestionResult.data) {
                    const nextQuestion = nextQuestionResult.data
                    setCurrentQuestionIndex(nextQuestion.index)
                    
                    // Save the next question as a system message
                    const nextQuestionMessage = {
                      author: 'system',
                      session_id: sessionId,
                      content: nextQuestion.question.learning,
                      audio_url: nextQuestion.question.audio_url,
                      user_id: user.id,
                    }
                    
                    const nextQuestionSaveResult = await api.saveMessage(nextQuestionMessage)
                    if (nextQuestionSaveResult.success) {
                      const nextQuestionMsg: Message = {
                        id: nextQuestionSaveResult.data.id,
                        type: "ai",
                        content: nextQuestion.question.learning,
                        timestamp: new Date(nextQuestionSaveResult.data.created_at),
                        audioUrl: nextQuestion.question.audio_url,
                      }
                      setMessages(prev => [...prev, nextQuestionMsg])
                      
                      // Show toast for next question
                      toast.info("📝 Next question ready!", {
                        description: `Question ${nextQuestion.index + 1} of ${nextQuestion.total_questions}`,
                        duration: 3000,
                      })
                    }
                  } else {
                    // All questions completed
                    toast.success("🎉 Congratulations!", {
                      description: "You've completed all questions in this session!",
                      duration: 5000,
                    })
                  }
                } catch (questionError) {
                  console.error('Error updating question status or getting next question:', questionError)
                }
              }
            }
          } catch (analysisError) {
            console.error('Error during pronunciation analysis:', analysisError)
            toast.error("Analysis failed", {
              description: "Could not analyze pronunciation, but your message was saved",
            })
          }
        }
        
        // Clean up local audio
        setRecordedAudio(null)
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        setAudioUrl(null)
        
        console.log('Audio message added successfully')
        
      } catch (error) {
        console.error('Error uploading audio or saving message:', error)
        // Still add the message with local audio URL as fallback
        const newMessage: Message = {
          id: Date.now().toString(),
          type: "user",
          content: "[Message vocal]",
          timestamp: new Date(),
          isAudio: true,
          audioUrl: audioUrl || undefined,
        }
        setMessages(prev => [...prev, newMessage])
        setProgress(prev => Math.min(prev + 5, 100))
        
        // Clean up local audio
        setRecordedAudio(null)
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        setAudioUrl(null)
      } finally {
        setIsGenerating(false)
      }
    }
  }

  const handleDeleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setRecordedAudio(null)
    setAudioUrl(null)
  }

  const handleAssistantMessageClick = (message: Message) => {
    if (message.type === 'ai' && sessionData?.content) {
      // Find the corresponding question in session data to get the native translation
      const questionIndex = messages.findIndex(m => m.id === message.id)
      if (questionIndex >= 0 && sessionData.content[questionIndex]) {
        const question = sessionData.content[questionIndex]
        setSelectedMessage({
          ...message,
          nativeTranslation: question.native
        })
        setTranslationDrawerOpen(true)
      }
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const toggleAudio = (messageId: string, audioUrl: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null)
      // Stop audio logic would go here
    } else {
      setPlayingAudio(messageId)
      // Play audio logic would go here
      const audio = new Audio(audioUrl)
      audio.play()
      audio.onended = () => setPlayingAudio(null)
    }
  }

  const toggleAnalysisAudio = (analysisId: string, audioType: 'user' | 'native', audioUrl: string) => {
    const audioId = `${analysisId}-${audioType}`
    if (playingAudio === audioId) {
      setPlayingAudio(null)
    } else {
      setPlayingAudio(audioId)
      const audio = new Audio(audioUrl)
      audio.play()
      audio.onended = () => setPlayingAudio(null)
    }
  }

  // Show loading state while loading session data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading your learning session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Progress</CardTitle>
          <CardDescription>
            Track your pronunciation practice progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>
                {sessionData?.content ? 
                  `${Math.round((currentQuestionIndex / sessionData.content.length) * 100)}%` : 
                  `${progress}%`
                }
              </span>
            </div>
            <Progress 
              value={sessionData?.content ? 
                (currentQuestionIndex / sessionData.content.length) * 100 : 
                progress
              } 
              className="w-full" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <div className="flex flex-col h-[600px]">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-main text-main-foreground flex items-center justify-center">
                  <Image
                    src="/system_icon.svg"
                    alt="Francoflex"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">Assistant de Prononciation</CardTitle>
                <CardDescription>
                  {sessionData?.content ? 
                    `Question ${currentQuestionIndex + 1} sur ${sessionData.content.length} - Niveau ${sessionData.level}` :
                    "Français Professionnel - Secteur Pharmaceutique"
                  }
                </CardDescription>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="neutral" size="sm" className="ml-auto">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyse
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[50vw] max-w-none flex flex-col" style={{ width: '50vw', maxWidth: 'none' }}>
                  <SheetHeader className="flex-shrink-0">
                    <SheetTitle>Analyse de Prononciation</SheetTitle>
                    <SheetDescription>
                      Consultez l'analyse détaillée de vos réponses
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto mt-8 space-y-6 px-4 pr-2">
                    {isGenerating ? (
                      // Show loading state during analysis
                      <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
                          <p className="text-sm text-muted-foreground">Analyzing your pronunciation...</p>
                                </div>
                              </div>
                    ) : analysisData && analysisReady ? (
                      // Show real analysis data
                              <div className="space-y-4">
                        <Card className="border-2 border-green-200 bg-green-50">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-green-800">Latest Analysis</CardTitle>
                              <Badge className="bg-green-500 text-white">
                                {analysisData.analysis.overall_score}%
                                          </Badge>
                                      </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 bg-white rounded-lg border">
                              <h4 className="font-medium mb-2">Overall Feedback</h4>
                              <p className="text-sm text-gray-700">{analysisData.summary}</p>
                                    </div>
                            
                                {analysisData.analysis.word_analysis && analysisData.analysis.word_analysis.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="font-medium">Word Analysis:</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {analysisData.analysis.word_analysis.map((word: any, index: number) => (
                                        <Button
                                          key={index}
                                          variant="neutral"
                                          size="sm"
                                          className="h-8 px-3 text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                          onClick={() => setSelectedWord({
                                            word: word.word,
                                            score: word.quality_score,
                                            analysis: word.ai_feedback
                                          })}
                                        >
                                          {word.word}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                          </CardContent>
                        </Card>
                                </div>
                    ) : (
                      // Show message when no analysis is available
                      <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">No pronunciation analysis available yet.</p>
                          <p className="text-xs text-muted-foreground mt-2">Record an audio message to get started!</p>
                              </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-12">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-main text-main-foreground flex items-center justify-center">
                      <Image
                        src="/system_icon.svg"
                        alt="Francoflex"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] space-y-2 ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`p-4 rounded-base border-2 ${
                      message.type === 'user'
                        ? 'bg-main text-main-foreground border-main'
                        : 'bg-secondary-background border-border cursor-pointer hover:bg-secondary-background/80 transition-colors'
                    }`}
                    onClick={() => message.type === 'ai' && handleAssistantMessageClick(message)}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.isAudio && (
                      <div className="flex items-center gap-2 mt-2">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-xs opacity-75">Message vocal</span>
                      </div>
                    )}
                  </div>
                  
                  
                  {/* Audio Player */}
                  {message.audioUrl && (
                    <div className={`border-2 rounded-base p-3 -mx-4 -mb-4 ${
                      message.type === 'user'
                        ? 'bg-main border-main'
                        : 'bg-secondary-background border-border'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="neutral"
                          size="sm"
                          onClick={() => toggleAudio(message.id, message.audioUrl!)}
                          className="rounded-full w-8 h-8 p-0 flex-shrink-0"
                        >
                          {playingAudio === message.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {/* Audio Waveform Placeholder */}
                        <div className="flex items-center gap-0.5 h-4 flex-1">
                          {[...Array(120)].map((_, i) => (
                            <div
                              key={i}
                              className={`transition-all duration-200 flex-1 ${
                                message.type === 'user' 
                                  ? 'bg-main-foreground' 
                                  : 'bg-main'
                              } ${
                                playingAudio === message.id 
                                  ? 'animate-pulse' 
                                  : 'opacity-30'
                              }`}
                              style={{
                                minWidth: '2px',
                                height: `${Math.random() * 16 + 4}px`,
                                animationDelay: `${i * 20}ms`
                              }}
                            />
                          ))}
                        </div>
                        
                        {playingAudio === message.id && (
                          <Badge variant="default" className="text-xs flex-shrink-0">
                            En cours
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                </div>
                
                {message.type === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/matt_avatar.png" alt="Matt" />
                    <AvatarFallback className="bg-foreground text-background text-sm">
                      Matt
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-main text-main-foreground flex items-center justify-center">
                    <Image
                      src="/system_icon.svg"
                      alt="Francoflex"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-secondary-background border-border border-2 rounded-base p-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-main"></div>
                    <span className="text-sm text-muted-foreground">L'assistant tape...</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          {/* Voice Input Area */}
          <CardFooter className="border-t p-4">
            <div className="flex flex-col gap-3 w-full">
              {/* Recording Controls */}
              <div className="flex gap-2 w-full justify-center">
                <Button
                  variant={isRecording ? "reverse" : "default"}
                  size="icon"
                  onClick={handleVoiceRecording}
                  disabled={isGenerating}
                  className="h-12 w-12"
                >
                  {isRecording ? (
                    <Square className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                
                {recordedAudio && (
                  <>
                    <Button
                      variant="neutral"
                      size="icon"
                      onClick={handlePlayRecording}
                      disabled={isPlayingRecording}
                      className="h-12 w-12"
                    >
                      {isPlayingRecording ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSubmitRecording}
                      disabled={isGenerating}
                      className="h-12 px-6"
                    >
                      {isGenerating ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="neutral"
                      size="icon"
                      onClick={handleDeleteRecording}
                      className="h-12 w-12"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Status Text */}
              <div className="text-center">
                {isRecording ? (
                  <p className="text-sm text-red-600 font-medium">
                    🔴 Enregistrement en cours...
                  </p>
                ) : recordedAudio ? (
                  <p className="text-sm text-green-600 font-medium">
                    ✅ Enregistrement terminé - Écoutez avant d'envoyer
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Appuyez sur le micro pour commencer l'enregistrement
                  </p>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Word Analysis Alert Dialog */}
      <AlertDialog open={!!selectedWord} onOpenChange={() => setSelectedWord(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="text-lg font-semibold">"{selectedWord?.word}"</span>
              <Badge 
                className={`${
                  selectedWord && selectedWord.score >= 80 
                    ? 'bg-green-500 text-white' 
                    : selectedWord && selectedWord.score >= 60 
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {selectedWord?.score}%
              </Badge>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <div className="w-full">
                  <Progress 
                    value={selectedWord?.score} 
                    className="h-2"
                    style={{
                      '--progress-background': selectedWord && selectedWord.score >= 80 
                        ? '#22c55e' 
                        : selectedWord && selectedWord.score >= 60 
                        ? '#eab308'
                        : '#ef4444'
                    } as React.CSSProperties}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedWord?.analysis}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSelectedWord(null)}>
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Translation Drawer */}
      <Drawer open={translationDrawerOpen} onOpenChange={setTranslationDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Translation</DrawerTitle>
            <DrawerDescription>
              Native language translation of the assistant message
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {selectedMessage && (
              <div className="space-y-4">
                <div className="p-4 bg-secondary-background border border-border rounded-base">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Learning Language</h4>
                  <p className="text-base">{selectedMessage.content}</p>
                </div>
                <div className="p-4 bg-main/5 border border-main/20 rounded-base">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Native Translation</h4>
                  <p className="text-base">{selectedMessage.nativeTranslation}</p>
                </div>
                {selectedMessage.audioUrl && (
                  <div className="p-4 bg-secondary-background border border-border rounded-base">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Audio</h4>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => toggleAudio(selectedMessage.id, selectedMessage.audioUrl!)}
                        className="rounded-full w-8 h-8 p-0 flex-shrink-0"
                      >
                        {playingAudio === selectedMessage.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <span className="text-sm text-muted-foreground">Click to play audio</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  )
}
