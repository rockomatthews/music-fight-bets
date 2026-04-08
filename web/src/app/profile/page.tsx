import { TopBar } from "../components/TopBar";
import ProfileClient from "./profile_client";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <ProfileClient />
      </div>
    </>
  );
}
