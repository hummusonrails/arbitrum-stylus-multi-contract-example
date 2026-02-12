"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/header";
import { VoterRegistration } from "@/components/voter-registration";
import { CreatePoll } from "@/components/create-poll";
import { PollList } from "@/components/poll-list";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/footer";

export default function Home() {
  // re-render poll list on create
  const [pollKey, setPollKey] = useState(0);
  const handlePollCreated = useCallback(() => setPollKey((k) => k + 1), []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <VoterRegistration />
        <Separator />
        <CreatePoll onCreated={handlePollCreated} />
        <Separator />
        <PollList key={pollKey} />
      </main>
      <Footer />
    </div>
  );
}
