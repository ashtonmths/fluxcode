"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        void router.push("/auth/signin");
      } else {
        void router.push("/contests");
      }
    };

    void checkAuth();
  }, [router]);

  return null;
}

