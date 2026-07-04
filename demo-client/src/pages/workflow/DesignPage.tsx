import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { designAPI } from "../../services/designService"; // Assuming designAPI has fetchHLD and generateLLD

const DesignPage = () => {
  const { projectId } = useParams();
  const [hld, setHLD] = useState<string | null>(null);
  const [lld, setLLD] = useState<string | null>(null);
  const [loadingHLD, setLoadingHLD] = useState(false);
  const [loadingLLD, setLoadingLLD] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing HLD and LLD if available
  useEffect(() => {
    const loadDesignDocs = async () => {
      setError(null);
      try {
        // Fetch HLD
        const hldRes = await designAPI.getDesignDocs(projectId!, "HLD");
        if (hldRes.success && hldRes.docs && hldRes.docs.length > 0) {
          setHLD(hldRes.docs[0].content);
        }

        // Fetch LLD
        const lldRes = await designAPI.getDesignDocs(projectId!, "LLD");
        if (lldRes.success && lldRes.docs && lldRes.docs.length > 0) {
          setLLD(lldRes.docs[0].content);
        }
      } catch (err: any) {
        console.error("Failed to load design docs:", err);
        setError("Failed to load existing design documents.");
      }
    };
    loadDesignDocs();
  }, [projectId]);

  const handleGenerateHLD = async () => {
    setLoadingHLD(true);
    setError(null);
    try {
      const res = await designAPI.generateHLD({ projectId: projectId! });
      if (res.success) {
        setHLD(res.hld);
      } else {
        setError(res.message || "Failed to generate HLD.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingHLD(false);
    }
  };

  const handleGenerateLLD = async () => {
    setLoadingLLD(true);
    setError(null);
    try {
      const res = await designAPI.generateLLD({ projectId: projectId! });
      if (res.success) {
        setLLD(res.lld);
      } else {
        setError(res.message || "Failed to generate LLD.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingLLD(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">High-Level Design (HLD)</h1>
      {hld ? (
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{hld}</pre>
      ) : (
        <p className="text-gray-500">No HLD generated yet.</p>
      )}

      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleGenerateHLD}
        disabled={loadingHLD}
      >
        {loadingHLD ? "Generating HLD..." : hld ? "Regenerate HLD" : "Generate HLD"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <h1 className="text-2xl font-bold mb-4 mt-8">Low-Level Design (LLD)</h1>
      {lld ? (
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{lld}</pre>
      ) : (
        <p className="text-gray-500">No LLD generated yet.</p>
      )}

      <button
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
        onClick={handleGenerateLLD}
        disabled={loadingLLD || !hld} // LLD requires HLD to be present
      >
        {loadingLLD ? "Generating LLD..." : lld ? "Regenerate LLD" : "Generate LLD"}
      </button>
    </div>
  );
};

export default DesignPage;
