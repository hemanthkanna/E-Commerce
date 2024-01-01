const express = require("express");
const { isAuthenticatedUser } = require("../middlewares/authenticate");
const {
  processPayement,
  sendStripeApi,
} = require("../controllers/paymentController");
const router = express.Router();

router.route("/payment/process").post(isAuthenticatedUser, processPayement);
router.route("/stripeapi").get(isAuthenticatedUser, sendStripeApi);

module.exports = router;
