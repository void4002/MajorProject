"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { SignInForm } from "./sign-in-form"
import { SignUpForm } from "./sign-up-form"
import { Header } from "./header"
import { Footer } from "./footer"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  const [showSignIn, setShowSignIn] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleDashboardClick = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backgroundBlendMode: "overlay",
            }}
          />
          <div className="relative container mx-auto px-6 py-20 md:py-32 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-8 leading-tight">
              Explore with us like
              <br />
              nobody else did
            </h1>
            {user ? (
              <Button
                className="bg-teal-400 hover:bg-teal-500 text-black font-semibold px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                onClick={handleDashboardClick}
              >
                Go to Dashboard
              </Button>
            ) : (
              <div className="space-x-4">
                <Button
                  className="bg-teal-400 hover:bg-teal-500 text-black font-semibold px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                  onClick={() => setShowSignIn(true)}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-white hover:bg-gray-100 text-teal-500 font-semibold px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 ease-in-out transform hover:scale-105"
                  onClick={() => setShowSignUp(true)}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
        {showSignIn && <SignInForm onClose={() => setShowSignIn(false)} />}
        {showSignUp && <SignUpForm onClose={() => setShowSignUp(false)} />}
      </main>
      <Footer />
    </div>
  )
}

