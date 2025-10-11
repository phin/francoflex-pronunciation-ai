"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { FirebaseError } from "firebase/app"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: FirebaseError | null }>
  signIn: (email: string, password: string) => Promise<{ error: FirebaseError | null }>
  signOut: () => Promise<{ error: FirebaseError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tokenProcessing, setTokenProcessing] = useState(false)
  const hasLoadedRef = useRef(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const token = searchParams.get("token")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      hasLoadedRef.current = true
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    if (tokenProcessing) {
      return
    }

    // If already authenticated, just clean up the URL parameter
    if (auth.currentUser) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("token")
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.replace(nextUrl)
      return
    }

    setTokenProcessing(true)
    signInWithCustomToken(auth, token)
      .catch((error) => {
        console.error("Failed to sign in with token from URL", error)
      })
      .finally(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("token")
        const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
        router.replace(nextUrl)
        setTokenProcessing(false)
      })
  }, [pathname, router, token, tokenProcessing, searchParams])

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (error) {
      return { error: error as FirebaseError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { error: null }
    } catch (error) {
      return { error: error as FirebaseError }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      return { error: null }
    } catch (error) {
      return { error: error as FirebaseError }
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading: loading || tokenProcessing || !hasLoadedRef.current,
      signUp,
      signIn,
      signOut,
    }),
    [loading, tokenProcessing, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
