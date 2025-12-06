"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Deals</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track your sales pipeline and revenue
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Deal Pipeline</CardTitle>
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
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">No deals yet</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Coming soon - Deal management will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

