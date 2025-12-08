"use client";

import { useEffect, useState, useCallback } from "react";
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
import { AddLeadDialog } from "@/components/add-lead-dialog";
import { leads as leadsApi, type Lead, type LeadPipelineStage, type Priority } from "@/lib/api";
import { toast } from "sonner";

const PIPELINE_STAGES: { value: LeadPipelineStage; label: string; color: string }[] = [
  { value: "NEW", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "CONTACTED", label: "Contacted", color: "bg-purple-100 text-purple-700" },
  { value: "QUALIFIED", label: "Qualified", color: "bg-indigo-100 text-indigo-700" },
  { value: "PROPOSAL", label: "Proposal", color: "bg-amber-100 text-amber-700" },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-orange-100 text-orange-700" },
  { value: "WON", label: "Won", color: "bg-green-100 text-green-700" },
  { value: "LOST", label: "Lost", color: "bg-red-100 text-red-700" },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-neutral-100 text-neutral-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  LINKEDIN: "LinkedIn",
  REFERRAL: "Referral",
  COLD_CALL: "Cold Call",
  TRADE_SHOW: "Trade Show",
  PARTNER: "Partner",
  EMAIL_CAMPAIGN: "Email Campaign",
  OTHER: "Other",
};

export default function LeadsPage() {
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [countByStage, setCountByStage] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leadsApi.list();
      setLeadsList(response.leads);
      setCountByStage(response.countByStage);
      setTotal(response.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPipelineStageStyle = (stage: LeadPipelineStage) => {
    return PIPELINE_STAGES.find((s) => s.value === stage)?.color || "bg-neutral-100 text-neutral-600";
  };

  const getPipelineStageLabel = (stage: LeadPipelineStage) => {
    return PIPELINE_STAGES.find((s) => s.value === stage)?.label || stage;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Leads</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage and track your sales leads
          </p>
        </div>
        <AddLeadDialog onLeadAdded={fetchLeads}>
          <Button>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Lead
          </Button>
        </AddLeadDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Leads</CardTitle>
            <svg
              className="h-4 w-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{total}</div>
            <p className="text-xs text-neutral-500">
              {total === 0 ? "No leads yet" : "All time leads"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">New</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{countByStage.NEW || 0}</div>
            <p className="text-xs text-neutral-500">Awaiting contact</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">In Progress</CardTitle>
            <div className="h-2 w-2 rounded-full bg-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">
              {(countByStage.CONTACTED || 0) +
                (countByStage.QUALIFIED || 0) +
                (countByStage.PROPOSAL || 0) +
                (countByStage.NEGOTIATION || 0)}
            </div>
            <p className="text-xs text-neutral-500">Active leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Won</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{countByStage.WON || 0}</div>
            <p className="text-xs text-neutral-500">Converted leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stage Badges */}
      <div className="flex flex-wrap gap-2">
        {PIPELINE_STAGES.map((stage) => (
          <Badge
            key={stage.value}
            variant="outline"
            className={`${stage.color} border-0`}
          >
            {stage.label}: {countByStage[stage.value] || 0}
          </Badge>
        ))}
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">All Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
            </div>
          ) : leadsList.length === 0 ? (
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
                Get started by adding your first lead
              </p>
              <div className="mt-4">
                <AddLeadDialog onLeadAdded={fetchLeads}>
                  <Button>
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Add Lead
                  </Button>
                </AddLeadDialog>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsList.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-neutral-600">
                        {lead.companyName || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {lead.email && (
                            <span className="text-sm text-neutral-600">{lead.email}</span>
                          )}
                          {lead.mobile && (
                            <span className="text-sm text-neutral-500">{lead.mobile}</span>
                          )}
                          {!lead.email && !lead.mobile && (
                            <span className="text-sm text-neutral-400">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-neutral-600">
                          {SOURCE_LABELS[lead.source] || lead.source}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPipelineStageStyle(lead.pipelineStage)} border-0`}>
                          {getPipelineStageLabel(lead.pipelineStage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${PRIORITY_STYLES[lead.priority]} border-0`}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-600">{lead.owner.fullName}</TableCell>
                      <TableCell className="text-neutral-500">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

