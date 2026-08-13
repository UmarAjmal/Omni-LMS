import StudentProfileClient from "./StudentProfileClient";

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page() {
  return <StudentProfileClient />;
}