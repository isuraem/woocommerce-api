const BadRequestException = require('./../../util/exceptions/badRequestException');
const WooCommerce = require('./../../util/constants/woocommerce');  // Correct the path as needed
const axios = require('axios');
const he = require('he');

module.exports.getOrderWoocommerce = async (requestBody) => {
    try {
        console.log("Data", requestBody);
        let billingData = requestBody.billing;
        const deliveryAddress = {
            "name": `${billingData.first_name || ""} ${billingData.last_name || ""}`,
            "contact": `${billingData.first_name || ""}`,
            "address1": `${billingData.address_1 || ""}`,
            "address2": `${billingData.address_2 || ""}`,
            "town": `${billingData.city || ""}`,
            "postcode": `${billingData.postcode || ""}`,
            "email": `${billingData.email || ""}`,
            "telephone": `${billingData.phone || ""}`,
            "county": `${billingData.country || ""}`,
            "orderTypeId": 2
        };

        console.log("dilvery data ", deliveryAddress)

        // Fetch the product and variant data (assuming this returns a list of products with variants)
        const productAndVariantsData = await getTenProductsWithVariants();

        // Initialize an array to store the results for all line items
        const matchingVariantsData = [];

        // Iterate over all line items in the order
        for (const lineItem of requestBody.line_items) {
            const sku = lineItem.sku;

            // Get matching variant for each SKU from the product and variants data
            const matchingVariant = await getMatchingVariant(sku, productAndVariantsData);

            // Push the matching variant details to the result array
            matchingVariantsData.push({
                line_item: lineItem, // Original line item data
                matching_variant: matchingVariant[0] // Matching variant details
            });
        }

        console.log("Matching Variants Data", matchingVariantsData);

        matchingVariantsData.forEach(async variants => {

            const data = {
                "supplierId": variants.matching_variant.sd_id,
                "supplierContactId": variants.matching_variant.sc_id,
                "deliveryAddress": deliveryAddress,
                "lines": [
                    {
                        "variantId": variants.matching_variant.vad_id,
                        "qtyOrdered": variants.line_item.quantity,
                        "vatRateId": variants.matching_variant.vr_id,
                        "stockLocationId": variants.matching_variant.sl_id,
                        "binNumberId": variants.matching_variant.vsl_bn_id,
                        "unitCost" : variants.matching_variant.vapi_estimated_cost
                    }
                ]

            }

            const stockData = {
                "stockLocationID": variants.matching_variant.sl_id,
                "binID": variants.matching_variant.vsl_bn_id,
                "quantity": variants.line_item.quantity,
                "variantID": variants.matching_variant.vad_id
            }

            const newAddedResponse = await addOrderIntoOW(data);

            if(newAddedResponse){
                await reduceVariantStock(stockData)
            }
            console.log("new added :", newAddedResponse)

        });

        return {
            msg: 'Successfully retrieved order details and matching variants',
            data: matchingVariantsData // Return the matching variants for all line items
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get order details or another error occurred');
    }
};

async function addOrderIntoOW(requestBody) {
    try {
        // Basic validation to ensure all required IDs are present and valid
        const requiredFields = ['supplierId', 'orderTypeId', 'variantId', 'vatRateId', 'stockLocationId', 'binNumberId'];

        const today = new Date();
        const formattedDate = today.toISOString().slice(0, 19);
        console.log(formattedDate);
        requestBody.lines[0].datePromised = formattedDate;
        requestBody.lines[0].dateRequired = formattedDate;

        console.log("Validated Data", requestBody);

        const addingorder = await axios.post(`http://31.216.7.186/OWAPItest/purchasing/purchase-orders`, requestBody, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        return addingorder.data
        console.log("data", addingorder)

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to add order');
    }
};

async function reduceVariantStock(requestBody) {
    try {

        console.log("Validated Data", requestBody);

        const addingorder = await axios.post(`http://31.216.7.186/OWAPITest/stock/adjust-stock-out`, requestBody, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });


    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to reduce the stock');
    }
};

module.exports.addOrderOW = async (requestBody) => {
    try {
        // Basic validation to ensure all required IDs are present and valid
        const requiredFields = ['supplierId', 'orderTypeId', 'variantId', 'vatRateId', 'stockLocationId', 'binNumberId'];

        const today = new Date();
        const formattedDate = today.toISOString().slice(0, 19);
        console.log(formattedDate);
        requestBody.lines[0].datePromised = formattedDate;
        requestBody.lines[0].dateRequired = formattedDate;

        console.log("Validated Data", requestBody);

        const addingorder = await axios.post(`http://31.216.7.186/OWAPItest/purchasing/purchase-orders`, requestBody, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("data", addingorder)
        return {
            msg: 'Successfully added order',
            data: addingorder.data
        };

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to add order');
    }
};


async function getTenProductsWithVariants() {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/66`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        // Assuming productDetails.data contains an array of products with potential variants
        const products = productDetails.data;

        // Group variants under their main product by 'productId' or similar unique identifier
        const productMap = new Map();
        products.forEach(product => {
            const productId = product.pd_id; // Use the appropriate unique product identifier
            if (!productMap.has(productId)) {
                productMap.set(productId, {
                    mainProduct: product, // or however you want to represent the main product
                    variants: [product] // Initialize variants array with the product itself
                });
            } else {
                productMap.get(productId).variants.push(product); // Add variant to the existing product
            }
        });

        // Get the first 10 unique products and their variants
        const first10UniqueProducts = Array.from(productMap.values()).slice(0, 4);

        return first10UniqueProducts

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product details');
    }
}


async function getMatchingVariant(requestVariantSku, orderwiseProducts) {
    try {
        const variantSku = requestVariantSku.split('_')[1];

        // Filter and return only the matching variants based on the variant vad_id
        const matchedVariants = orderwiseProducts.reduce((acc, orderwiseProduct) => {
            if (orderwiseProduct.variants && Array.isArray(orderwiseProduct.variants)) {
                const matchingVariants = orderwiseProduct.variants.filter(variant => {
                    const orderwisePdId = String(variant.vad_id); // Convert vad_id to string
                    return orderwisePdId === variantSku; // Compare the vad_id with the extracted variant SKU
                });

                // If there's a matching variant, add it to the accumulator
                if (matchingVariants.length > 0) {
                    acc.push(...matchingVariants); // Add matching variants to the accumulator
                }
            }
            return acc;
        }, []);

        return matchedVariants; // Return only the matched variant(s)

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to compare products');
    }
}
