const defaultRequestHeaders = {
  Accept: "application/json",
  "User-Agent": "heat-water-access-hackathon/1.0",
};

const requestOk = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: { ...defaultRequestHeaders, ...init?.headers },
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response;
};

export const requestJson = async <ResponseBody>(url: string, init?: RequestInit) =>
  (await (await requestOk(url, init)).json()) as ResponseBody;

export const requestArrayBuffer = async (url: string) =>
  (await requestOk(url, { headers: { Accept: "*/*" } })).arrayBuffer();
