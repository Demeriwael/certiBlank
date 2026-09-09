import Image from "next/image";

export function PlatformLogo({ slug }: { slug: string }) {
  return <span className={`provider-logo provider-logo-${slug}`}><Image src={`/platforms/${slug}.png`} alt="" width={240} height={135} sizes="(max-width: 600px) 120px, 180px" /></span>;
}
