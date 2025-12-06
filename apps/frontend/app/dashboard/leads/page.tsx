"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Leads</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage and track your sales leads
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Lead Pipeline</CardTitle>
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
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">No leads yet</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Coming soon - Lead management will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

