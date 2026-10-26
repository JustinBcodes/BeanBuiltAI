import { NextResponse } from 'next/server'

// Minimal health response; never echo arbitrary request payloads.
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
