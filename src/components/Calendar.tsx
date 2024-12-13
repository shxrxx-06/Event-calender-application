"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CalendarIcon, ClockIcon, Trash2Icon } from 'lucide-react';
import { format } from 'date-fns';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<CalendarEvent>({
    name: '',
    startTime: '',
    endTime: '',
    description: '',
    color: '#1a73e8'
  });
  const [searchTerm, setSearchTerm] = useState('');

  interface CalendarEvent {
    name: string;
    startTime: string;
    endTime: string;
    description: string;
    color: string;
  }

  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('calendarEvents');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('calendarEvents', JSON.stringify(events));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  }, [events]);

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selectedDate);
    setShowEventModal(true);
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.name || !newEvent.startTime || !newEvent.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    const dateKey = selectedDate.toISOString().split('T')[0];
    const existingEvents = events[dateKey] || [];

    const isOverlapping = existingEvents.some(event => {
      const newStart = new Date(`${dateKey}T${newEvent.startTime}`);
      const newEnd = new Date(`${dateKey}T${newEvent.endTime}`);
      const eventStart = new Date(`${dateKey}T${event.startTime}`);
      const eventEnd = new Date(`${dateKey}T${event.endTime}`);
      
      return (newStart < eventEnd && newEnd > eventStart);
    });

    if (isOverlapping) {
      alert('Event times overlap with existing event!');
      return;
    }

    setEvents(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEvent].sort((a, b) => 
        a.startTime.localeCompare(b.startTime)
      )
    }));

    setNewEvent({
      name: '',
      startTime: '',
      endTime: '',
      description: '',
      color: '#1a73e8'
    });
    setShowEventModal(false);
  };

  const handleDeleteEvent = (dateKey: string, eventIndex: number) => {
    setEvents(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((_, index) => index !== eventIndex)
    }));
  };

  const exportEvents = () => {
    try {
      const dataStr = JSON.stringify(events, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const exportFileDefaultName = `calendar-events-${format(currentDate, 'yyyy-MM')}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting events:', error);
      alert('Failed to export events');
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-4 border border-gray-200 bg-gray-50"></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = date.toISOString().split('T')[0];
      const dayEvents = events[dateKey] || [];
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <Card
          key={day}
          onClick={() => handleDateClick(day)}
          className={`p-4 min-h-[120px] cursor-pointer transition-all hover:shadow-md ${
            isToday ? 'bg-blue-50 border-blue-200' : ''
          }`}
        >
          <div className="font-bold text-lg mb-2">{day}</div>
          <div className="space-y-1">
            {dayEvents.map((event, index) => (
              <div
                key={index}
                className="text-xs p-2 rounded-md flex items-center justify-between group"
                style={{ backgroundColor: `${event.color}20` }}
              >
                <div className="flex items-center space-x-1">
                  <ClockIcon size={12} className="text-gray-600" />
                  <span className="font-medium" style={{ color: event.color }}>
                    {event.name}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(dateKey, index);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2Icon size={12} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    return days;
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <CalendarIcon className="mr-2" />
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h1>
        <div className="space-x-3">
          <Button variant="outline" onClick={handlePrevMonth}>Previous</Button>
          <Button variant="outline" onClick={handleNextMonth}>Next</Button>
          <Button variant="default" onClick={exportEvents}>Export Events</Button>
        </div>
      </div>

      <Input
        type="text"
        placeholder="Search events..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6 max-w-md"
      />

      <div className="grid grid-cols-7 gap-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600">
            {day}
          </div>
        ))}
        {renderCalendar()}
      </div>

      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Add Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium">Event Name</Label>
              <Input
                value={newEvent.name}
                onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">End Time</Label>
                <Input
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Color</Label>
              <Input
                type="color"
                value={newEvent.color}
                onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
                className="mt-1 h-10"
              />
            </div>
            <Button onClick={handleAddEvent} className="w-full">Add Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
