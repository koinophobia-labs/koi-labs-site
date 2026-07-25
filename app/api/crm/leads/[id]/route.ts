import { NextRequest, NextResponse } from "next/server"; import { isCrmApiAuthorized } from "@/lib/crm-access"; import { updateLead, validateLeadUpdate } from "@/lib/acquisition/leads";
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  if (!(await isCrmApiAuthorized(request))) return NextResponse.json({ok:false},{status:401});
  const parsed=validateLeadUpdate(await request.json().catch(()=>null)); if(!parsed.update) return NextResponse.json({ok:false,errors:parsed.errors},{status:422});
  const lead=await updateLead((await params).id,parsed.update); return lead?NextResponse.json({ok:true,lead}):NextResponse.json({ok:false},{status:404});
}
