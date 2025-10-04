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
    setFormattedDate(format(new Date(date), formatString));
  }, [date, formatString]);

  if (!formattedDate) {
    return null; 
  }

  return <span>{formattedDate}</span>;
}
