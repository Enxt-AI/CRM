"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your client relationships
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Client Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">No clients yet</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Coming soon - Client management will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

