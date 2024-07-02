// const BadRequestException = require('./../../util/exceptions/badRequestException');
// const WooCommerce = require('../../../server')

// module.exports.addProduct = async (requestBody) => {

//     try {
//         const {
//             name,
//             type,
//             regular_price,
//             description,
//             short_description,
//             categories,
//             images
//         } = requestBody;

//         let data = {
//             name: name,
//             type: type,
//             regular_price: regular_price,
//             description: description,
//             short_description: short_description,
//             categories: categories,
//             images: images
//         };
//         //create new product

//         WooCommerce.post("products", data)
//             .then((response) => {
//                 console.log(response.data);
//             })
//             .catch((error) => {
//                 console.log(error.response.data);
//             });

//         return {
//             msg: 'Successfully created.'

//         };

//     } catch (err) {
//         throw err;
//     } 
// };

const BadRequestException = require('./../../util/exceptions/badRequestException');
const WooCommerce = require('./../../util/constants/woocommerce');  // Correct the path as needed

module.exports.addProduct = async (requestBody) => {
    try {
        const {
            name,
            type,
            regular_price,
            description,
            short_description,
            categories,
            images
        } = requestBody;

        let data = {
            name: name,
            type: type,
            regular_price: regular_price,
            description: description,
            short_description: short_description,
            categories: categories,
            images: images
        };

        const response = await WooCommerce.post("products", data);
        console.log(response.data);

        return {
            msg: 'Successfully created.'
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
        console.log("status",requestBody);
        return {
            msg: 'Successfully created.'
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
