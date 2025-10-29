import { getLeaderboard, getOneWordLeaderboard, getTypeRacerLeaderboard, getHistory } from "@/lib/leaderboard";
import HomeContent from "@/components/HomeContent";

export default async function Home() {
  const speedEntries = await getLeaderboard(10);
  const oneWordEntries = await getOneWordLeaderboard(10);
  const typeRacerEntries = await getTypeRacerLeaderboard(10);
  const historyEntries = await getHistory(50);
  return <HomeContent speedEntries={speedEntries} oneWordEntries={oneWordEntries} typeRacerEntries={typeRacerEntries} historyEntries={historyEntries} />;
}
