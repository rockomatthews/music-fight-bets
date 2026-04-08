import { TopBar } from "../components/TopBar";
import MyBetsClient from "./my_bets_client";

export const dynamic = "force-dynamic";

export default function MyBetsPage() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <MyBetsClient />
      </div>
    </>
  );
}
