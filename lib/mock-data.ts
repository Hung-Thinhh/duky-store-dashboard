// ============================================================
// Mock Data for Duky Store Admin Dashboard
// ============================================================

export const kpiData = [
  {
    title: "Total Revenue",
    value: "$48,352.00",
    change: "+12.5%",
    trend: "up" as const,
    icon: "currency",
    description: "vs last month",
  },
  {
    title: "Orders",
    value: "1,284",
    change: "+8.2%",
    trend: "up" as const,
    icon: "orders",
    description: "vs last month",
  },
  {
    title: "Avg Order Value",
    value: "$37.66",
    change: "-2.1%",
    trend: "down" as const,
    icon: "receipt",
    description: "vs last month",
  },
  {
    title: "Total Customers",
    value: "3,847",
    change: "+15.3%",
    trend: "up" as const,
    icon: "customers",
    description: "vs last month",
  },
]

export const revenueChartData = [
  { date: "Jan", revenue: 18600, orders: 420 },
  { date: "Feb", revenue: 22400, orders: 480 },
  { date: "Mar", revenue: 19800, orders: 390 },
  { date: "Apr", revenue: 28200, orders: 520 },
  { date: "May", revenue: 32100, orders: 610 },
  { date: "Jun", revenue: 35800, orders: 680 },
  { date: "Jul", revenue: 29400, orders: 550 },
  { date: "Aug", revenue: 38200, orders: 720 },
  { date: "Sep", revenue: 42100, orders: 790 },
  { date: "Oct", revenue: 39600, orders: 740 },
  { date: "Nov", revenue: 45300, orders: 850 },
  { date: "Dec", revenue: 48352, orders: 920 },
]

export const topProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    category: "Electronics",
    sales: 342,
    revenue: "$17,100",
    percentage: 100,
    color: "#F97316",
  },
  {
    id: 2,
    name: "Organic Cotton T-Shirt",
    category: "Fashion",
    sales: 281,
    revenue: "$8,430",
    percentage: 82,
    color: "#1A73E8",
  },
  {
    id: 3,
    name: "Smart Watch Pro",
    category: "Electronics",
    sales: 198,
    revenue: "$15,840",
    percentage: 58,
    color: "#188038",
  },
  {
    id: 4,
    name: "Minimalist Backpack",
    category: "Accessories",
    sales: 176,
    revenue: "$7,040",
    percentage: 51,
    color: "#F9AB00",
  },
  {
    id: 5,
    name: "Ceramic Coffee Mug Set",
    category: "Home & Living",
    sales: 154,
    revenue: "$4,620",
    percentage: 45,
    color: "#A142F4",
  },
]

export type OrderStatus = "completed" | "processing" | "pending" | "cancelled"
export type PaymentStatus = "paid" | "unpaid" | "refunded"
export type PaymentMethod = "COD" | "Bank Transfer" | "Credit Card"

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: string
}

export interface Order {
  id: string
  customer: string
  email: string
  phone: string
  address: string
  product: string
  items: OrderItem[]
  amount: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  date: string
  notes?: string
}

