// Each ingress must overwrite its header. EC2's Node server must stay on loopback.
// Never accept generic forwarding headers or silently fall back between providers.
export function clientIpOptions(target?: string) {
  return { ipAddressHeaders: [target === "ec2" ? "x-certiblank-client-ip" : "x-nf-client-connection-ip"] };
}
