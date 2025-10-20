import { getLeaderboard } from "@/lib/leaderboard";
import HomeContent from "@/components/HomeContent";

export default async function Home() {
  const entries = await getLeaderboard(10);
  return <HomeContent entries={entries} />;
}
