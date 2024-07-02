const express = require('express');
const app = express();
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
require('dotenv').config();

var appController = require("./app/app");

const port = process.env.port;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

console.log("data",process.env.site_url)

// const WooCommerce = new WooCommerceRestApi({
//     url: process.env.site_url,
//     consumerKey: process.env.consumerKey,
//     consumerSecret: process.env.consumerSecret,
//     version: "wc/v3"
// });

app.use("/api", appController);


// module.exports = WooCommerce;

// const data = {
//     name: "Premium Quality Short",
//     type: "simple",
//     regular_price: "21.99",
//     description: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.",
//     short_description: "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
//     categories: [
//       {
//         id: 9
//       },
//       {
//         id: 14
//       }
//     ],
//     images: [
//       {
//         src: "http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_2_front.jpg"
//       },
//       {
//         src: "http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_2_back.jpg"
//       }
//     ]
//   };

// WooCommerce.post("products", data)
//   .then((response) => {
//     console.log(response.data);
//   })
//   .catch((error) => {
//     console.log(error.response.data);
//   });
