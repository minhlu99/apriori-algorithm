/**
 * Datasets for Apriori Algorithm Presentation & Interactive Simulator
 * Includes 3 pre-loaded scenarios with realistic item metadata and icons.
 */

const PRESET_DATASETS = {
  supermarket: {
    id: 'supermarket',
    name: 'Siêu thị bán lẻ (Market Basket)',
    description: 'Dữ liệu giao dịch giỏ hàng thực tế với câu chuyện kinh điển Bia & Tã giấy.',
    defaultMinSupport: 40,    // 40%
    defaultMinConfidence: 60, // 60%
    itemMeta: {
      'Bánh mì': { icon: '🍞', category: 'Bakery' },
      'Bơ':      { icon: '🧈', category: 'Dairy' },
      'Sữa':     { icon: '🥛', category: 'Dairy' },
      'Bia':     { icon: '🍺', category: 'Beverage' },
      'Tã giấy': { icon: '👶', category: 'Baby' },
      'Trứng':   { icon: '🥚', category: 'Fresh' }
    },
    transactions: [
      { tid: 'T700', items: ['Bánh mì', 'Sữa'] },
      { tid: 'T600', items: ['Bia', 'Tã giấy'] },
      { tid: 'T500', items: ['Bánh mì', 'Bơ', 'Bia', 'Tã giấy'] },
      { tid: 'T400', items: ['Bánh mì', 'Sữa', 'Bia', 'Tã giấy'] },
      { tid: 'T300', items: ['Sữa', 'Bia', 'Tã giấy'] },
      { tid: 'T200', items: ['Bánh mì', 'Bơ'] },
      { tid: 'T100', items: ['Bánh mì', 'Bơ', 'Sữa'] }
    ]
  },

  tech: {
    id: 'tech',
    name: 'Cửa hàng Công nghệ (Tech Gear)',
    description: 'Hành vi mua sắm phụ kiện máy tính và thiết bị văn phòng hiện đại.',
    defaultMinSupport: 35,
    defaultMinConfidence: 65,
    itemMeta: {
      'Laptop':      { icon: '💻', category: 'Hardware' },
      'Chuột':       { icon: '🖱️', category: 'Peripheral' },
      'Bàn phím':    { icon: '⌨️', category: 'Peripheral' },
      'Lót chuột':   { icon: '⬛', category: 'Accessory' },
      'Tai nghe':    { icon: '🎧', category: 'Audio' },
      'Cáp Type-C':  { icon: '🔌', category: 'Cable' }
    },
    transactions: [
      { tid: 'T107', items: ['Laptop', 'Chuột', 'Bàn phím', 'Lót chuột'] },
      { tid: 'T106', items: ['Laptop', 'Tai nghe', 'Cáp Type-C'] },
      { tid: 'T105', items: ['Chuột', 'Lót chuột'] },
      { tid: 'T104', items: ['Laptop', 'Chuột', 'Lót chuột', 'Cáp Type-C'] },
      { tid: 'T103', items: ['Bàn phím', 'Tai nghe'] },
      { tid: 'T102', items: ['Laptop', 'Chuột', 'Bàn phím'] },
      { tid: 'T101', items: ['Laptop', 'Chuột', 'Lót chuột'] }
    ]
  },

  fastfood: {
    id: 'fastfood',
    name: 'Combo Thức Ăn Nhanh (Fast Food)',
    description: 'Phân tích các combo gọi món phổ biến tại chuỗi cửa hàng thức ăn nhanh.',
    defaultMinSupport: 40,
    defaultMinConfidence: 70,
    itemMeta: {
      'Burger':         { icon: '🍔', category: 'Main' },
      'Khoai tây':      { icon: '🍟', category: 'Side' },
      'Coca':           { icon: '🥤', category: 'Drink' },
      'Gà rán':         { icon: '🍗', category: 'Main' },
      'Kem':            { icon: '🍦', category: 'Dessert' }
    },
    transactions: [
      { tid: 'F08', items: ['Burger', 'Khoai tây', 'Coca'] },
      { tid: 'F07', items: ['Khoai tây', 'Kem'] },
      { tid: 'F06', items: ['Gà rán', 'Coca'] },
      { tid: 'F05', items: ['Burger', 'Khoai tây'] },
      { tid: 'F04', items: ['Burger', 'Khoai tây', 'Gà rán', 'Coca'] },
      { tid: 'F03', items: ['Gà rán', 'Khoai tây', 'Coca'] },
      { tid: 'F02', items: ['Burger', 'Coca'] },
      { tid: 'F01', items: ['Burger', 'Khoai tây', 'Coca'] }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.PRESET_DATASETS = PRESET_DATASETS;
} else if (typeof globalThis !== 'undefined') {
  globalThis.PRESET_DATASETS = PRESET_DATASETS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRESET_DATASETS };
}
