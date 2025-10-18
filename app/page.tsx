import { getDailySeed } from "@/lib/seed";
import { getLeaderboard } from "@/lib/leaderboard";
import HomeContent from "@/components/HomeContent";

export default async function Home() {
  const seed = getDailySeed();
  const entries = await getLeaderboard(seed, 10);
  return <HomeContent entries={entries} />;
}
