"use client"

import Link from "next/link"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { Menu, Plane } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const planeRef = useRef(null)
  const [planePosition, setPlanePosition] = useState(0)
  
  useEffect(() => {
    const updatePlanePosition = () => {
      if (planeRef.current) {
        const rect = planeRef.current.getBoundingClientRect()
        setPlanePosition(rect.x)
      }
    }
    
    const interval = setInterval(updatePlanePosition, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="relative bg-white shadow-sm overflow-hidden">
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
          <motion.div 
            className="mt-4 md:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                    if (signOut) signOut();
                    setIsMenuOpen(false);
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
          </motion.div>
        )}
      </div>
      
      {/* Animated trail for the plane */}
      <div className="absolute bottom-0 w-full h-1">
        {/* Animated trail line */}
        <div 
          className="absolute bottom-0 h-1 bg-teal-500/30"
          style={{ 
            width: `${planePosition}px`,
            left: 0,
            backgroundImage: 'linear-gradient(to right, transparent, rgba(20, 184, 166, 0.7))'
          }}
        />
        
        {/* Plane element */}
        <motion.div 
          ref={planeRef}
          className="absolute -bottom-2"
          initial={{ x: -50 }}
          animate={{ x: '100vw' }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear"
          }}
        >
          <Plane className="h-5 w-5 text-teal-600 transform rotate-45" />
        </motion.div>
      </div>
    </header>
  );
}