import { TopBar } from "../../components/TopBar";
import MatchClient from "./MatchClient";

export const dynamic = "force-dynamic";

export default function MatchPage({ params }: { params: { id: string } }) {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <MatchClient id={params.id} />
      </div>
    </>
  );
}
