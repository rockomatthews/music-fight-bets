import { TopBar } from "./components/TopBar";
import FeedClient from "./FeedClient";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <FeedClient />
      </div>
    </>
  );
}
