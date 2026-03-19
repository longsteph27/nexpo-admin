import { NextRequest, NextResponse } from 'next/server';

const CNAME_TARGET = process.env.CNAME_TARGET || 'cname.nexpo.vn';
const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn';

interface DnsAnswer { type: number; data: string }
interface DnsResponse { Answer?: DnsAnswer[] }

async function resolveDns(name: string, type: 'CNAME' | 'A'): Promise<string[]> {
  const res = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { accept: 'application/dns-json' } }
  );
  if (!res.ok) return [];
  const data = await res.json() as DnsResponse;
  return (data.Answer ?? []).map((r) => r.data.replace(/\.$/, '').toLowerCase());
}

async function checkDomain(domain: string): Promise<{ verified: boolean; found?: string; method?: string }> {
  try {
    // 1. Check CNAME record (works for subdomains)
    const cnameValues = await resolveDns(domain, 'CNAME');
    const target = CNAME_TARGET.replace(/\.$/, '').toLowerCase();
    const matchedCname = cnameValues.find((v) => v === target);
    if (matchedCname) {
      return { verified: true, found: matchedCname, method: 'CNAME' };
    }

    // 2. Check A record — supports apex domains with Cloudflare CNAME flattening or ALIAS
    // Compare the resolved IPs of domain vs CNAME_TARGET
    const [domainIps, targetIps] = await Promise.all([
      resolveDns(domain, 'A'),
      resolveDns(CNAME_TARGET, 'A'),
    ]);
    const targetIpSet = new Set(targetIps);
    const matchedIp = domainIps.find((ip) => targetIpSet.has(ip));
    if (matchedIp) {
      return { verified: true, found: matchedIp, method: 'A' };
    }

    return { verified: false, found: cnameValues[0] ?? domainIps[0] };
  } catch {
    return { verified: false };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');
  const siteId = searchParams.get('siteId');

  if (!domain || !siteId) {
    return NextResponse.json({ error: 'domain and siteId are required' }, { status: 400 });
  }

  // Check DNS (supports CNAME for subdomains + A record for apex domains)
  const { verified, found } = await checkDomain(domain);

  if (!verified) {
    return NextResponse.json({ verified: false, found, expected: CNAME_TARGET });
  }

  // Update domain_verified in Directus using the user's token
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    try {
      await fetch(`${DIRECTUS_URL}/items/sites/${siteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ domain_verified: true }),
      });
    } catch {
      // Non-fatal: DNS is verified but DB update failed — return partial success
      return NextResponse.json({
        verified: true,
        found,
        dbUpdated: false,
        error: 'DNS verified but failed to update database',
      });
    }
  }

  return NextResponse.json({ verified: true, found, dbUpdated: !!authHeader, expected: CNAME_TARGET });
}
