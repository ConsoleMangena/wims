import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta title="Home" description="Welcome to WIMS - Wildlife Management Information System" />
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Welcome to WIMS</h1>
        <p className="text-gray-600">
          Use the sidebar to access your role-based dashboard and manage resources like species, sightings, reserves, licenses, quotas, and poaching incidents.
        </p>
      </div>
    </>
  );
}
