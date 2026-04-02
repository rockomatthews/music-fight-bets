import { TopBar } from "../components/TopBar";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <AdminClient />
      </div>
    </>
  );
}
