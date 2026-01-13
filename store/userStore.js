import { create } from 'zustand'

/**
 * Zustand Store สำหรับจัดการ User State
 * - เก็บข้อมูลผู้ใช้ที่ logged in
 * - เก็บคะแนน
 * - เก็บสถานะ loading, error
 */
export const useUserStore = create((set) => ({
  // State
  user: null, // { id, phone, username }
  points: 0,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Actions: ตั้งข้อมูลผู้ใช้
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Actions: ตั้งคะแนน
  setPoints: (points) => set({ points }),

  // Actions: เพิ่มคะแนน
  addPoints: (points) => set((state) => ({
    points: state.points + points,
  })),

  // Actions: ตั้งสถานะ loading
  setLoading: (isLoading) => set({ isLoading }),

  // Actions: ตั้ง error
  setError: (error) => set({ error }),

  // Actions: logout
  logout: () => set({
    user: null,
    points: 0,
    isAuthenticated: false,
    error: null,
  }),

  // Actions: รีเซ็ต state ทั้งหมด
  reset: () => set({
    user: null,
    points: 0,
    isLoading: false,
    isAuthenticated: false,
    error: null,
  }),
}))

/**
 * Zustand Store สำหรับจัดการ Process State
 * - เก็บสถานะกระบวนการทำงานของเครื่อง
 * - เก็บข้อมูล real-time จาก IoT
 * - เก็บจำนวนขยะแต่ละประเภทในเซสชันปัจจุบัน
 */
export const useProcessStore = create((set, get) => ({
  // State: สถานะการทำงาน
  status: 'standby', // standby, scanning, processing, completed
  currentStep: 0, // 0-4 (5 steps)
  stepLabels: [
    'กำลังรอ',
    'สแกนสินค้า',
    'กำลังวิเคราะห์',
    'คำนวณคะแนน',
    'บันทึกข้อมูล'
  ],
  progress: 0, // 0-100
  lastLabel: null, // เช่น "plastic_bottle"
  lastPoints: 0,
  
  // State: Pricing จาก database (default values)
  pricing: {
    glass: { points: 10 },
    plastic: { points: 8 },
    can: { points: 6 },
  },
  
  // State: จำนวนขยะแต่ละประเภทในเซสชันปัจจุบัน
  sessionItems: {
    glassBottle: { count: 0, points: 0 },
    plasticBottle: { count: 0, points: 0 },
    can: { count: 0, points: 0 },
  },
  sessionTotalPoints: 0,
  sessionTotalMoney: 0,

  // Actions: โหลด pricing จาก API
  loadPricing: async () => {
    try {
      const response = await fetch('/api/pricing')
      const data = await response.json()
      if (data.pricing) {
        set({ pricing: data.pricing })
      }
    } catch (error) {
      console.error('Error loading pricing:', error)
    }
  },

  // Actions: ตั้งสถานะ
  setStatus: (status) => set({ status }),

  // Actions: เลื่อนไปขั้นตอนถัดไป
  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.stepLabels.length - 1),
    progress: Math.round(((state.currentStep + 1) / state.stepLabels.length) * 100),
  })),

  // Actions: รีเซ็ตขั้นตอน
  resetProcess: () => set({
    currentStep: 0,
    progress: 0,
    status: 'standby',
    lastLabel: null,
    lastPoints: 0,
  }),

  // Actions: ตั้งข้อมูลจาก IoT
  setProcessData: (data) => set({
    lastLabel: data.label,
    lastPoints: data.points,
  }),

  // Actions: ตั้ง progress
  setProgress: (progress) => set({ progress }),

  // Actions: เพิ่มรายการขยะในเซสชัน
  addSessionItem: (itemType, pointsEarned) => set((state) => {
    const itemKey = itemType === 'glass_bottle' ? 'glassBottle' : 
                    itemType === 'plastic_bottle' ? 'plasticBottle' : 'can'
    
    // คำนวณเงินจาก points (100 points = 1 บาท)
    const moneyEarned = pointsEarned / 100
    const newCount = state.sessionItems[itemKey].count + 1
    const newItemPoints = state.sessionItems[itemKey].points + pointsEarned

    return {
      sessionItems: {
        ...state.sessionItems,
        [itemKey]: {
          ...state.sessionItems[itemKey],
          count: newCount,
          points: newItemPoints,
        }
      },
      sessionTotalPoints: state.sessionTotalPoints + pointsEarned,
      sessionTotalMoney: state.sessionTotalMoney + moneyEarned,
    }
  }),

  // Actions: รีเซ็ตเซสชัน (เมื่อถอนเงินสำเร็จหรือเริ่มใหม่)
  resetSession: () => set({
    sessionItems: {
      glassBottle: { count: 0, points: 0 },
      plasticBottle: { count: 0, points: 0 },
      can: { count: 0, points: 0 },
    },
    sessionTotalPoints: 0,
    sessionTotalMoney: 0,
  }),

  // Getter: คำนวณยอดรวม
  getSessionSummary: () => {
    const state = get()
    const totalCount = state.sessionItems.glassBottle.count + 
                       state.sessionItems.plasticBottle.count + 
                       state.sessionItems.can.count
    // คำนวณเงินจาก total points (100 points = 1 บาท)
    const totalMoney = state.sessionTotalPoints / 100
    return {
      items: state.sessionItems,
      totalCount,
      totalPoints: state.sessionTotalPoints,
      totalMoney,
    }
  },
}))

export default useUserStore
