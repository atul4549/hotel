const validatePayment = (req, res, next) => {
  const { amount, userId, currency } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid amount is required'
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  if (currency && currency !== 'INR') {
    return res.status(400).json({
      success: false,
      message: 'Only INR currency is supported'
    });
  }

  next();
};

const validateTicket = (req, res, next) => {
  const { userId, paymentId, productDetails, amount } = req.body;

  if (!userId || !paymentId || !productDetails || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, paymentId, productDetails, amount'
    });
  }

  if (!productDetails.name) {
    return res.status(400).json({
      success: false,
      message: 'Product name is required'
    });
  }

  next();
};

export{ validatePayment, validateTicket };