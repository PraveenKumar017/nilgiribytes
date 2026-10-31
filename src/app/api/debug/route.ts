import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return Response.json({
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}
