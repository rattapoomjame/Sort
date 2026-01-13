import { NextRequest, NextResponse } from 'next/server'
import { getUserByPhone, getUserPoints } from '@/lib/supabase'

/**
 * POST /api/loginPhone
 * ค้นหาผู้ใช้จากเบอร์โทรศัพท์
 * Request: { phone: string }
 * Response: { user: object, points: number } หรือ { error: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const user = await getUserByPhone(phone) as { id: string } | null

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // ดึงคะแนนของผู้ใช้
    const points = await getUserPoints(user.id)

    return NextResponse.json({ user, points }, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
