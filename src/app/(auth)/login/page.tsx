import Login from "@/components/auth/login";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PMS - LogIn Page",
  description: "SignIn",
};

export default function login() {
  return <Login />;
}
