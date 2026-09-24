import assert from "node:assert/strict";
import { test } from "node:test";
import { getIP } from "better-auth/api";
import { clientIpOptions } from "../lib/client-ip";

test("EC2 trusts only the header overwritten by our reverse proxy", () => {
  const options = { advanced: { ipAddress: clientIpOptions("ec2") } };
  const headers = new Headers({
    "x-certiblank-client-ip": "203.0.113.10",
    "x-nf-client-connection-ip": "198.51.100.1",
    "x-forwarded-for": "198.51.100.2",
    "x-real-ip": "198.51.100.3",
  });
  assert.equal(getIP(headers, options), "203.0.113.10");
  const fallback = getIP(new Headers(), options);
  for (const value of ["", "invalid", "203.0.113.10, 198.51.100.1"]) {
    headers.set("x-certiblank-client-ip", value);
    assert.equal(getIP(headers, options), fallback);
  }
  headers.delete("x-certiblank-client-ip");
  assert.equal(getIP(headers, options), fallback);
});

test("existing managed hosting keeps its Netlify ingress policy", () => {
  assert.deepEqual(clientIpOptions(), { ipAddressHeaders: ["x-nf-client-connection-ip"] });
});
