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
        const productAndVariantsData = await getTenProductsWithVariantsOW();

        const simpleProductData = await getTenSimpleProductOW();

        // Initialize an array to store the results for all line items
        const matchingVariantsData = [];

        for (const lineItem of requestBody.line_items) {
            const sku = lineItem.sku;
            let matchingVariant = null;
        
            if (lineItem.variation_id !== 0) {
                // Try to get a matching variant for SKUs with a variation ID
                matchingVariant = await getMatchingVariant(sku, productAndVariantsData);
            }
        
            // If no matching variant was found, try to get a simple product variant
            else {
                matchingVariant = await getMatchingSimpleVariant(sku, simpleProductData);
            }
        
            // Push the matching variant details to the result array
            matchingVariantsData.push({
                line_item: lineItem,              // Original line item data
                matching_variant: matchingVariant ? matchingVariant[0] : null // Matching variant details
            });
        }

        console.log("Matching Variants Data", matchingVariantsData);
        console.log("Matching Variants Data length", matchingVariantsData.length);
        const totalShippingCost = requestBody.shipping_lines.reduce((sum, line) => sum + parseFloat(line.total), 0);
        let OrderGross = 0;
        let LineItems = [];
        let itemNumber = 0;
        for(const product of matchingVariantsData) {
            OrderGross =+ product.line_item.subtotal;
             // Parse the JSON string into an array of objects
            const stockLocations = JSON.parse(product.matching_variant.stock_locations);


            const availableLocation = getFirstAvailableStockLocation(stockLocations);

            let data = {
                variantCode : product.matching_variant.vad_variant_code,
                itemNumber: ++itemNumber,
                quantity: product.line_item.quantity,
                itemGross : product.matching_variant.vafp_rsp_exc_vat,
                taxRateId : product.matching_variant.vr_id,
                stockLocationId : availableLocation.id
            }
            LineItems.push(data)
        }
        let today = new Date();
        let datePart = today.toISOString().slice(2, 8).replace(/-/g, ""); // YYMMDD format
        let timePart = `${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}${String(today.getSeconds()).padStart(2, '0')}`;
        
        let generatedeCommerceOrderNumber = `${datePart}${timePart}`;
        let session_id = 1;
        
        let saleOrderData = {
            customer : {
                id : 1375
            },
            orderHeader: {
                systemOrderType: 1,
                deliveryMethodId: 1,
                orderGross: OrderGross,
                deliveryGross: totalShippingCost,
                eCommerceOrderNumber: generatedeCommerceOrderNumber,
                orderDate: new Date().toISOString().slice(0, -1),
            },
            customerDeliveryAddress: {
                deliveryName: deliveryAddress.name,
                contactName: deliveryAddress.contact,
                address1: deliveryAddress.address1,
                address2: deliveryAddress.address2,
                town: deliveryAddress.town,
                country: deliveryAddress.county,
                postcode: deliveryAddress.postcode,
                telephone: deliveryAddress.telephone,
                email: deliveryAddress.email,
                deliveryMethodId: 1
            },
            orderLines: LineItems,
            
        }

        try{
            await addSaleOrderIntoOW(saleOrderData, session_id);

        }catch(err){
            console.log("Error message: ", err);
            throw new BadRequestException('Failed to add order into OrderWise');
        }
        
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

// Function to get the first location with available stock
function getFirstAvailableStockLocation(stockLocations) {
    return stockLocations.find(location => location.free_stock > 0);
  }

async function addSaleOrderIntoOW(saleOrderDetails, sessionId) {
    try {
       
        console.log("Validated Data", saleOrderDetails);

        const addingorder = await axios.post(`http://31.216.7.186/OWAPItest/sales/order?session_id=${sessionId}`, saleOrderDetails, {
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


async function getTenProductsWithVariantsOW() {
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/70`, data, {
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
        const first10UniqueProducts = Array.from(productMap.values()).slice(0, 10);

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

async function getTenSimpleProductOW(){
    try {
        const data = [
            {
                name: "",
                value: null
            }
        ];

        const productDetails = await axios.post(`http://31.216.7.186/OWAPItest/system/export-definition/71`, data, {
            headers: {
                "Authorization": `Bearer ${process.env.TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        const firstTenProducts = productDetails.data.slice(0, 10);

        return firstTenProducts
            

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to get product details');
    }
};

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

async function getMatchingSimpleVariant(requestSimpleProductSku, orderwiseProducts) {
    try {
        // Extract the product SKU part after the underscore
        const simpleProductSku = requestSimpleProductSku.split('_')[1];
        console.log("new: ", simpleProductSku);
        console.log("length: ", orderwiseProducts.length);

        // Filter and return only the matching products based on pd_id
        const matchedVariants = orderwiseProducts.filter(orderwiseProduct => {
            const orderwisePdId = String(orderwiseProduct.pd_id); // Convert pd_id to string
            console.log("pro id: ", orderwiseProduct.pd_id);
            return orderwisePdId === simpleProductSku; // Compare the pd_id with the extracted SKU
        });

        return matchedVariants; 

    } catch (error) {
        if (error.response && error.response.data) {
            console.error(error.response.data);
        } else {
            console.error(error);
        }
        throw new BadRequestException('Failed to compare products');
    }
}
