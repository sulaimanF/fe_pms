"use client";

import Image from "next/image";
import axios from "axios";
import api from "@/lib/axios";
import React, { useEffect, useState } from "react";
import OtpInput from "@/components/ui/inputOtp";
import { useDispatch, useSelector  } from "react-redux";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { setAuthData, setOtpData } from "@/store/slices/authSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, OtpFormData } from "@/validations/otpSchema";
import { RootState } from "@/store/store";

export default function OtpForm() {
  const router = useRouter();
  const otpExpiredAt = useSelector(
    (state: RootState) => state.auth.otpExpiredAt
  );
  const [otpTimer, setOtpTimer] = useState(0); // 5 menit 59 detik
  const [resendTimer, setResendTimer] = useState(27);
  const dispatch = useDispatch();
  const [otp, setOtp] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const user = useSelector(
    (state: RootState) => state.auth.user
  );
  const otpToken = useSelector(
    (state: RootState) => state.auth.otpToken
  );

  useEffect(() => {
    console.log("otpExpiredAt =", otpExpiredAt);
  }, [otpExpiredAt]);

  useEffect(() => {
    if (!otpExpiredAt) return;

    const diff = Math.max(
      0,
      Math.floor(
        ((Number(otpExpiredAt) * 1000) - Date.now()) / 1000
      )
    );
    setOtpTimer(diff);
  }, [otpExpiredAt]);

  useEffect(() => {
    if (!otpExpiredAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor(
          ((Number(otpExpiredAt) * 1000) - Date.now()) / 1000
        )
      );
      setOtpTimer(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpExpiredAt]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const minutes = Math.floor(otpTimer / 60);
  const seconds = otpTimer % 60;
  const {
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    mode: "onSubmit",
  });

  const handleVerifyOtp = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    const otpCode = otp.join("");
    setValue("otp", otpCode);
    const isValid = await trigger("otp");
    if (!isValid) {
      setLoading(false);
      return;
    }
    if (otpTimer <= 0) {
      setErrorMessage(
        "OTP sudah kadaluarsa, silakan kirim ulang OTP"
      );
      setLoading(false);
      return;
    }
    try {
      const response = await api.post("/auth/verify-otp",
        {
          otp: otpCode,
          otpToken,
        }
      );
      if (response.data.status) {
        dispatch(
          setAuthData({
            token: response.data.token,
            user: response.data.user,
          })
        );
        setSuccessMessage("Verifikasi OTP berhasil");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || "OTP gagal";

        setErrorMessage(message);
      } else {
        setErrorMessage("Terjadi kesalahan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      const response = await api.post("/auth/resend-otp", {
        otpToken,
      });
      if (response.data.status) {
        dispatch(
          setOtpData({
            otpToken: response.data.otpToken,
            otpExpiredAt: response.data.otpExpiredAt,
            user: response.data.user,
          })
        );
        setOtp(["", "", "", "", "", ""]);
        setResendTimer(30);
        setSuccessMessage("OTP berhasil dikirim ulang");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.message ||
          "Gagal mengirim ulang OTP"
        );
      }
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyOtp();
              }}
            >
              {/* Description */}
              <div className="mb-6 text-center">
                <p className="text-[20px] leading-8 text-gray-500">
                  Kode OTP telah dikirimkan ke
                </p>

                <p className="text-[20px] font-semibold text-gray-700">
                  {user?.email}
                </p>

                <p className="text-[20px] leading-8 text-gray-500">
                  mohon masukan kode
                </p>

                <p className="text-[20px] leading-8 text-gray-500">
                  yang diterima pada kolom di bawah.
                </p>
              </div>
              {/* Alert Success */}
              {successMessage && (
                <div className="mb-5">
                  <Alert>
                    <AlertTitle>Berhasil</AlertTitle>
                    <AlertDescription>
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              {/* Alert Success */}
              {/* Alert Error */}
              {errorMessage && (
                <div className="mb-5">
                  <Alert variant="destructive">
                    <AlertTitle>
                      Verifikasi Gagal
                    </AlertTitle>
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              {/* Alert Error */}

              {/* OTP Input */}
              <div className="mb-5">
                <OtpInput
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    const otpCode = value.join("");
                    // hanya validasi kalau user sudah pernah klik verify
                    if (errors.otp) {
                      setValue("otp", otpCode, {
                        shouldValidate: true,
                      });
                    }
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  disabled={otpTimer <= 0}
                />

                {errors.otp && (
                  <p className="mt-2 text-center text-sm text-red-500">
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
                  {minutes} menit {seconds < 10 ? `0${seconds}` : seconds} detik
                </p>
              </div>  
              {/* Timer */}

              {/* Button Submit OTP */}
              <div className="mb-5">
                <Button
                  type="submit"
                  disabled={otpTimer <= 0 || loading}
                  className="h-[55px] w-full rounded-2xl bg-[#0D5EF4] text-lg font-bold text-whitehover:bg-[#0B4ED0]"
                >
                  {loading
                    ? "VERIFYING..."
                    : otpTimer <= 0
                    ? "OTP EXPIRED"
                    : "VERIFIKASI OTP"
                  }
                </Button>
              </div>
              {/* Button Submit OTP */}

              {/* Button Resend OTP */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-[18px] text-gray-500">
                    Tunggu {resendTimer} detik untuk mengirim ulang OTP
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[20px] font-semibold text-blue-600 hover:underline"
                  >
                    Kirim Ulang OTP
                  </button>
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