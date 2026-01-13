import { NextRequest, NextResponse } from 'next/server'
import { addPoints, supabaseAdmin } from '@/lib/supabase'

// Default pricing
const DEFAULT_PRICING = {
  glass: { points: 5 },
  plastic: { points: 3 },
  can: { points: 4 },
}

/**
 * ดึงค่า pricing จาก database
 */
async function getPricing() {
  try {
    const { data } = await supabaseAdmin
      .from('machine_settings')
      .select('value')
      .eq('key', 'pricing')
      .single()
    
    return data?.value || DEFAULT_PRICING
  } catch {
    return DEFAULT_PRICING
  }
}

/**
 * POST /api/addPoint
 * เพิ่มคะแนนให้ผู้ใช้ พร้อมบันทึกประวัติการรีไซเคิล
 * Request: { user_id: string, points?: number, label?: string }
 * - ถ้าส่ง label มา จะใช้ค่าจาก pricing config
 * - ถ้าส่ง points มา จะใช้ค่านั้นตรงๆ
 */
export async function POST(req: NextRequest) {
  try {
    const { user_id, points: inputPoints, label } = await req.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // ดึง pricing จาก database
    const pricing = await getPricing()
    
    // คำนวณ points
    let pointsToAdd = inputPoints
    
    // ถ้ามี label ให้ใช้ค่าจาก pricing
    if (label) {
      const labelLower = label.toLowerCase()
      if (labelLower.includes('glass')) {
        pointsToAdd = pricing.glass?.points || DEFAULT_PRICING.glass.points
      } else if (labelLower.includes('plastic')) {
        pointsToAdd = pricing.plastic?.points || DEFAULT_PRICING.plastic.points
      } else if (labelLower.includes('can') || labelLower.includes('aluminum')) {
        pointsToAdd = pricing.can?.points || DEFAULT_PRICING.can.points
      }
    }

    if (!pointsToAdd || pointsToAdd <= 0) {
      return NextResponse.json(
        { error: 'Invalid points value' },
        { status: 400 }
      )
    }

    // ส่ง label เพื่อบันทึกลง point_history
    const result = await addPoints(user_id, pointsToAdd, label || null)

    // เพิ่มจำนวนขวดใน machine_status ตามประเภท
    if (label) {
      const labelLower = label.toLowerCase()
      let columnToUpdate = ''
      
      if (labelLower.includes('glass')) {
        columnToUpdate = 'glass_count'
      } else if (labelLower.includes('plastic')) {
        columnToUpdate = 'plastic_count'
      } else if (labelLower.includes('can') || labelLower.includes('aluminum')) {
        columnToUpdate = 'can_count'
      }
      
      if (columnToUpdate) {
        // ดึงค่าปัจจุบัน
        const { data: current } = await supabaseAdmin
          .from('machine_status')
          .select('glass_count, plastic_count, can_count')
          .eq('machine_id', 'main')
          .single()
        
        const counts = current as { glass_count?: number; plastic_count?: number; can_count?: number } | null
        let currentCount = 0
        if (columnToUpdate === 'glass_count') currentCount = counts?.glass_count || 0
        else if (columnToUpdate === 'plastic_count') currentCount = counts?.plastic_count || 0
        else if (columnToUpdate === 'can_count') currentCount = counts?.can_count || 0
        
        // อัปเดตเพิ่ม 1
        await supabaseAdmin
          .from('machine_status')
          .update({ 
            [columnToUpdate]: currentCount + 1,
            updated_at: new Date().toISOString()
          })
          .eq('machine_id', 'main')
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Added ${pointsToAdd} points to user ${user_id}`,
        pricing_used: { label, points: pointsToAdd }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Add points error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
