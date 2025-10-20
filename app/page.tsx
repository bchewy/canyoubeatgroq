import { getLeaderboard, getOneWordLeaderboard } from "@/lib/leaderboard";
import HomeContent from "@/components/HomeContent";

export default async function Home() {
  const speedEntries = await getLeaderboard(10);
  const oneWordEntries = await getOneWordLeaderboard(10);
  return <HomeContent speedEntries={speedEntries} oneWordEntries={oneWordEntries} />;
}
