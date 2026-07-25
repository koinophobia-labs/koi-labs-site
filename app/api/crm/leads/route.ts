import { NextRequest, NextResponse } from "next/server"; import { isCrmApiAuthorized } from "@/lib/crm-access"; import { listLeads } from "@/lib/acquisition/leads";
export async function GET(request: NextRequest) {
  if (!(await isCrmApiAuthorized(request))) return NextResponse.json({ok:false},{status:401});
  const p=request.nextUrl.searchParams; return NextResponse.json({ok:true,leads:await listLeads({search:p.get("search")||undefined,status:p.get("status")||undefined,sort:p.get("sort")||undefined})});
}
