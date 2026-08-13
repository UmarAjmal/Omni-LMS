import CampaignDetailsClient from "./CampaignDetailsClient";

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <CampaignDetailsClient />;
}
