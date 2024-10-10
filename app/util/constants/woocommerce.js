const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
require('dotenv').config();

const WooCommerce = new WooCommerceRestApi({
    url: process.env.SITE_URL,
    consumerKey: process.env.CONSUMERKEY,
    consumerSecret: process.env.CONSUMERSECRET,
    version: "wc/v3"
});

module.exports = WooCommerce;
