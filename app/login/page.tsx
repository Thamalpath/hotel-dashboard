"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { authApi } from "@/utils/api";
import { Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await authApi.post("/login", {
        name: username,
        password,
      });

      // Handle ApiResponse wrapper if present
      const responseData = response.data.data || response.data;
      const token = responseData.token;
      const user = responseData.user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Optional: set a cookie if you use middleware
      document.cookie = `isLoggedIn=true; path=/`;

      toast({
        title: "Success",
        description: "Logged in successfully",
        type: "success",
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Login Failed",
        description:
          error.response?.data?.message ||
          "Please check your credentials and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[40%_60%] xl:grid-cols-[40%_60%] 2xl:grid-cols-[40%_60%]">
      {/* Left Side - Brand Section */}
      <div className="hidden md:flex bg-white text-neutral-900 items-center justify-center p-8 lg:p-12 xl:p-16 relative overflow-hidden border-r border-border shadow-xl z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none z-0" />
        
        <div className="max-w-md xl:max-w-lg 2xl:max-w-xl text-center z-10 w-full flex flex-col items-center">
          <div className="relative w-48 h-48 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 mb-6 lg:mb-10 transition-transform duration-500 hover:scale-110 drop-shadow-2xl">
            <Image
              src="/icon1.png"
              alt="Login Illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-4 tracking-tight drop-shadow-sm">
            Hotel Web Management
          </h2>
          <p className="font-medium text-sm lg:text-base">Secure Portal Access</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 bg-background dark:bg-background md:col-span-1">
        <div className="w-full max-w-md xl:max-w-lg flex flex-col items-center">
          <Card className="w-full p-6 border-0 shadow-none lg:shadow-xl bg-card">
            <CardHeader className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold">Login</h1>
            </CardHeader>

            <CardContent className="space-y-6">
              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-4 sm:mt-6 text-center text-sm text-gray-400">
            V&nbsp;1.0.0
          </p>
        </div>
      </div>

      {/* Theme Toggle Button */}
      {mounted && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50 border-border bg-card hover:bg-accent transition-all duration-300 hover:scale-110"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
      )}
    </div>
  );
}
