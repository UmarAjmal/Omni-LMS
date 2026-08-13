import StudentCampaignDetailsClient from "./StudentCampaignDetailsClient";

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <StudentCampaignDetailsClient />;
}
