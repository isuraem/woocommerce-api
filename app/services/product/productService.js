const BadRequestException = require('./../../util/exceptions/badRequestException');
const WooCommerce = require('./../../util/constants/woocommerce');  // Correct the path as needed
const axios = require('axios');

module.exports.addProduct = async (requestBody) => {
    try {
        const {
            name,
            type,
            regular_price,
            description,
            short_description,
            categories,
            images,
            attributes,
            variations,
            stock_status,
            manage_stock,
            stock_quantity
        } = requestBody;

        let data = {
            name: name,
            type: type,
            regular_price: regular_price,
            description: description,
            short_description: short_description,
            categories: categories,
            images: images,
            attributes: attributes,
            variations: variations,
            stock_status: stock_status,
            manage_stock: manage_stock ? manage_stock : false,
            stock_quantity: stock_quantity ? stock_quantity : 0
        };

        const response = await WooCommerce.post("products", data);
        console.log(response.data);

        return {
            msg: 'Successfully created.',
            data: response.data
        };
    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to create product');
    }
};


module.exports.statusProduct = async (requestBody) => {
    try {
        console.log("status", requestBody);

        return {
            msg: 'Status product',
            data: requestBody
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to status product');
    }
};


module.exports.addProductVariant = async (requestBody) => {
    try {
        const {
            regular_price,
            attributes,
            image,
            product_id,
        } = requestBody;

        const data = {
            regular_price: regular_price,
            image: image,
            attributes: attributes
        };

        const response = await WooCommerce.post(`products/${product_id}/variations`, data);
        console.log(response.data);

        return {
            msg: 'Successfully add variations',
            data: response.data
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to create product');
    }
};

module.exports.getProduct = async (requestBody) => {
    try {
        const {
            product_id
        } = requestBody;

        const response = await WooCommerce.get(`products/${product_id}`);
        console.log(response.data);

        return {
            msg: 'Successfully get product',
            data: response.data
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product');
    }
};

// module.exports.addProductUsingOrderwise = async (requestBody) => {
//     try {
//         const {
//             product_id
//         } = requestBody;

      

//         return {
//             msg: 'Successfully Add product',
//         };

//     } catch (error) {
//         if (error.response && error.response.data) {
//             console.error(error.response.data);
//         } else {
//             console.error(error);
//         }
//         throw new BadRequestException('Failed to get product');
//     }
// };

module.exports.addProductUsingOrderwise = async (requestBody) => {
    try {
        const { product_id } = requestBody;


        const variantsResponse = await axios.get(`http://31.216.7.186/OWAPI/products/${product_id}/variants`, {
            headers: {
                'Authorization': `Bearer ${process.env.Token}`, 
            }
        });
        // console.log("data", variantsResponse.data)

        const variants = variantsResponse.data;
        if (variants.length === 0) {
            return {
                msg: 'No variants found for this product',
            };
        }

        const variantID = variants[0].variantID
        const variantsFullDetailsResponse = await axios.get(`http://31.216.7.186/OWAPI/variants/${variantID}`, {
            headers: {
                'Authorization': `Bearer ${process.env.Token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!variantsFullDetailsResponse.data) {
            return {
                msg: 'No variants found for this product',
            };
        }

        const variantsStockDetailsResponse = await axios.get(`http://31.216.7.186/OWAPI/stock/${variantID}`, {
            headers: {
                'Authorization': `Bearer ${process.env.Token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("data", variantsStockDetailsResponse.data)
        let variantDetailsStockData = null
        if(variantsStockDetailsResponse.data.length > 1) {
            let stock = null
            for(let i = 0; i < variantsStockDetailsResponse.data.length; i++){
                stock += variantsStockDetailsResponse.data[i].freeStock
            }
            variantDetailsStockData = stock
        }

        if(variantsStockDetailsResponse.length === 1) {
            variantDetailsStockData =  variantsStockDetailsResponse.data[0].freeStock
        }

        console.log("stock",variantDetailsStockData)
        const variantDetailsInfoData = variantsFullDetailsResponse.data[0].variantInfo
        const variantDetailsPurchaseData = variantsFullDetailsResponse.data[0].variantPurchaseSettings

        const returnData = {
            name : variantDetailsInfoData.description,
            type : "simple",
            regular_price: String(variantDetailsPurchaseData.estimatedCost),
            description: variantDetailsInfoData.description,
            short_description: variantDetailsInfoData.description,
            categories: [
                {
                  "id": 68 
                }
            ],
            stock_status: "instock",
            manage_stock: true,
            stock_quantity: variantDetailsStockData
        }
        console.log("Return data",returnData)
        const WooCommerceResponse = await WooCommerce.post("products", returnData);
        console.log(WooCommerceResponse.data);

        return {
            msg: 'Successfully created.',
            data: WooCommerceResponse.data
        };
        // // Add variants to WooCommerce
        // const wooCommerceResponse = await axios.post('https://your-woocommerce-site/wp-json/wc/v3/products/22/variations', variants, {
        //     headers: {
        //         'Authorization': 'Bearer your_woocommerce_auth_token', // Replace with actual WooCommerce auth token
        //         'Content-Type': 'application/json'
        //     }
        // });

        // // Assuming the response from WooCommerce will give some indication of success
        // if (wooCommerceResponse.status === 201) {
        //     return {
        //         msg: 'Successfully added product variants to WooCommerce',
        //     };
        // } else {
        //     throw new Error('Failed to add product variants to WooCommerce');
        // }

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to add product variants');
    }
};
