"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

export default function AuthFormContainer() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Set the active tab based on URL query parameter
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "login" || tab === "signup") {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Handle login (fake authentication)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    // Simulate authentication delay
    setTimeout(() => {
      if (email === "demo@zapdev.ai" && password === "password123") {
        // Store fake auth token
        localStorage.setItem("zapdev_auth", JSON.stringify({
          email,
          name: "Demo User",
          token: "fake-jwt-token",
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        }))
        router.push("/editor")
      } else {
        setError("Invalid credentials. Try demo@zapdev.ai / password123")
        setIsLoading(false)
      }
    }, 1000)
  }

  // Handle signup (fake registration)
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    // Validate
    if (!name.trim()) {
      setError("Name is required")
      setIsLoading(false)
      return
    }
    
    // Simulate registration delay
    setTimeout(() => {
      // Store fake auth token
      localStorage.setItem("zapdev_auth", JSON.stringify({
        email,
        name,
        token: "fake-jwt-token",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }))
      router.push("/editor")
    }, 1000)
  }

  return (
    <Card className="bg-[#121215] border border-[#1E1E24]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 bg-[#0D0D10]">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login" className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#0D0D10] border-[#1E1E24]"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-[#EAEAEA]/70 hover:text-[#EAEAEA]">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0D0D10] border-[#1E1E24]"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C]"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center text-xs text-[#EAEAEA]/50 mt-4">
              <p>Demo credentials:</p>
              <p>Email: demo@zapdev.ai / Password: password123</p>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="signup" className="p-6">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-[#0D0D10] border-[#1E1E24]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#0D0D10] border-[#1E1E24]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0D0D10] border-[#1E1E24]"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C]"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
