"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";
import { Header } from "./header";
import { Footer } from "./footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LandingPage() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow relative">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://img.freepik.com/free-vector/realistic-travel-background-with-elements_52683-77784.jpg?t=st=1742826754~exp=1742830354~hmac=5c95d099bf1bc34f60f9f18a726d00755ac70240f431139e0cd29c8dd4a1273b&w=1380')", // Change this to an actual high-quality travel image
            backgroundBlendMode: "overlay",
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-50"></div>

        {/* Main Content */}
        <div className="relative flex flex-col items-center justify-center min-h-screen text-center text-white px-6">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif mb-6 leading-tight"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Explore with Us <br /> Like Never Before
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Discover curated itineraries, travel smarter, and make every trip unforgettable.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="space-x-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {user ? (
              <Button
                className="bg-teal-400 hover:bg-teal-500 text-black font-semibold px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
                onClick={handleDashboardClick}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  className="bg-teal-400 hover:bg-teal-500 text-black font-semibold px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
                  onClick={() => setShowSignIn(true)}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-white hover:bg-gray-100 text-teal-500 font-semibold px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
                  onClick={() => setShowSignUp(true)}
                >
                  Sign Up
                </Button>
              </>
            )}
          </motion.div>
        </div>

        {/* Authentication Forms */}
        {showSignIn && <SignInForm onClose={() => setShowSignIn(false)} />}
        {showSignUp && <SignUpForm onClose={() => setShowSignUp(false)} />}
      </main>
      <Footer />
    </div>
  );
}
