import { useAuth } from "@/contexts/AuthContext";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect } from "react";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) return <CircularProgress />;

  return <>{children}</>;
};

export default AuthGuard;
