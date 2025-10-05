import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Get all payments with user information for admin dashboard
export const getAllPayments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate, 
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { emailAddress: { contains: search, mode: 'insensitive' } } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { mpesaReceiptNumber: { contains: search, mode: 'insensitive' } },
        { accountReference: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              emailAddress: true,
              phoneNumber: true,
              role: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limitNum
      }),
      prisma.payment.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Get payment statistics and analytics
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      totalRevenue,
      averagePayment,
      paymentsByStatus,
      recentPayments
    ] = await Promise.all([
      // Total payments count
      prisma.payment.count({ where }),
      
      // Successful payments
      prisma.payment.count({ 
        where: { ...where, status: 'SUCCESS' } 
      }),
      
      // Pending payments
      prisma.payment.count({ 
        where: { ...where, status: 'PENDING' } 
      }),
      
      // Failed payments
      prisma.payment.count({ 
        where: { ...where, status: 'FAILED' } 
      }),
      
      // Total revenue (sum of successful payments)
      prisma.payment.aggregate({
        where: { ...where, status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      
      // Average payment amount
      prisma.payment.aggregate({
        where: { ...where, status: 'SUCCESS' },
        _avg: { amount: true }
      }),
      
      // Payments grouped by status
      prisma.payment.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        _sum: { amount: true }
      }),
      
      // Recent payments (last 10)
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              emailAddress: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Calculate success rate
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalPayments,
          successfulPayments,
          pendingPayments,
          failedPayments,
          successRate: Math.round(successRate * 100) / 100
        },
        financial: {
          totalRevenue: totalRevenue._sum.amount || 0,
          averagePayment: averagePayment._avg.amount || 0
        },
        breakdown: paymentsByStatus,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics',
      error: error.message
    });
  }
};

// Get payment by ID with full details
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            emailAddress: true,
            phoneNumber: true,
            role: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment details',
      error: error.message
    });
  }
};

// Generate payment report (CSV/Excel format)
export const generatePaymentReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      format = 'json' 
    } = req.query;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            emailAddress: true,
            phoneNumber: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Payment ID',
        'User Name',
        'Email',
        'Phone',
        'Amount',
        'Status',
        'Mpesa Receipt',
        'Transaction Date',
        'Created Date'
      ].join(',');

      const csvRows = payments.map(payment => [
        payment.id,
        `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim(),
        payment.user?.emailAddress || '',
        payment.phoneNumber || '',
        payment.amount,
        payment.status,
        payment.mpesaReceiptNumber || '',
        payment.transactionDate?.toISOString() || '',
        payment.createdAt.toISOString()
      ].map(field => `"${field}"`).join(','));

      const csv = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payment-report.csv');
      return res.send(csv);
    }

    // Default JSON format
    res.status(200).json({
      success: true,
      data: payments,
      reportInfo: {
        generatedAt: new Date().toISOString(),
        totalRecords: payments.length,
        dateRange: { startDate, endDate },
        status
      }
    });
  } catch (error) {
    console.error('Error generating payment report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating payment report',
      error: error.message
    });
  }
};
