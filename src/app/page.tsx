"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 rounded-full border-3 border-primary-500 border-t-transparent animate-spin" />
    </div>
  );
}
