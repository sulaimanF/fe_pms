"use client";

import Image from "next/image";
import axios from "axios";
import api from "@/lib/axios";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector  } from "react-redux";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { setAuthData, setOtpData } from "@/store/slices/authSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, OtpFormData } from "@/validations/otpSchema";
import { RootState } from "@/store/store";
import type { VerifyOtpRequest, AuthResponse, LoginResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/common";

export default function OtpForm() {
  const router = useRouter();
  const dispatch = useDispatch();

  const {
    login,
    reference,
    sent_to,
    expired_at,
  } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft === 0;

  // useEffect(() => {
  //   if (!reference) {
  //     router.replace("/login");
  //   }
  // }, [reference, router]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    if (!expired_at) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor((expired_at - Date.now()) / 1000)
      );

      setTimeLeft(remaining);
    };

    // Jalankan sekali saat halaman dibuka
    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expired_at]);

  const handleVerifyOtp = async (data: OtpFormData) => {
    if (loading || isExpired) {
      toast.error("Kode OTP telah kadaluarsa.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const payload: VerifyOtpRequest = {
        reference: reference!,
        otp: data.otp,
      };

      const response = await api.post<ApiResponse<AuthResponse>>(
        "/auth/login/verify-otp",
        payload
      );

      const authData = response.data.data;

      dispatch(setAuthData(authData));

      localStorage.setItem("token", authData.token);
      localStorage.setItem("token_type", authData.token_type);

      toast.success(response.data.message);

      router.push("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ??
            "Tidak dapat terhubung ke server."
        );
      } else {
        toast.error("Terjadi kesalahan.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending) return;

    if (!login) {
      toast.error("Data login tidak ditemukan.");
      router.replace("/login");
      return;
    }

    setResending(true);

    try {
      const response = await api.post<ApiResponse<LoginResponse>>(
        "/auth/otp/resend",
        {
          login
        }
      );

      dispatch(
        setOtpData({
          ...response.data.data,
          login,
        })
      );
      reset({ otp: "" });
      toast.success(response.data.message);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ??
            "Tidak dapat terhubung ke server."
        );
      } else {
        toast.error("Terjadi kesalahan.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-600 px-4">
      <Card className="w-full max-w-[560px] rounded-[30px] bg-[#ececec] border-0 shadow-xl">
        <CardContent className="px-10 py-12">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/logo-biru.svg"
              alt="BTN Logo"
              width={120}
              height={60}
              priority
            />
          </div>
          <div>
            <form onSubmit={handleSubmit(handleVerifyOtp)}>
              {/* Description */}
              <div className="mb-6 text-center">
                <p className="text-[20px] leading-8 text-gray-500">
                  Kode OTP telah dikirimkan ke
                </p>

                <p className="text-[20px] font-semibold text-gray-700">
                  {sent_to}
                </p>

                <p className="text-[20px] leading-8 text-gray-500">
                  mohon masukan kode
                </p>

                <p className="text-[20px] leading-8 text-gray-500">
                  yang diterima pada kolom di bawah.
                </p>
              </div>
              

              {/* OTP Input */}
              <div className="mb-5">
                <Controller
                  name="otp"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="INPUT KODE OTP"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={11} // 6 angka + 5 spasi
                      disabled={loading || isExpired}
                      value={field.value.split("").join(" ")}
                      onChange={(e) => {
                        // Hilangkan semua selain angka
                        const numeric = e.target.value.replace(/\D/g, "");

                        // Batasi hanya 6 digit
                        field.onChange(numeric.slice(0, 6));
                      }}
                      className="
                        h-[55px]
                        rounded-2xl
                        bg-[#E9E9E9]
                        border-gray-300
                        text-center
                        !text-[25px]
                        font-bold
                        tracking-normal
                        placeholder:text-center
                        placeholder:text-[22px]
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-200
                      "
                    />
                  )}
                />

                {errors.otp && (
                  <p className="mt-2 text-sm text-center text-red-500">
                    {errors.otp.message}
                  </p>
                )}
              </div>
              {/* OTP Input */}

              {/* Timer */}
              <div className="mb-6 text-center">
                <p className="text-[18px] text-gray-500">
                  Kode OTP akan kadaluwarsa dalam
                </p>

                <p className="text-[22px] font-bold text-gray-700">
                  {minutes} menit {seconds.toString().padStart(2, "0")} detik
                </p>
              </div>  
              {/* Timer */}

              {/* Button Submit OTP */}
              <div className="mb-5">
                <Button
                  type="submit"
                  disabled={loading || isExpired}
                  className="h-[55px] w-full rounded-2xl bg-[#0D5EF4] text-lg font-bold text-white hover:bg-[#0B4ED0]"
              >
                  {loading ? "Memverifikasi..." : "VERIFIKASI OTP"}
              </Button>
              </div>
              {/* Button Submit OTP */}

              {/* Button Resend OTP */}
              <div className="text-center">
                {isExpired ? (
                  <>
                    <p className="text-[18px] text-red-500 mb-2">
                      Kode OTP telah kadaluarsa.
                    </p>
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendOtp}
                      className="
                        text-[20px]
                        font-semibold
                        text-blue-600
                        hover:underline
                        disabled:text-gray-400
                        disabled:cursor-not-allowed
                      "
                    >
                      {resending ? "Mengirim..." : "Kirim Ulang OTP"}
                    </button>
                  </>
                ) : (
                  <p className="text-[18px] text-gray-500">
                    Tunggu {timeLeft} detik untuk mengirim ulang OTP
                  </p>
                )}
              </div>
              {/* Button Resend OTP */}
            </form>
          </div>  
        </CardContent>
      </Card>
    </div>
  );
}