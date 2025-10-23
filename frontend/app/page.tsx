"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    console.log("🔑 Token found:", token);

    if (!token || token === "undefined" || token === "null") {
      console.log("🚪 No token found, redirecting to login...");
      router.replace("/login");
      return;
    }

    try {
      // ✅ Decode JWT payload
      const [, payload] = token.split(".");
      const decoded = JSON.parse(atob(payload));
      const isExpired = decoded.exp * 1000 < Date.now();

      if (isExpired) {
        console.log("⚠️ Token expired, redirecting to login...");
        localStorage.removeItem("token");
        router.replace("/login");
      } else {
        console.log("✅ Valid token, redirecting to chat...");
        router.replace("/chat");
      }
    } catch (error) {
      console.log("❌ Invalid token format, redirecting to login...");
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <h1 className="text-white text-3xl font-semibold animate-pulse">
        Redirecting...
      </h1>
    </div>
  );
}
