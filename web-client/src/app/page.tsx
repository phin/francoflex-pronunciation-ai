"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { useAuth } from "@/contexts/AuthContext"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const router = useRouter()
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError("") // Clear previous errors
    
    try {
      // Validate passwords match for registration
      if (!isLogin && password !== confirmPassword) {
        const errorMsg = "Passwords do not match"
        setAuthError(errorMsg)
        toast.error(errorMsg)
        setLoading(false)
        return
      }

      console.log('Attempting authentication...', { isLogin, email })
      let error = null

      if (isLogin) {
        const result = await signIn(email, password)
        error = result.error
        console.log('Sign in result:', result)
      } else {
        const result = await signUp(email, password)
        error = result.error
        console.log('Sign up result:', result)
      }

      if (error) {
        console.error('Authentication error:', error)
        
        // Provide more specific error messages
        let errorMessage = ""
        if (error.message?.includes('Invalid login credentials')) {
          if (isLogin) {
            errorMessage = "Invalid email or password. Please check your credentials and try again."
          } else {
            errorMessage = "An account with this email may already exist. Try logging in instead."
          }
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = "Please check your email and click the confirmation link before logging in."
        } else if (error.message?.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Try logging in instead."
        } else {
          errorMessage = error.message || 'Authentication failed'
        }
        
        setAuthError(errorMessage)
        toast.error(errorMessage)
      } else {
        setAuthError("") // Clear errors on success
        if (isLogin) {
          console.log('Login successful, redirecting...')
          toast.success("Successfully logged in!")
          router.push('/voice_chat_activity')
        } else {
          console.log('Signup successful, redirecting...')
          toast.success("Account created! Redirecting to preferences...")
          router.push('/preferences')
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      const errorMsg = "An unexpected error occurred"
      setAuthError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setAuthError("") // Clear errors when switching modes
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle>
            {isLogin ? "Login to your account" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Enter your email below to login to your account"
              : "Enter your details below to create your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Error Message Display */}
              {authError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {authError}
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (authError) setAuthError("") // Clear error when user starts typing
                  }}
                  className={authError ? "border-red-500 focus:border-red-500" : ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (authError) setAuthError("") // Clear error when user starts typing
                  }}
                  className={authError ? "border-red-500 focus:border-red-500" : ""}
                  required 
                />
              </div>
              
              {!isLogin && (
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (authError) setAuthError("") // Clear error when user starts typing
                    }}
                    className={authError ? "border-red-500 focus:border-red-500" : ""}
                    required 
                  />
                </div>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button 
            type="submit" 
            className="w-full" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
          </Button>
          
          {/* Debug: Test Account Creation */}
          {!isLogin && (
            <Button 
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                setEmail("test@example.com")
                setPassword("password123")
                setConfirmPassword("password123")
                setAuthError("")
              }}
            >
              Fill Test Credentials
            </Button>
          )}
          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="underline underline-offset-4 hover:no-underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


