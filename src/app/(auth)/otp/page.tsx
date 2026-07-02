import Input from "@/components/auth/verifyOtp";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PMS - OTP Code",
  description: "Input OTP",
};

export default function InputOtp() {
  return <Input />;
}