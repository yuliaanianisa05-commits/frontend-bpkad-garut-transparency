"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnvironmentCheck() {
  const [envInfo, setEnvInfo] = useState<{
    apiUrl: string | undefined;
    isClient: boolean;
    canFetch: boolean;
    backendStatus: string;
  }>({
    apiUrl: undefined,
    isClient: false,
    canFetch: false,
    backendStatus: "checking...",
  });

  useEffect(() => {
    const checkEnvironment = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log(" Environment check:", {
        apiUrl,
        nodeEnv: process.env.NODE_ENV,
        isClient: typeof window !== "undefined",
      });

      setEnvInfo((prev) => ({
        ...prev,
        apiUrl,
        isClient: typeof window !== "undefined",
      }));

      // Test backend connectivity
      if (apiUrl) {
        try {
          const response = await fetch(`${apiUrl}/api/tahun-anggaran`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log(" Backend test response:", {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
          });

          if (response.ok) {
            const data = await response.json();
            setEnvInfo((prev) => ({
              ...prev,
              canFetch: true,
              backendStatus: `✅ Connected (${
                data.data?.length || 0
              } years found)`,
            }));
          } else {
            setEnvInfo((prev) => ({
              ...prev,
              canFetch: false,
              backendStatus: `❌ HTTP ${response.status}: ${response.statusText}`,
            }));
          }
        } catch (error) {
          console.error(" Backend connectivity test failed:", error);
          setEnvInfo((prev) => ({
            ...prev,
            canFetch: false,
            backendStatus: `❌ Connection failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          }));
        }
      } else {
        setEnvInfo((prev) => ({
          ...prev,
          backendStatus: "❌ NEXT_PUBLIC_API_URL not set",
        }));
      }
    };

    checkEnvironment();
  }, []);

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">
          🔧 Environment Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div>
          <strong>API URL:</strong> {envInfo.apiUrl || "❌ Not set"}
        </div>
        <div>
          <strong>Client Side:</strong> {envInfo.isClient ? "✅ Yes" : "❌ No"}
        </div>
        <div>
          <strong>Backend Status:</strong> {envInfo.backendStatus}
        </div>
        <div className="text-xs text-yellow-700 mt-2">
          This debug component will be removed once the issue is resolved.
        </div>
      </CardContent>
    </Card>
  );
}
