"use client"

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { toast, Toaster } from 'sonner'
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
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, Send, Volume2, Square, RotateCcw, AlertCircle, Play, Pause, BarChart3 } from "lucide-react"
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

interface SessionQuestion {
  learning: string
  native: string
  status?: string
  audio_url?: string | null
}

interface SessionSummary {
  id: string
  user: string
  level: string
  type: string
  mode?: string
  content?: SessionQuestion[]
  created_at?: string
}

interface StoredMessage {
  id: string
  author: "system" | "user"
  content: string
  session: string
  metadata?: {
    audio_url?: string
  } | null
  created_at: string
}

interface UserPreferences {
  name?: string | null
  learning?: string | null
  learningLabel?: string | null
  native?: string | null
  nativeLabel?: string | null
  level?: string | null
  age?: string | null
  learningGoals?: string | null
}

interface ConversationalAnalysis {
  overall_score?: number
  summary?: string
  encouragement?: string
  ai_feedback?: string
  word_analysis?: {
    word: string
    score?: number
    feedback?: string
    status?: string
  }[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string | null
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isAudio?: boolean
  audioUrl?: string
  nativeTranslation?: string
}

export default function VoiceChatConversationalPage() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const sessionId = searchParams.get('sessionId')
  
  const [progress, setProgress] = useState(25)
  const [isRecording, setIsRecording] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [selectedWord, setSelectedWord] = useState<{ word: string; score: number; analysis: string } | null>(null)
  
  // Translation drawer state
  const [translationDrawerOpen, setTranslationDrawerOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  
  // Session data
  const [sessionData, setSessionData] = useState<SessionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Analysis data
  const [analysisData, setAnalysisData] = useState<ConversationalAnalysis | null>(null)
  const [analysisReady, setAnalysisReady] = useState(false)
  
  const [messages, setMessages] = useState<Message[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load session data and messages
  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId || !user) return

      try {
        setLoading(true)
        
        const sessionsResult = await api.getAllSessions(user.uid) as ApiResponse<SessionSummary[]>
        const session = Array.isArray(sessionsResult.data)
          ? sessionsResult.data.find((s) => s.id === sessionId)
          : undefined
        if (session) {
          setSessionData(session)
        }

        const messagesResult = await api.getMessagesFromSession(sessionId) as ApiResponse<StoredMessage[]>
        const dbMessages = Array.isArray(messagesResult.data) ? messagesResult.data : []

        if (dbMessages.length > 0) {
          // Convert database messages to UI format
          const uiMessages: Message[] = dbMessages.map((msg: StoredMessage) => ({
            id: msg.id,
            type: msg.author === 'user' ? 'user' : 'ai',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isAudio: !!msg.metadata?.audio_url,
            audioUrl: msg.metadata?.audio_url,
            nativeTranslation: msg.metadata?.native_translation
          }))
          setMessages(uiMessages)
        } else {
          // No messages exist, create initial greeting
          // Get user preferences for personalized greeting
        const userPrefs = await api.getPreferences(user.uid) as ApiResponse<UserPreferences | null>
        const userPref = userPrefs.data

          // Generate personalized greeting
          const greetingResult = await api.generateGreeting({
            user_name: userPref?.name || 'User',
            learning_language: userPref?.learning || 'fr',
            session_content: session?.content || [],
            level: session?.level || 'B1'
          })
          
          const greetingText = greetingResult.data.greeting
          
          // Generate audio for greeting using text-to-speech
          const audioResult = await api.textToAudio(greetingText)
          const greetingAudioUrl = audioResult.data.audio_url
          
          const greetingMessage = {
            id: 'greeting',
            type: 'ai' as const,
            content: greetingText,
            timestamp: new Date(),
            isAudio: true,
            audioUrl: greetingAudioUrl,
            nativeTranslation: "Hello! I am Madame AI, your Francoflex assistant. How can I help you today?"
          }
          
          // Save greeting to database
          await api.saveMessage({
            author: 'system',
            session_id: sessionId,
            content: greetingMessage.content,
            audio_url: greetingAudioUrl,
            user_id: user.uid,
          })
          
          setMessages([greetingMessage])
        }
        
        // Load session data
        // Load latest pronunciation analysis
        try {
          const analysisResult = await api.getLatestPronunciationAnalysis(user.uid) as ApiResponse<{ content: ConversationalAnalysis }>
          if (analysisResult.success && analysisResult.data) {
            setAnalysisData(analysisResult.data.content)
            setAnalysisReady(true)
          }
        } catch (error) {
          console.error('Error loading analysis:', error)
        }
        
      } catch (error) {
        console.error('Error loading session data:', error)
        toast.error('Failed to load session data')
      } finally {
        setLoading(false)
      }
    }

