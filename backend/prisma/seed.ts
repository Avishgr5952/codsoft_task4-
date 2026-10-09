import {
  PrismaClient,
  Role,
  VendorStatus,
  OrderStatus,
  PaymentStatus,
  PaymentRecordStatus,
  DeliveryStatus,
  DiscountType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MarketHub database...');

  // Common demo password: Password@123
  const defaultPassword = await bcrypt.hash('Password@123', 10);

  // 1. Create Users & Profiles
  console.log('Creating demo users...');

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@markethub.com' },
    update: {},
    create: {
      email: 'admin@markethub.com',
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'MarketHub',
      phone: '+1 555-0100',
      role: Role.ADMIN,
    },
  });

  // Customer User
  const customer = await prisma.user.upsert({
    where: { email: 'customer@markethub.com' },
    update: {},
    create: {
      email: 'customer@markethub.com',
      password: defaultPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 555-0101',
      role: Role.CUSTOMER,
      addresses: {
        create: {
          fullName: 'John Doe',
          phone: '+1 555-0101',
          addressLine1: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          postalCode: '97477',
          country: 'USA',
          isDefault: true,
        },
      },
    },
    include: { addresses: true },
  });

  // Delivery Partner User
  const deliveryUser = await prisma.user.upsert({
    where: { email: 'delivery@markethub.com' },
    update: {},
    create: {
      email: 'delivery@markethub.com',
      password: defaultPassword,
      firstName: 'Alex',
      lastName: 'Rider',
      phone: '+1 555-0102',
      role: Role.DELIVERY_PARTNER,
      deliveryPartner: {
        create: {
          vehicleType: 'Electric Van',
          vehicleNumber: 'MH-DEL-2026',
          licenseNumber: 'DL-987654321',
        },
      },
    },
    include: { deliveryPartner: true },
  });

  // Main Vendor User 1 (Electronics)
  const vendorUser1 = await prisma.user.upsert({
    where: { email: 'vendor@markethub.com' },
    update: {},
    create: {
      email: 'vendor@markethub.com',
      password: defaultPassword,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      phone: '+1 555-0103',
      role: Role.VENDOR,
      vendorProfile: {
        create: {
          storeName: 'ElectroHub Technologies',
          slug: 'electrohub-technologies',
          description: 'Premium consumer electronics, gadgets, and computing accessories with warranty.',
          logoUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200&auto=format&fit=crop&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          status: VendorStatus.APPROVED,
          commissionRate: 10.0,
          isVerified: true,
        },
      },
    },
    include: { vendorProfile: true },
  });

  // Vendor User 2 (Fashion)
  const vendorUser2 = await prisma.user.upsert({
    where: { email: 'fashion@markethub.com' },
    update: {},
    create: {
      email: 'fashion@markethub.com',
      password: defaultPassword,
      firstName: 'Elena',
      lastName: 'Russo',
      phone: '+1 555-0104',
      role: Role.VENDOR,
      vendorProfile: {
        create: {
          storeName: 'UrbanStyle Apparel',
          slug: 'urbanstyle-apparel',
          description: 'Contemporary urban streetwear, sustainable essentials, and designer footwear.',
          logoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&auto=format&fit=crop&q=80',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          status: VendorStatus.APPROVED,
          commissionRate: 12.0,
          isVerified: true,
        },
      },
    },
    include: { vendorProfile: true },
  });

  // Vendor User 3 (Home & Living - Pending Approval for testing Admin approval)
  const vendorUser3 = await prisma.user.upsert({
    where: { email: 'homedecor@markethub.com' },
    update: {},
    create: {
      email: 'homedecor@markethub.com',
      password: defaultPassword,
      firstName: 'Marcus',
      lastName: 'Vance',
      phone: '+1 555-0105',
      role: Role.VENDOR,
      vendorProfile: {
        create: {
          storeName: 'Nova Home & Living',
          slug: 'nova-home-living',
          description: 'Handcrafted artisan furniture, lighting, and Scandinavian minimalist home decor.',
          city: 'Austin',
          state: 'TX',
          country: 'USA',
          status: VendorStatus.PENDING,
          commissionRate: 10.0,
          isVerified: false,
        },
      },
    },
    include: { vendorProfile: true },
  });

  // 2. Categories
  console.log('Creating product categories...');
  const categoriesData = [
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      description: 'Headphones, laptops, smartphones, smart home and computing accessories',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Fashion & Apparel',
      slug: 'fashion',
      description: 'Men and women modern clothing, jackets, footwear and accessories',
      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Modern cookware, aesthetic living decor, ergonomic furniture and lighting',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      description: 'Athletic wear, workout accessories, camping gear and fitness trackers',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Beauty & Wellness',
      slug: 'beauty-wellness',
      description: 'Organic skincare, aromatherapy, hair styling and wellness essentials',
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const categoryMap = new Map();
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoryMap.set(cat.slug, created);
  }

  // 3. Products
  console.log('Creating sample products...');
  const v1 = vendorUser1.vendorProfile!;
  const v2 = vendorUser2.vendorProfile!;

  const productsData = [
    {
      vendorId: v1.id,
      categoryId: categoryMap.get('electronics').id,
      name: 'AcousticPro Wireless Noise-Cancelling Headphones',
      slug: 'acousticpro-wireless-noise-cancelling-headphones',
      description: 'Flagship wireless headphones featuring active noise cancellation, 40-hour battery life, high-res audio codec support, and ultra-comfortable plush ear cushions.',
      price: 249.99,
      compareAtPrice: 299.99,
      discount: 16.7,
      sku: 'EH-NC-100',
      stock: 45,
      isFeatured: true,
      averageRating: 4.8,
      reviewCount: 14,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      ],
      specs: [
        { key: 'Connectivity', value: 'Bluetooth 5.3 & 3.5mm Aux' },
        { key: 'Battery Life', value: '40 Hours ANC On' },
        { key: 'Weight', value: '250g' },
      ],
    },
    {
      vendorId: v1.id,
      categoryId: categoryMap.get('electronics').id,
      name: 'UltraWide Curved 34-Inch 144Hz Gaming Monitor',
      slug: 'ultrawide-curved-34-inch-144hz-gaming-monitor',
      description: 'Immersive 3440x1440 WQHD panoramic display with 1ms response time, HDR400 color precision, and built-in USB-C 90W power delivery for laptops.',
      price: 549.00,
      compareAtPrice: 629.00,
      discount: 12.7,
      sku: 'EH-MON-340',
      stock: 12,
      isFeatured: true,
      averageRating: 4.9,
      reviewCount: 8,
      images: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
      ],
      specs: [
        { key: 'Resolution', value: '3440 x 1440 WQHD' },
        { key: 'Refresh Rate', value: '144Hz' },
        { key: 'Panel Type', value: 'IPS 1000R Curve' },
      ],
    },
    {
      vendorId: v1.id,
      categoryId: categoryMap.get('electronics').id,
      name: 'Mechanical RGB Hot-Swappable Tenkeyless Keyboard',
      slug: 'mechanical-rgb-hot-swappable-tkl-keyboard',
      description: 'Aluminum chassis keyboard with lubricated tactile switches, customizable per-key RGB backlighting, and detachable braided USB-C cable.',
      price: 119.50,
      compareAtPrice: 139.99,
      discount: 14.6,
      sku: 'EH-KB-870',
      stock: 4, // low stock for testing alert
      isFeatured: false,
      averageRating: 4.6,
      reviewCount: 5,
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      ],
      specs: [
        { key: 'Layout', value: 'TKL 87 Keys' },
        { key: 'Switches', value: 'Gateron Pro Yellow' },
      ],
    },
    {
      vendorId: v2.id,
      categoryId: categoryMap.get('fashion').id,
      name: 'Merino Wool Minimalist Zip Jacket',
      slug: 'merino-wool-minimalist-zip-jacket',
      description: 'Crafted from 100% sustainably sourced Australian Merino wool. Naturally temperature regulating, odor resistant, and tailored for effortless layering.',
      price: 159.00,
      compareAtPrice: 195.00,
      discount: 18.5,
      sku: 'US-JK-001',
      stock: 28,
      isFeatured: true,
      averageRating: 4.7,
      reviewCount: 9,
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
      ],
      specs: [
        { key: 'Material', value: '100% Merino Wool' },
        { key: 'Fit', value: 'Regular Modern Fit' },
      ],
    },
    {
      vendorId: v2.id,
      categoryId: categoryMap.get('fashion').id,
      name: 'Premium Everyday Canvas Sneaker',
      slug: 'premium-everyday-canvas-sneaker',
      description: 'Vulcanized natural rubber sole, organic heavy canvas upper, memory foam footbed, and water-repellent coating for all-day comfort.',
      price: 85.00,
      compareAtPrice: 99.00,
      discount: 14.1,
      sku: 'US-SNK-102',
      stock: 35,
      isFeatured: false,
      averageRating: 4.5,
      reviewCount: 11,
      images: [
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80',
      ],
      specs: [
        { key: 'Sole', value: 'Recycled Natural Rubber' },
        { key: 'Upper', value: 'Organic Cotton Canvas' },
      ],
    },
    {
      vendorId: v2.id,
      categoryId: categoryMap.get('fashion').id,
      name: 'Water-Resistant Commuter Rolltop Backpack',
      slug: 'water-resistant-commuter-rolltop-backpack',
      description: 'Weatherproof 25L commuter pack featuring a padded 16-inch laptop compartment, hidden security pocket, and ergonomic air-mesh shoulder straps.',
      price: 110.00,
      compareAtPrice: 130.00,
      discount: 15.4,
      sku: 'US-BP-500',
      stock: 18,
      isFeatured: true,
      averageRating: 4.9,
      reviewCount: 7,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      ],
      specs: [
        { key: 'Capacity', value: '25 Liters' },
        { key: 'Laptop Sleeve', value: 'Up to 16 inch' },
      ],
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        vendorId: p.vendorId,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        discount: p.discount,
        sku: p.sku,
        isPublished: true,
        isFeatured: p.isFeatured,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        images: {
          create: p.images.map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            sortOrder: idx,
          })),
        },
        specifications: {
          create: p.specs,
        },
        inventory: {
          create: {
            sku: p.sku,
            availableQuantity: p.stock,
            soldQuantity: 15,
            lowStockThreshold: 5,
          },
        },
      },
      include: { inventory: true },
    });
    createdProducts.push(product);
  }

  // 4. Coupons
  console.log('Creating coupons...');
  const coupons = [
    {
      code: 'WELCOME10',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 50,
      maxDiscount: 30,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
      isActive: true,
      vendorId: null, // Platform-wide
    },
    {
      code: 'TECH50',
      discountType: DiscountType.FIXED,
      discountValue: 50,
      minOrderAmount: 200,
      maxDiscount: 50,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 100,
      isActive: true,
      vendorId: v1.id, // ElectroHub exclusive
    },
    {
      code: 'STYLE20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minOrderAmount: 80,
      maxDiscount: 40,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      usageLimit: 200,
      isActive: true,
      vendorId: v2.id, // UrbanStyle exclusive
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // 5. Multi-Vendor Sample Completed Order
  console.log('Creating sample multi-vendor order...');
  const orderNumber = 'MH-202610-DEMO01';
  const existingOrder = await prisma.order.findUnique({
    where: { orderNumber },
  });

  if (!existingOrder) {
    const prod1 = createdProducts[0]; // ElectroHub ($249.99)
    const prod2 = createdProducts[3]; // UrbanStyle ($159.00)

    const subtotal = prod1.price + prod2.price; // 408.99
    const tax = parseFloat((subtotal * 0.05).toFixed(2)); // 20.45
    const shipping = 10.0;
    const discount = 0.0;
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));

    const demoOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        shippingAddress: {
          fullName: 'John Doe',
          phone: '+1 555-0101',
          addressLine1: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          postalCode: '97477',
          country: 'USA',
        },
        billingAddress: {
          fullName: 'John Doe',
          phone: '+1 555-0101',
          addressLine1: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          postalCode: '97477',
          country: 'USA',
        },
        payment: {
          create: {
            transactionId: 'TXN-MOCK-SEEDED-001',
            paymentMethod: 'CREDIT_CARD',
            amount: total,
            currency: 'USD',
            status: PaymentRecordStatus.COMPLETED,
          },
        },
        deliveries: {
          create: {
            deliveryPartnerId: deliveryUser.deliveryPartner!.id,
            status: DeliveryStatus.DELIVERED,
            actualDelivery: new Date(),
            deliveryNotes: 'Left at front porch as requested.',
          },
        },
      },
    });

    // Create ElectroHub vendor order
    const comm1 = parseFloat(((prod1.price * v1.commissionRate) / 100).toFixed(2));
    const vo1 = await prisma.vendorOrder.create({
      data: {
        orderId: demoOrder.id,
        vendorId: v1.id,
        subtotal: prod1.price,
        commission: comm1,
        netEarnings: parseFloat((prod1.price - comm1).toFixed(2)),
        status: OrderStatus.DELIVERED,
        trackingNumber: 'TRK-EH-882910',
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: demoOrder.id,
        vendorOrderId: vo1.id,
        productId: prod1.id,
        productName: prod1.name,
        productSku: prod1.sku,
        productPrice: prod1.price,
        quantity: 1,
        totalPrice: prod1.price,
      },
    });

    // Create UrbanStyle vendor order
    const comm2 = parseFloat(((prod2.price * v2.commissionRate) / 100).toFixed(2));
    const vo2 = await prisma.vendorOrder.create({
      data: {
        orderId: demoOrder.id,
        vendorId: v2.id,
        subtotal: prod2.price,
        commission: comm2,
        netEarnings: parseFloat((prod2.price - comm2).toFixed(2)),
        status: OrderStatus.DELIVERED,
        trackingNumber: 'TRK-US-102934',
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: demoOrder.id,
        vendorOrderId: vo2.id,
        productId: prod2.id,
        productName: prod2.name,
        productSku: prod2.sku,
        productPrice: prod2.price,
        quantity: 1,
        totalPrice: prod2.price,
      },
    });

    // Create verified purchase reviews
    await prisma.review.create({
      data: {
        productId: prod1.id,
        userId: customer.id,
        rating: 5,
        title: 'Exceptional ANC and Soundstage',
        comment: 'The noise cancellation blocks out all office hum. Very comfortable for long sessions and battery lasts over a week between charges!',
        isVerifiedPurchase: true,
      },
    });

    await prisma.review.create({
      data: {
        productId: prod2.id,
        userId: customer.id,
        rating: 5,
        title: 'Outstanding quality and fit',
        comment: 'High quality merino wool feel. Warm yet breathable. Extremely satisfied with the purchase.',
        isVerifiedPurchase: true,
      },
    });
  }

  // 6. Platform Settings
  console.log('Configuring platform settings...');
  const settings = [
    { key: 'platform_name', value: 'MarketHub', description: 'Public Marketplace Title' },
    { key: 'commission_percent', value: '10', description: 'Default Platform Commission %' },
    { key: 'support_email', value: 'support@markethub.com', description: 'Customer Support Email' },
    { key: 'currency', value: 'USD', description: 'Store base currency' },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log('Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('DEMO ACCOUNTS (Password for all: Password@123):');
  console.log('Admin:    admin@markethub.com');
  console.log('Vendor:   vendor@markethub.com');
  console.log('Customer: customer@markethub.com');
  console.log('Delivery: delivery@markethub.com');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
