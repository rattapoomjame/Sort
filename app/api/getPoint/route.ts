import { NextRequest, NextResponse } from 'next/server'
import { getUserPoints } from '@/lib/supabase'

/**
 * GET /api/getPoint?user_id=<uuid>
 * ดึงจำนวนคะแนนของผู้ใช้
 * Query: user_id (required)
 * Response: { points: number } หรือ { error: string }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const points = await getUserPoints(user_id)

    return NextResponse.json(
      { points, user_id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get points error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
