"use client";

import { useEffect, useState } from "react";
import { meetings as meetingsApi, type Meeting } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MeetingsPage() {
  const [meetingsList, setMeetingsList] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await meetingsApi.list();
      setMeetingsList(data.meetings);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      await meetingsApi.delete(id);
      toast.success("Meeting deleted successfully");
      loadMeetings();
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      toast.error("Failed to delete meeting");
    }
  };

  // Get upcoming meetings (next 3)
  const now = new Date();
  const upcomingMeetings = meetingsList
    .filter((meeting) => new Date(meeting.startTime) > now && meeting.status === "SCHEDULED")
    .slice(0, 3);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const monthDays = lastDay.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getMeetingsForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    dayDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(dayDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return meetingsList.filter((meeting) => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate >= dayDate && meetingDate < nextDay;
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFullDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Meetings</h1>
        <p className="text-sm text-gray-600">View and manage your scheduled meetings</p>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {monthNames[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                Next →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm p-2 bg-gray-50"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-24 p-1 border" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: monthDays }).map((_, i) => {
              const day = i + 1;
              const dayMeetings = getMeetingsForDay(day);
              const isToday =
                new Date().toDateString() === new Date(year, month, day).toDateString();

              return (
                <div
                  key={day}
                  className={`min-h-24 p-1 border ${
                    isToday ? "bg-blue-50 border-blue-300" : ""
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isToday ? "text-blue-600" : ""
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                        title={`${meeting.title} - ${formatTime(meeting.startTime)}`}
                      >
                        <div className="font-medium truncate">{meeting.title}</div>
                        <div className="text-xs">{formatTime(meeting.startTime)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Next 3 Upcoming Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{meeting.title}</h3>
                      {meeting.status !== "SCHEDULED" && (
                        <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                          {meeting.status}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      📅 {formatFullDateTime(meeting.startTime)}
                    </div>
                    {meeting.client && (
                      <div className="text-sm text-gray-600 mt-1">
                        🏢 {meeting.client.companyName}
                      </div>
                    )}
                    {meeting.lead && (
                      <div className="text-sm text-gray-600 mt-1">
                        🎯 {meeting.lead.name}
                      </div>
                    )}
                    {meeting.location && (
                      <div className="text-sm text-gray-600 mt-1">
                        📍 {meeting.location}
                      </div>
                    )}
                    {meeting.meetingUrl && (
                      <div className="text-sm text-blue-600 mt-1">
                        <a
                          href={meeting.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          🔗 Join Meeting
                        </a>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Organizer: {meeting.organizer.fullName}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    🗑️
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No upcoming meetings scheduled</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
