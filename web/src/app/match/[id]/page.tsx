import { TopBar } from "../../components/TopBar";
import MatchClient from "./MatchClient";
import ReRenderButton from "./ReRenderButton";

export const dynamic = "force-dynamic";

export default function MatchPage({ params }: { params: { id: string } }) {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 10 }}>
          <ReRenderButton matchId={params.id} />
        </div>
        <MatchClient id={params.id} />
      </div>
    </>
  );
}