export const recentOrders: Order[] = [
  {
    id: "ORD-7291",
    customer: "Nguyễn Văn An",
    email: "an.nguyen@email.com",
    phone: "0901234567",
    address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
    product: "Premium Wireless Headphones",
    items: [
      { id: "ITM-1", name: "Premium Wireless Headphones", quantity: 1, price: "$149.00" }
    ],
    amount: "$149.00",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "Credit Card",
    date: "2026-05-09",
    notes: "Khách VIP, giao hàng cẩn thận."
  },
  {
    id: "ORD-7290",
    customer: "Trần Thị Mai",
    email: "mai.tran@email.com",
    phone: "0987654321",
    address: "45 Lê Lợi, Quận 1, TP.HCM",
    product: "Smart Watch Pro × 2",
    items: [
      { id: "ITM-2", name: "Smart Watch Pro", quantity: 2, price: "$199.00" }
    ],
    amount: "$398.00",
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "Bank Transfer",
    date: "2026-05-09",
  },
  {
    id: "ORD-7289",
    customer: "Lê Hoàng Dũng",
    email: "dung.le@email.com",
    phone: "0912345678",
    address: "789 Điện Biên Phủ, Bình Thạnh, TP.HCM",
    product: "Organic Cotton T-Shirt × 3",
    items: [
      { id: "ITM-3", name: "Organic Cotton T-Shirt", quantity: 3, price: "$29.90" }
    ],
    amount: "$89.70",
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "COD",
    date: "2026-05-08",
  },
  {
    id: "ORD-7288",
    customer: "Phạm Minh Tuấn",
    email: "tuan.pham@email.com",
    phone: "0933445566",
    address: "12 Hai Bà Trưng, Hoàn Kiếm, Hà Nội",
    product: "Minimalist Backpack",
    items: [
      { id: "ITM-4", name: "Minimalist Backpack", quantity: 1, price: "$79.00" }
    ],
    amount: "$79.00",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "Credit Card",
    date: "2026-05-08",
  },
  {
    id: "ORD-7287",
    customer: "Hoàng Thu Hương",
    email: "huong.hoang@email.com",
    phone: "0944556677",
    address: "34 Trần Phú, Hải Châu, Đà Nẵng",
    product: "Ceramic Coffee Mug Set",
    items: [
      { id: "ITM-5", name: "Ceramic Coffee Mug Set", quantity: 1, price: "$45.00" }
    ],
    amount: "$45.00",
    status: "cancelled",
    paymentStatus: "refunded",
    paymentMethod: "Bank Transfer",
    date: "2026-05-07",
    notes: "Khách đổi ý không mua nữa."
  },
  {
    id: "ORD-7286",
    customer: "Võ Đình Khoa",
    email: "khoa.vo@email.com",
    phone: "0977889900",
    address: "56 Nguyễn Huệ, Quận 1, TP.HCM",
    product: "Premium Wireless Headphones",
    items: [
      { id: "ITM-1", name: "Premium Wireless Headphones", quantity: 1, price: "$149.00" }
    ],
    amount: "$149.00",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "Credit Card",
    date: "2026-05-07",
  },
  {
    id: "ORD-7285",
    customer: "Đặng Thị Hoa",
    email: "hoa.dang@email.com",
    phone: "0909090909",
    address: "89 Lê Duẩn, Quận 1, TP.HCM",
    product: "Organic Cotton T-Shirt",
    items: [
      { id: "ITM-3", name: "Organic Cotton T-Shirt", quantity: 1, price: "$29.90" }
    ],
    amount: "$29.90",
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "COD",
    date: "2026-05-06",
  },
  {
    id: "ORD-7284",
    customer: "Bùi Văn Thành",
    email: "thanh.bui@email.com",
    phone: "0911223344",
    address: "102 Pastuer, Quận 3, TP.HCM",
    product: "Smart Watch Pro",
    items: [
      { id: "ITM-2", name: "Smart Watch Pro", quantity: 1, price: "$199.00" }
    ],
    amount: "$199.00",
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "Credit Card",
    date: "2026-05-06",
  },
  {
    id: "ORD-7283",
    customer: "Ngô Quang Huy",
    email: "huy.ngo@email.com",
    phone: "0966778899",
    address: "220 Cầu Giấy, Hà Nội",
    product: "Minimalist Backpack, T-Shirt",
    items: [
      { id: "ITM-4", name: "Minimalist Backpack", quantity: 1, price: "$79.00" },
      { id: "ITM-3", name: "Organic Cotton T-Shirt", quantity: 1, price: "$29.90" }
    ],
    amount: "$108.90",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "Bank Transfer",
    date: "2026-05-05",
  },
  {
    id: "ORD-7282",
    customer: "Trương Ngọc Ánh",
    email: "anh.truong@email.com",
    phone: "0988112233",
    address: "45 Tôn Đức Thắng, Quận 1, TP.HCM",
    product: "Ceramic Coffee Mug Set × 2",
    items: [
      { id: "ITM-5", name: "Ceramic Coffee Mug Set", quantity: 2, price: "$45.00" }
    ],
    amount: "$90.00",
    status: "cancelled",
    paymentStatus: "refunded",
    paymentMethod: "Credit Card",
    date: "2026-05-04",
    notes: "Sản phẩm bị lỗi đóng gói."
  },
  {
    id: "ORD-7281",
    customer: "Lý Hải",
    email: "hai.ly@email.com",
    phone: "0900111222",
    address: "300 Lý Thường Kiệt, Tân Bình, TP.HCM",
    product: "Premium Wireless Headphones, Smart Watch Pro",
    items: [
      { id: "ITM-1", name: "Premium Wireless Headphones", quantity: 1, price: "$149.00" },
      { id: "ITM-2", name: "Smart Watch Pro", quantity: 1, price: "$199.00" }
    ],
    amount: "$348.00",
    status: "processing",
    paymentStatus: "paid",
    paymentMethod: "Bank Transfer",
    date: "2026-05-03",
  },
  {
    id: "ORD-7280",
    customer: "Vũ Bảo Ngọc",
    email: "ngoc.vu@email.com",
    phone: "0944111333",
    address: "15 Kim Mã, Ba Đình, Hà Nội",
    product: "Organic Cotton T-Shirt × 5",
    items: [
      { id: "ITM-3", name: "Organic Cotton T-Shirt", quantity: 5, price: "$29.90" }
    ],
    amount: "$149.50",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "COD",
    date: "2026-05-02",
  },
]

export const lowStockItems = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    sku: "EL-WH-001",
    stock: 3,
    threshold: 10,
    category: "Electronics",
  },
  {
    id: 2,
    name: "Organic Cotton T-Shirt (M)",
    sku: "FA-TS-002M",
    stock: 5,
    threshold: 20,
    category: "Fashion",
  },
  {
    id: 3,
    name: "Ceramic Coffee Mug Set",
    sku: "HL-MG-005",
    stock: 8,
    threshold: 15,
    category: "Home & Living",
  },
  {
    id: 4,
    name: "Smart Watch Pro - Black",
    sku: "EL-SW-003B",
    stock: 2,
    threshold: 10,
    category: "Electronics",
  },
]

export const salesChannels = [
  { name: "Website", revenue: 28400, percentage: 58, color: "#F97316" },
  { name: "Ứng dụng mobile", revenue: 12200, percentage: 25, color: "#1A73E8" },
  { name: "Mạng xã hội", revenue: 5100, percentage: 11, color: "#188038" },
  { name: "Marketplace", revenue: 2652, percentage: 6, color: "#F9AB00" },
]

export const customerInsights = {
  newCustomers: 847,
  returningCustomers: 3000,
  repeatRate: "78%",
  avgLifetimeValue: "$245.00",
  avgSessions: 4.2,
  satisfactionScore: 4.6,
}

export const quickActions = [
  {
    title: "Add Product",
    description: "Create a new product listing",
    icon: "plus",
  },
  {
    title: "Create Order",
    description: "Manually create an order",
    icon: "order",
  },
  {
    title: "Add Coupon",
    description: "Create a discount code",
    icon: "coupon",
  },
  {
    title: "View Reports",
    description: "Generate sales report",
    icon: "report",
  },
]
