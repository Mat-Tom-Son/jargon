import fetch from 'node-fetch';

/**
 * Send a policy check to an OPA instance.  Returns true if the
 * policy allows the input, false otherwise.  In case of network
 * failure the default is to deny.
 */
export async function checkPolicy(url: string, input: any): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });
    const json = await res.json();
    return !!json.result;
  } catch {
    return false;
  }
}