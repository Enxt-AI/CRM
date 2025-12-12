"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deals as dealsApi, type Deal, type DealStage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Plus, Archive } from "lucide-react";
import { useRouter } from "next/navigation";

const DEAL_STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "QUALIFICATION", label: "Qualification", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { key: "NEEDS_ANALYSIS", label: "Needs Analysis", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "VALUE_PROPOSITION", label: "Value Proposition", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "PROPOSAL_PRICE_QUOTE", label: "Proposal/Quote", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { key: "NEGOTIATION", label: "Negotiation", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { key: "CLOSED_WON", label: "Closed Won", color: "bg-green-100 text-green-700 border-green-200" },
  { key: "CLOSED_LOST", label: "Closed Lost", color: "bg-red-100 text-red-700 border-red-200" },
];

export default function DealsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dealsByStage, setDealsByStage] = useState<Record<DealStage, Deal[]>>({} as any);
  const [stageValues, setStageValues] = useState<Record<DealStage, number>>({} as any);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dealsApi.list();
      setDealsByStage(response.dealsByStage);
      setStageValues(response.stageValues);
      setTotalValue(response.totalValue);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStage: DealStage) => {
    if (!draggedDeal || draggedDeal.stage === targetStage) {
      setDraggedDeal(null);
      return;
    }

    try {
      await dealsApi.update(draggedDeal.id, { stage: targetStage });
      toast.success(`Deal moved to ${DEAL_STAGES.find(s => s.key === targetStage)?.label}`);
      await fetchDeals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update deal");
    } finally {
      setDraggedDeal(null);
    }
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (deal.stage !== "CLOSED_WON" && deal.stage !== "CLOSED_LOST") {
      toast.error("Can only delete deals that are closed (won or lost)");
      return;
    }

    if (!confirm(`Are you sure you want to archive "${deal.title}"?`)) {
      return;
    }

    try {
      await dealsApi.softDelete(deal.id);
      toast.success("Deal archived successfully");
      await fetchDeals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive deal");
    }
  };

  const getTotalDeals = () => {
    return Object.values(dealsByStage).reduce((sum, deals) => sum + deals.length, 0);
  };

  const getActiveDeals = () => {
    return Object.entries(dealsByStage)
      .filter(([stage]) => stage !== "CLOSED_WON" && stage !== "CLOSED_LOST")
      .reduce((sum, [, deals]) => sum + deals.length, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Deals Pipeline</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Track and manage your sales opportunities
          </p>
        </div>
        <div className="flex gap-2">
          {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/deals/archived")}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archived
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getActiveDeals()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Closed Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dealsByStage["CLOSED_WON"]?.length || 0}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {formatCurrency(stageValues["CLOSED_WON"] || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{getTotalDeals()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
      ) : (
        /* Kanban Board */
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {DEAL_STAGES.map((stage) => (
              <div
                key={stage.key}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.key)}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium text-neutral-900">
                          {stage.label}
                        </CardTitle>
                        <p className="text-xs text-neutral-500 mt-1">
                          {dealsByStage[stage.key]?.length || 0} deals
                        </p>
                      </div>
                      <Badge className={`${stage.color} border`}>
                        {formatCurrency(stageValues[stage.key] || 0)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dealsByStage[stage.key]?.length > 0 ? (
                      dealsByStage[stage.key].map((deal) => (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={() => handleDragStart(deal)}
                          className="p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-shadow cursor-move"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm text-neutral-900 line-clamp-2">
                              {deal.title}
                            </h4>
                          </div>
                          {deal.client && (
                            <p className="text-xs text-neutral-600 mb-2">
                              {deal.client.companyName}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-600">
                              {formatCurrency(Number(deal.value))}
                            </span>
                          </div>
                          {deal.owner && (
                            <p className="text-xs text-neutral-500 mt-2">
                              Owner: {deal.owner.fullName}
                            </p>
                          )}
                          {(stage.key === "CLOSED_WON" || stage.key === "CLOSED_LOST") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full mt-2 text-xs"
                              onClick={() => handleDeleteDeal(deal)}
                            >
                              Archive
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-sm text-neutral-400">
                        No deals
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

