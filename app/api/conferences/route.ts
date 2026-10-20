import { fetchSnapshot } from '../../../lib/data';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const data = await fetchSnapshot(new URL(request.url).searchParams.get('refresh') === '1');
    return Response.json(data, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return Response.json({ error: '数据源暂时无法访问，已保留上次数据。请稍后重试。' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