    loadSessionData()
  }, [sessionId, user])

  const handleVoiceRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        
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
        
      } catch (error) {
        console.error('Error starting recording:', error)
        toast.error('Failed to start recording')
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
      }
    }
  }

  const handlePlayRecording = () => {
    if (recordedAudio && audioUrl) {
      const audio = new Audio(audioUrl)
      audio.onplay = () => setIsPlayingRecording(true)
      audio.onended = () => setIsPlayingRecording(false)
      audio.onerror = () => {
        setIsPlayingRecording(false)
        toast.error('Failed to play recording')
      }
      audio.play()
    }
  }

  const handleDeleteRecording = () => {
    setRecordedAudio(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
  }

  const handleSubmitRecording = async () => {
    if (recordedAudio && user && sessionId) {
      setIsGenerating(true)
      
      try {
        console.log('Starting recording processing...', { user: user.uid, sessionId })
        
        // Convert Blob to File
        const audioFile = new File([recordedAudio], 'recording.wav', {
          type: 'audio/wav'
        })
        
        console.log('Audio file created:', audioFile.name, audioFile.size, 'bytes')
        
        // Upload audio to backend
        console.log('Uploading audio...')
        const uploadResult = await api.uploadAudio(audioFile, user.uid, sessionId)
        console.log('Audio upload result:', uploadResult)
        
        // Save user message to database
        const userMessage = {
          author: 'user',
          session_id: sessionId,
          content: "[Message vocal]",
          audio_url: uploadResult.data.audio_url,
          user_id: user.uid,
        }
        
        console.log('Saving user message...', userMessage)
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
          
          // Transcribe speech to text
          console.log('Transcribing speech...')
          const transcriptionResult = await api.speechToText(uploadResult.data.audio_url, 'fr')
          console.log('Transcription result:', transcriptionResult)
          const transcribedText = transcriptionResult.data.text
          
          // Update user message with transcribed text
          const updatedUserMessage = {
            ...newMessage,
            content: transcribedText
          }
          
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id ? updatedUserMessage : msg
          ))
          
          // Generate conversational response
          console.log('Generating conversational response...')
          const responseResult = await api.generateConversationalResponse({
            user_message: transcribedText,
            session_id: sessionId,
            learning_language: 'fr',
            level: sessionData?.level || 'B1',
            user_id: user.uid
          })
          console.log('Conversational response result:', responseResult)
          
          const responseData = responseResult.data
          
          // Generate audio for response
          console.log('Generating audio for response...')
          const audioResult = await api.textToAudio(responseData.learning)
          console.log('Audio generation result:', audioResult)
          const responseAudioUrl = audioResult.data.audio_url
          
          // Create AI response message
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: responseData.learning,
            timestamp: new Date(),
            isAudio: true,
            audioUrl: responseAudioUrl,
            nativeTranslation: responseData.native
          }
          
          // Save AI message to database
          console.log('Saving AI message...')
          await api.saveMessage({
            author: 'system',
            session_id: sessionId,
            content: aiMessage.content,
            audio_url: responseAudioUrl,
            user_id: user.uid,
          })
          
          setMessages(prev => [...prev, aiMessage])
          
          // Only do pronunciation analysis for user messages
          try {
            const analysisResult = await api.analyzePronunciation({
              audio_url: uploadResult.data.audio_url,
              target_text: transcribedText,
              session_id: sessionId,
              analysis_language: 'fr-fr',
              native_language: 'en'
            })
            
            if (analysisResult.success) {
              // Save analysis to database
              await api.savePronunciationAnalysis({
                user_id: user.uid,
                level: sessionData?.level || 'B1',
                analysis_content: analysisResult.data.analysis,
                analysis_type: 'conversational'
              })
              
              // Set analysis data for display
              setAnalysisData(analysisResult.data.analysis)
              setAnalysisReady(true)
              
              toast.success('🎉 Pronunciation analysis is ready!', {
                description: "Click on the Analysis panel to view your results",
                duration: 5000,
              })
            }
          } catch (analysisError) {
            console.error('Pronunciation analysis failed:', analysisError)
            // Don't show error to user for analysis failures
          }
        }
        
        // Clean up local audio
        setRecordedAudio(null)
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        setAudioUrl(null)
        
      } catch (error) {
        console.error('Error uploading audio or saving message:', error)
        console.error('Error details:', error)
        toast.error('Failed to process recording: ' + (error.message || 'Unknown error'))
      } finally {
        setIsGenerating(false)
      }
    }
  }

  const toggleAudio = (messageId: string, audioUrl: string) => {
    if (playingAudio === messageId) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setPlayingAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onplay = () => setPlayingAudio(messageId)
      audio.onended = () => setPlayingAudio(null)
      audio.onerror = () => {
        setPlayingAudio(null)
        toast.error('Failed to play audio')
      }
      
      audio.play()
    }
  }

  const handleAssistantMessageClick = (message: Message) => {
    setSelectedMessage(message)
    setTranslationDrawerOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Activity Progress */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Activity Progress</CardTitle>
            <CardDescription>Track your pronunciation practice progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
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
                    Mode Conversationnel - Niveau {sessionData?.level || 'B1'}
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
                        Consultez l&apos;analyse détaillée de vos réponses
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto mt-8 space-y-6 px-4 pr-2">
                      {isGenerating ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
                            <p className="text-sm text-muted-foreground">Analyzing your pronunciation...</p>
                          </div>
                        </div>
                      ) : analysisData && analysisReady ? (
                        <div className="space-y-4">
                          <Card className="border-2 border-green-200 bg-green-50">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-green-800">Latest Analysis</CardTitle>
                                <Badge className="bg-green-500 text-white">
                                  {analysisData.overall_score}%
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="p-4 bg-white rounded-lg border">
                                <h4 className="font-medium mb-2">Overall Feedback</h4>
                                <p className="text-sm text-gray-700">{analysisData.summary || 'Great job! Keep practicing.'}</p>
                              </div>
                              
                              <div className="space-y-3">
                                <h4 className="font-medium">Word Analysis:</h4>
                                <div className="flex flex-wrap gap-2">
                                {analysisData.word_analysis && analysisData.word_analysis.map((word, index) => (
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
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
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
                      <span className="text-sm text-muted-foreground">L&apos;assistant tape...</span>
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
                    ✅ Enregistrement terminé - Écoutez avant d&apos;envoyer
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                    Appuyez sur le micro pour commencer l&apos;enregistrement
                    </p>
                  )}
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Translation Drawer */}
        <Drawer open={translationDrawerOpen} onOpenChange={setTranslationDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Translation</DrawerTitle>
              <DrawerDescription>
                Click on any assistant message to see the translation
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              {selectedMessage && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Original Text:</h4>
                    <p className="text-gray-900">{selectedMessage.content}</p>
                  </div>
                  {selectedMessage.nativeTranslation && (
                    <div>
                      <h4 className="font-medium mb-2">Translation:</h4>
                      <p className="text-gray-900">{selectedMessage.nativeTranslation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Word Analysis Alert Dialog */}
        <AlertDialog open={!!selectedWord} onOpenChange={() => setSelectedWord(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <span className="text-lg font-semibold">&ldquo;{selectedWord?.word}&rdquo;</span>
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
                          ? '#10b981' 
                          : selectedWord && selectedWord.score >= 60 
                          ? '#f59e0b'
                          : '#ef4444'
                      } as React.CSSProperties}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedWord?.analysis}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setSelectedWord(null)}>
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <Toaster position="top-right" />
    </div>
  )
}
