"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { auth, ApiError, tasks as tasksApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SigninPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
      return;
    }
    checkSetup();
  }, [authLoading, isAuthenticated, router]);

  async function checkSetup() {
    try {
      const { setupRequired } = await auth.checkSetup();
      if (setupRequired) {
        router.replace("/setup");
      } else {
        setIsCheckingSetup(false);
      }
    } catch {
      toast.error("Failed to check setup status");
      setIsCheckingSetup(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Use login from AuthContext to update global auth state
      await login(formData.username, formData.password);
      toast.success("Signed in successfully!");
      
      // Fetch and show today's tasks and follow-ups
      showTodayReminders();
      
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to sign in");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function showTodayReminders() {
    try {
      const [tasksData, followUpsData] = await Promise.all([
        tasksApi.list(),
        tasksApi.followUps.list(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter today's tasks
      const todayTasks = tasksData.tasks.filter((task) => {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return !task.isCompleted && taskDate.getTime() === today.getTime();
      });

      // Filter today's follow-ups
      const todayFollowUps = followUpsData.followUps.filter((followUp) => {
        const followUpDate = new Date(followUp.nextFollowUpAt);
        followUpDate.setHours(0, 0, 0, 0);
        return followUpDate.getTime() === today.getTime();
      });

      // Show toast notifications
      if (todayTasks.length > 0) {
        toast.info(`📋 You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today!`, {
          duration: 5000,
        });
      }

      if (todayFollowUps.length > 0) {
        toast.info(`📞 ${todayFollowUps.length} follow-up${todayFollowUps.length > 1 ? 's' : ''} scheduled for today!`, {
          duration: 5000,
        });
      }
    } catch (error) {
      // Silently fail - don't disrupt login flow
      console.error("Failed to fetch reminders:", error);
    }
  }

  if (isCheckingSetup || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-neutral-900 p-12 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <svg
                className="h-5 w-5 text-neutral-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">CRM</span>
          </div>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg text-neutral-300">
              &ldquo;Streamline your customer relationships with powerful tools 
              designed for modern teams.&rdquo;
            </p>
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-700" />
            <span className="text-sm text-neutral-500">Built for growth</span>
            <div className="h-px flex-1 bg-neutral-700" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-semibold text-white">500+</div>
              <div className="text-xs text-neutral-500">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">10k+</div>
              <div className="text-xs text-neutral-500">Leads Managed</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">99.9%</div>
              <div className="text-xs text-neutral-500">Uptime</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-neutral-600">
          &copy; {new Date().getFullYear()} CRM System. All rights reserved.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full items-center justify-center bg-neutral-50 p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              CRM System
            </h1>
          </div>

          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-medium">Welcome back</CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-neutral-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                  {errors.username && (
                    <p className="text-xs text-red-500">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-neutral-900 hover:bg-neutral-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-neutral-500">
            Having trouble signing in?{" "}
            <Link href="#" className="text-neutral-900 hover:underline">
              Contact your administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

