const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
require('dotenv').config();

const WooCommerce = new WooCommerceRestApi({
    url: process.env.site_url,
    consumerKey: process.env.consumerKey,
    consumerSecret: process.env.consumerSecret,
    version: "wc/v3"
});

module.exports = WooCommerce;
