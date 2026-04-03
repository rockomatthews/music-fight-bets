import { TopBar } from "../components/TopBar";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default function HomeSplash() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <HomeClient />
      </div>
    </>
  );
}
