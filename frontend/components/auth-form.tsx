"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface AuthFormProps {
  mode: "login" | "signup"
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const endpoint = mode === "signup" ? "signup" : "login"
      const payload =
        mode === "signup"
          ? {
              username,
              email,
              password,
              confirm_password: confirmPassword, // ✅ key name fixed
            }
          : { email, password }

      const res = await fetch(`http://127.0.0.1:8000/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed")
      }

      if (mode === "login") {
        localStorage.setItem("token", data.access_token)
        router.push("/") // ✅ redirect to chatbot/home page
      } else {
        alert("Signup successful! Please login now.")
        router.push("/login") // ✅ redirect after signup
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated glowing background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7, scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute w-96 h-96 bg-purple-700/30 rounded-full blur-3xl top-10 left-10"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6, scale: [1.1, 1, 1.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute w-80 h-80 bg-indigo-700/30 rounded-full blur-3xl bottom-10 right-10"
      />

      {/* Auth Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md p-8 bg-gray-900/70 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700"
      >
        <h2 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-6">
          {mode === "login" ? "Welcome Back 👋" : "Create Your Account 🚀"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 bg-gray-800/70 rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none text-white transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 bg-gray-800/70 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 bg-gray-800/70 rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none text-white transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 bg-gray-800/70 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-white transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {error && <p className="text-red-400 text-center text-sm">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-blue-600 hover:to-purple-600 rounded-lg font-semibold text-white shadow-lg transition-all"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}
          </motion.button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <a href="/signup" className="text-blue-400 hover:underline">
                Sign up
              </a>
            </>
          ) : (
            <>
              Already registered?{" "}
              <a href="/login" className="text-purple-400 hover:underline">
                Login
              </a>
            </>
          )}
        </p>
      </motion.div>
    </div>
  )
}
