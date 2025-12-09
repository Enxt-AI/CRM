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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clients as clientsApi, type Client, type ClientStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const STATUS_STYLES: Record<ClientStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-700 border-gray-200",
  CHURNED: "bg-red-100 text-red-700 border-red-200",
  PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  CHURNED: "Churned",
  PAUSED: "Paused",
};

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clientsApi.list();
      setClientsList(response.clients);
      setTotal(response.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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

  const handleViewClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`);
  };

  // Stats calculations
  const stats = {
    total: total,
    active: clientsList.filter((c) => c.status === "ACTIVE").length,
    totalRevenue: clientsList.reduce((sum, c) => sum + Number(c.lifetimeValue), 0),
    avgRevenue: total > 0 ? clientsList.reduce((sum, c) => sum + Number(c.lifetimeValue), 0) / total : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your client relationships and deals
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Avg. Client Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.avgRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
      ) : clientsList.length === 0 ? (
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
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-neutral-900">No clients yet</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Convert your leads to start building your client base
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Table View */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Primary Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Account Manager</TableHead>
                    <TableHead>Deals</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Lifetime Value</TableHead>
                    <TableHead>Client Since</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsList.map((client) => (
                    <TableRow key={client.id} className="hover:bg-neutral-50 cursor-pointer">
                      <TableCell className="font-medium">
                        <div>
                          <div>{client.companyName}</div>
                          {client.email && (
                            <div className="text-xs text-neutral-500">{client.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        <div>
                          <div>{client.primaryContact}</div>
                          {client.mobile && (
                            <div className="text-xs text-neutral-500">{client.mobile}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_STYLES[client.status]} border-0`}>
                          {STATUS_LABELS[client.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {client.accountManager.fullName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {client.activeDealsCount || 0} Active
                          </div>
                          <div className="text-xs text-neutral-500">
                            {client._count?.deals || 0} Total
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {formatCurrency(client.totalDealsValue || 0)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(Number(client.lifetimeValue))}
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm">
                        {formatDate(client.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewClient(client.id)}
                        >
                          View Details
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
