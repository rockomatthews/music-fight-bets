import { TopBar } from "./components/TopBar";
import HomeClient from "./home/HomeClient";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <HomeClient />
      </div>
    </>
  );
}
