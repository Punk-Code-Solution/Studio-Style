const { Product } = require("../Database/models");

class productRepository{

  async findAll(){

    return await Product.findAll();
    
  }  

  async findAllLimit(limit = 10, base = 0){

    return await Product.findAll({

      limit: limit,
      offset: base

    });
    
  }

  async findProduct(id) {
    return await Product.findOne({ 

      where:{

        id : id

      }

     });

  }
    
  async addProduct(product) {

    const {

      purchase_id,
      liters,
      weight,
      name,
      priceTotal,
      amount ,
      description,
      tipeProduct,
      brand,
      date_validity

    } = product

    return await Product.create({

      purchase_id,
      liters,
      weight,
      name,
      priceTotal,
      amount ,
      description,
      tipeProduct,
      brand,
      date_validity

    }).then();

  }
    
  async updateProduct(product) {

    await Product.update(

      {
        
        purchase_id: product.purchase_id  ? product.purchase_id : Product.purchase_id,
        liters: product.liters ? product.liters : Product.liters,
        weight: product.weight ? product.weight : Product.weight,
        name: product.name ? product.name : Product.name,
        priceTotal: product.priceTotal ? product.priceTotal : Product.priceTotal,
        amount: product.amount ? product.amount : Product.amount,
        description: product.description ? product.description : Product.description,
        tipeProduct: product.tipeProduct ? product.tipeProduct : Product.tipeProduct,
        brand: product.brand ? product.brand : Product.brand,
        date_validity: product.date_validity ? product.date_validity : Product.date_validity,
        
      },
      {
        where: {

            id: product.id

        }

      }

    );
  
    return await Product.findOne({

      where:{

        id : product.id

      }

    });

  }
    
  async deleteProduct(id) {

    await Product.destroy({

      where: {

        id: id

      }

    });

  }

}

module.exports = productRepository;