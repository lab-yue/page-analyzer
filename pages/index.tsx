import { useState } from "react";

export default function Index() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState("");
  const [fetching, setFetching] = useState(false);

  const handleFetch = async () => {
    if (fetching) return;
    setFetching(true);
    try {
      const res: any = await fetch(`/api/analyze?url=${url}`).then((res) =>
        res.json()
      );
      if (res?.url) {
        setData(res.url);
        setFetching(false);
      }
    } catch {
      setFetching(false);
    }
  };

  return (
    <div>
      <input
        value={url}
        type="text"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFetch();
        }}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFetch();
        }}
      >
        get
      </button>
      {fetching && <p>this may take serveral minutes</p>}
      <img src={data} alt="" />
    </div>
  );
}
