"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deals as dealsApi, type Deal } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw } from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  QUALIFICATION: "Qualification",
  NEEDS_ANALYSIS: "Needs Analysis",
  VALUE_PROPOSITION: "Value Proposition",
  PROPOSAL_PRICE_QUOTE: "Proposal/Quote",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

const STAGE_STYLES: Record<string, string> = {
  CLOSED_WON: "bg-green-100 text-green-700 border-green-200",
  CLOSED_LOST: "bg-red-100 text-red-700 border-red-200",
};

export default function ArchivedDealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [archivedDeals, setArchivedDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin or manager
  useEffect(() => {
    if (user && user.role === "EMPLOYEE") {
      router.push("/dashboard/deals");
      toast.error("Access denied");
    }
  }, [user, router]);

  const fetchArchivedDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dealsApi.archived();
      setArchivedDeals(response.deals);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch archived deals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== "EMPLOYEE") {
      fetchArchivedDeals();
    }
  }, [fetchArchivedDeals, user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRestore = async (deal: Deal) => {
    if (!confirm(`Are you sure you want to restore "${deal.title}"?`)) {
      return;
    }

    try {
      await dealsApi.restore(deal.id);
      toast.success("Deal restored successfully");
      await fetchArchivedDeals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore deal");
    }
  };

  if (user?.role === "EMPLOYEE") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/deals")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-neutral-900">Archived Deals</h1>
          </div>
          <p className="mt-1 text-sm text-neutral-500 ml-10">
            View and restore deleted deals
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{archivedDeals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Won Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {archivedDeals.filter(d => d.stage === "CLOSED_WON").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Lost Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {archivedDeals.filter(d => d.stage === "CLOSED_LOST").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">
              {formatCurrency(archivedDeals.reduce((sum, d) => sum + Number(d.value), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
      ) : archivedDeals.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
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
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-neutral-900">No archived deals</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Deleted deals will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Table View */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Archived Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedDeals.map((deal) => (
                    <TableRow key={deal.id} className="hover:bg-neutral-50">
                      <TableCell className="font-medium">
                        <div>
                          <div>{deal.title}</div>
                          {deal.description && (
                            <div className="text-xs text-neutral-500 line-clamp-1">
                              {deal.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {deal.client?.companyName || "N/A"}
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {deal.owner?.fullName || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STAGE_STYLES[deal.stage]} border-0`}>
                          {STAGE_LABELS[deal.stage]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {formatCurrency(Number(deal.value))}
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {deal.deletedBy?.fullName || "Unknown"}
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm">
                        {deal.deletedAt ? formatDate(deal.deletedAt) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(deal)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
