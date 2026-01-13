import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ใช้ Service Role Key สำหรับ bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// Default pricing config
const DEFAULT_PRICING = {
  glass: { points: 5, name: 'ขวดแก้ว', emoji: '🍾' },
  plastic: { points: 3, name: 'ขวดพลาสติก', emoji: '🥤' },
  can: { points: 4, name: 'กระป๋อง', emoji: '🥫' },
  points_per_baht: 100, // 100 แต้ม = 1 บาท
  min_withdrawal: 100, // ขั้นต่ำถอน 100 แต้ม
}

/**
 * GET - ดึงค่า pricing ปัจจุบัน
 */
export async function GET() {
  try {
    // ดึงจาก machine_settings table
    const { data, error } = await supabase
      .from('machine_settings')
      .select('*')
      .eq('key', 'pricing')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching pricing:', error)
    }

    // ถ้าไม่มีข้อมูล ใช้ default
    const pricing = data?.value || DEFAULT_PRICING

    return NextResponse.json({
      success: true,
      pricing
    })
  } catch (error) {
    console.error('Pricing GET error:', error)
    return NextResponse.json({
      success: true,
      pricing: DEFAULT_PRICING
    })
  }
}

/**
 * POST - อัปเดตค่า pricing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pricing } = body

    if (!pricing) {
      return NextResponse.json(
        { success: false, error: 'Missing pricing data' },
        { status: 400 }
      )
    }

    // Validate pricing
    if (pricing.glass?.points < 0 || pricing.plastic?.points < 0 || pricing.can?.points < 0) {
      return NextResponse.json(
        { success: false, error: 'Points cannot be negative' },
        { status: 400 }
      )
    }

    // Upsert เข้า machine_settings
    const { data, error } = await supabase
      .from('machine_settings')
      .upsert({
        key: 'pricing',
        value: pricing,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })
      .select()

    if (error) {
      console.error('Error saving pricing:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing updated successfully',
      data
    })
  } catch (error) {
    console.error('Pricing POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
