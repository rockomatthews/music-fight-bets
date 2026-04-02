import { TopBar } from "../components/TopBar";
import FightersClient from "./fighters_client";

export const dynamic = "force-dynamic";

export default function FightersPage() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <FightersClient />
      </div>
    </>
  );
}
