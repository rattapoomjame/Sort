import { NextRequest, NextResponse } from 'next/server'
import { updatePoints, supabaseAdmin } from '@/lib/supabase'

/**
 * API Route สำหรับอัปเดตแต้มผู้ใช้
 * POST /api/updatePoints
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, points } = body

    // Validate input
    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      )
    }

    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json(
        { success: false, error: 'points must be a non-negative number' },
        { status: 400 }
      )
    }

    // อัปเดตแต้มผู้ใช้
    const { data, error } = await supabaseAdmin
      .from('user_points')
      .update({
        points: points,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .select()

    if (error) {
      console.error('Error updating points:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // ถ้าไม่มี record ให้สร้างใหม่
    if (!data || data.length === 0) {
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('user_points')
        .insert({
          user_id: user_id,
          points: points,
          updated_at: new Date().toISOString()
        })
        .select()

      if (insertError) {
        console.error('Error inserting points:', insertError)
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: insertData?.[0],
        message: 'Points created successfully'
      })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Points updated successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
