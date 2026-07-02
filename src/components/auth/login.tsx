"use client";

import Image from "next/image";
import axios from "axios";
import api from "@/lib/axios";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { setOtpData } from "@/store/slices/authSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/validations/loginSchema";
import type { LoginRequest, LoginResponse } from "@/types/auth";

import type { ApiResponse } from "@/types/common";

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  // Form State
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [successMessage, setSuccessMessage] = useState("");
  // const [errorMessage, setErrorMessage] = useState("");
  
  // Handle Login
  const handleLogin = async (data: LoginFormData) => {
    // Cegah double click
    if (loading) return;

    setLoading(true);
    // setErrorMessage("");
    // setSuccessMessage("");

    try {
      const payload: LoginRequest = {
        login: data.login,
        password: data.password,
      };

      const response =
        await api.post<ApiResponse<LoginResponse>>(
          "/auth/login",
          payload
        );

      const loginData = response.data.data;

      if (loginData.pending) {
        dispatch(setOtpData(loginData));

        toast.success(response.data.message);

        setTimeout(() => {
          router.push("/otp");
        }, 1000);
      }
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Backend berhasil merespon
          toast.error(error.response.data.message);
        } else {
          // Tidak ada response dari backend
          toast.error("Tidak dapat terhubung ke server.");
        }
      } else {
        toast.error("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D5EF4] px-4">
      <Card className="w-full max-w-[450px] rounded-3xl shadow-xl border-0">
        <CardContent className="p-10">
          <div>
            {/* Logo */}
            <div className="mb-15 flex justify-center">
              <Image
                width={100}
                height={48}
                src="/images/logo-biru.svg"
                alt="Logo"
                className="h-12 w-auto"
                priority
              />
            </div>
            {/* Logo */}
            <div>
              <form
                onSubmit={handleSubmit(handleLogin)}
              >
                <div className="space-y-6">
                  {/* ALert */}
                  {/* {successMessage && (
                    <Alert>
                      <AlertTitle>Login Success</AlertTitle>
                      <AlertDescription>
                        {successMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {errorMessage && (
                    <Alert variant="destructive">
                      <AlertTitle>Login Failed</AlertTitle>
                      <AlertDescription>
                        {errorMessage}
                      </AlertDescription>
                    </Alert>
                  )} */}
                  {/* Alert */}
                  
                  {/* Username/userAD */}
                  <div className="space-y-2">
                    <Label htmlFor="login">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="login"
                      {...register("login")}
                      placeholder="Masukkan username"
                      disabled={loading}
                    />
                    {/* Message error */}
                    {errors.login && (
                      <p className="text-sm text-red-500">
                        {errors.login.message}
                      </p>
                    )}
                    {/* Message error */}
                  </div>
                  {/* Username/userAD */}
                  
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        placeholder="Masukkan password"
                        disabled={loading}
                      />
                    </div>
                    {/* Message error */}
                      {errors.password && (
                        <p className="text-sm text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                      {/* Message error */}
                  </div>
                  {/* Passowrd */}

                  {/* Button */}
                  <div>
                    <Button
                      className="w-full bg-[#0D5EF4] hover:bg-[#0B4ED0] text-white"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Login"}
                    </Button>
                  </div>
                  {/* Button */}
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}