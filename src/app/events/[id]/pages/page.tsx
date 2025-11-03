"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PagesList } from '@/features/pages/components/list';

export default function EventPagesPage() {
  const params = useParams();
  const eventId = String(params?.id || "");

  return <PagesList eventId={eventId} />;
}
