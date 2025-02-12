"use client"

import Link from "next/link"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu } from "lucide-react"

export function Header() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-teal-600">
            JourneyGenie
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Dashboard
                </Link>
                <Button onClick={signOut} variant="outline">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="text-gray-600 hover:text-teal-600 transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="mt-4 md:hidden">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block py-2 text-gray-600 hover:text-teal-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Button
                  onClick={() => {
                    signOut()
                    setIsMenuOpen(false)
                  }}
                  variant="outline"
                  className="w-full mt-2"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="block py-2 text-gray-600 hover:text-teal-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block py-2 text-gray-600 hover:text-teal-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

