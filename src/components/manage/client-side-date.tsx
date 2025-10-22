'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ClientSideDateProps {
  date: Date | string;
  formatString?: string;
}

export default function ClientSideDate({ date, formatString = 'MMM dd, yyyy' }: ClientSideDateProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This effect only runs on the client, after the initial render.
    // This avoids the server-client mismatch.
    setFormattedDate(format(new Date(date), formatString));
  }, [date, formatString]);

  // Render nothing on the server and during the initial client render.
  if (!formattedDate) {
    return null; 
  }

  // Render the formatted date only on the client after hydration.
  return <span>{formattedDate}</span>;
}
